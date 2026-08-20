package com.deepak.exchangeops.generator;

import com.deepak.exchangeops.domain.EventType;
import com.deepak.exchangeops.domain.MarketEvent;
import com.deepak.exchangeops.domain.Symbol;
import com.deepak.exchangeops.domain.Venue;
import com.deepak.exchangeops.dto.GeneratorStatusResponse;
import com.deepak.exchangeops.dto.MarketEventResponse;
import com.deepak.exchangeops.mapper.MarketEventMapper;
import com.deepak.exchangeops.repository.MarketEventRepository;
import com.deepak.exchangeops.repository.SymbolRepository;
import com.deepak.exchangeops.repository.VenueRepository;
import jakarta.annotation.PreDestroy;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Creates synthetic events for the portfolio demonstration.
 *
 * <p>Events are persisted before publication. This generator never
 * connects to a real venue or licensed market-data source.
 */
@Service
public class SyntheticEventGenerator {

  private static final Logger log =
      LoggerFactory.getLogger(SyntheticEventGenerator.class);

  private static final long MINIMUM_INTERVAL_MS = 250L;
  private static final long MAXIMUM_INTERVAL_MS = 60_000L;
  private static final int MINIMUM_EVENTS_PER_CYCLE = 1;
  private static final int MAXIMUM_EVENTS_PER_CYCLE = 25;

  private final MarketEventRepository eventRepository;
  private final VenueRepository venueRepository;
  private final SymbolRepository symbolRepository;
  private final MarketEventMapper eventMapper;
  private final SimpMessagingTemplate messagingTemplate;
  private final Clock clock;

  private final long intervalMs;
  private final int eventsPerCycle;
  private final Random random;
  private final AtomicLong generatedCount = new AtomicLong();
  private final AtomicLong lastSequenceNumber = new AtomicLong();

  private final ScheduledExecutorService scheduler;

  private GeneratorState state = GeneratorState.STOPPED;
  private ScheduledFuture<?> scheduledTask;

  public SyntheticEventGenerator(
      MarketEventRepository eventRepository,
      VenueRepository venueRepository,
      SymbolRepository symbolRepository,
      MarketEventMapper eventMapper,
      SimpMessagingTemplate messagingTemplate,
      Clock clock,
      @Value("${app.generator.interval-ms:1000}")
          long intervalMs,
      @Value("${app.generator.events-per-cycle:1}")
          int eventsPerCycle,
      @Value("${app.generator.random-seed:2026}")
          long randomSeed) {

    validateSettings(intervalMs, eventsPerCycle);

    this.eventRepository = eventRepository;
    this.venueRepository = venueRepository;
    this.symbolRepository = symbolRepository;
    this.eventMapper = eventMapper;
    this.messagingTemplate = messagingTemplate;
    this.clock = clock;
    this.intervalMs = intervalMs;
    this.eventsPerCycle = eventsPerCycle;
    this.random = new Random(randomSeed);

    ThreadFactory threadFactory =
        runnable -> {
          Thread thread =
              new Thread(runnable, "synthetic-event-generator");
          thread.setDaemon(true);
          return thread;
        };

    this.scheduler =
        Executors.newSingleThreadScheduledExecutor(
            threadFactory);
  }

  public synchronized GeneratorStatusResponse start() {
    if (state == GeneratorState.RUNNING) {
      return status();
    }

    if (state == GeneratorState.PAUSED) {
      state = GeneratorState.RUNNING;
      log.info("Synthetic event generator resumed");
      return status();
    }

    lastSequenceNumber.set(
        eventRepository.maximumSequenceNumber());

    scheduledTask =
        scheduler.scheduleWithFixedDelay(
            this::generateSafely,
            0,
            intervalMs,
            TimeUnit.MILLISECONDS);

    state = GeneratorState.RUNNING;

    log.info(
        "Synthetic event generator started with intervalMs={} "
            + "and eventsPerCycle={}",
        intervalMs,
        eventsPerCycle);

    return status();
  }

  public synchronized GeneratorStatusResponse pause() {
    if (state == GeneratorState.RUNNING) {
      state = GeneratorState.PAUSED;
      log.info("Synthetic event generator paused");
    }

    return status();
  }

  public synchronized GeneratorStatusResponse resume() {
    if (state == GeneratorState.PAUSED) {
      state = GeneratorState.RUNNING;
      log.info("Synthetic event generator resumed");
    }

    return status();
  }

  public synchronized GeneratorStatusResponse stop() {
    if (scheduledTask != null) {
      scheduledTask.cancel(false);
      scheduledTask = null;
    }

    state = GeneratorState.STOPPED;
    log.info("Synthetic event generator stopped");

    return status();
  }

  public synchronized GeneratorStatusResponse status() {
    return new GeneratorStatusResponse(
        state,
        generatedCount.get(),
        lastSequenceNumber.get(),
        intervalMs,
        eventsPerCycle,
        true,
        Instant.now(clock));
  }

  private void generateSafely() {
    try {
      generateCycle();
    } catch (RuntimeException exception) {
      log.error(
          "Synthetic event generation cycle failed",
          exception);
    }
  }

  private synchronized void generateCycle() {
    if (state != GeneratorState.RUNNING) {
      return;
    }

    List<Symbol> symbols =
        symbolRepository.findByActiveOrderByTickerAsc(true);

    List<Venue> venues = venueRepository.findAll();

    if (symbols.isEmpty() || venues.isEmpty()) {
      log.warn(
          "Synthetic event generation skipped because reference "
              + "data is unavailable");
      return;
    }

    Map<UUID, Venue> venuesById =
        venues.stream()
            .collect(
                java.util.stream.Collectors.toMap(
                    Venue::getId,
                    venue -> venue));

    for (int index = 0; index < eventsPerCycle; index++) {
      Symbol symbol =
          symbols.get(random.nextInt(symbols.size()));

      Venue venue = venuesById.get(symbol.getVenueId());

      if (venue == null) {
        continue;
      }

      MarketEventResponse response =
          createPersistAndMapEvent(venue, symbol);

      messagingTemplate.convertAndSend(
          "/topic/events",
          response);

      generatedCount.incrementAndGet();
    }
  }

  private MarketEventResponse createPersistAndMapEvent(
      Venue venue,
      Symbol symbol) {

    long sequence = lastSequenceNumber.incrementAndGet();
    Instant eventTimestamp = Instant.now(clock);

    long latencyMs = 5L + random.nextInt(175);
    Instant receivedTimestamp =
        eventTimestamp.plusMillis(latencyMs);

    EventType[] eventTypes = EventType.values();
    EventType eventType =
        eventTypes[random.nextInt(eventTypes.length)];

    BigDecimal price =
        BigDecimal.valueOf(25 + random.nextDouble() * 225)
            .setScale(2, RoundingMode.HALF_UP);

    long quantity = 100L + random.nextInt(9_901);

    MarketEvent event =
        new MarketEvent(
            UUID.randomUUID(),
            venue.getId(),
            symbol.getId(),
            sequence,
            eventType,
            price,
            quantity,
            eventTimestamp,
            receivedTimestamp,
            latencyMs,
            "LIVE-SIM-" + venue.getCode(),
            Map.of(
                "synthetic", true,
                "generator", "phase-2",
                "feedPartition", 1 + random.nextInt(4)));

    MarketEvent saved = eventRepository.save(event);

    return eventMapper.toResponse(
        saved,
        venue.getCode(),
        symbol.getTicker());
  }

  private static void validateSettings(
      long intervalMs,
      int eventsPerCycle) {

    if (intervalMs < MINIMUM_INTERVAL_MS
        || intervalMs > MAXIMUM_INTERVAL_MS) {

      throw new IllegalArgumentException(
          "app.generator.interval-ms must be between "
              + MINIMUM_INTERVAL_MS
              + " and "
              + MAXIMUM_INTERVAL_MS);
    }

    if (eventsPerCycle < MINIMUM_EVENTS_PER_CYCLE
        || eventsPerCycle > MAXIMUM_EVENTS_PER_CYCLE) {

      throw new IllegalArgumentException(
          "app.generator.events-per-cycle must be between "
              + MINIMUM_EVENTS_PER_CYCLE
              + " and "
              + MAXIMUM_EVENTS_PER_CYCLE);
    }
  }

  @PreDestroy
  public synchronized void shutdown() {
    if (scheduledTask != null) {
      scheduledTask.cancel(false);
      scheduledTask = null;
    }

    state = GeneratorState.STOPPED;
    scheduler.shutdownNow();

    log.info("Synthetic event generator shut down");
  }
}
