package com.deepak.exchangeops.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.deepak.exchangeops.domain.EventType;
import com.deepak.exchangeops.domain.MarketEvent;
import com.deepak.exchangeops.domain.Symbol;
import com.deepak.exchangeops.domain.Venue;
import com.deepak.exchangeops.support.AbstractIntegrationTest;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

class MarketEventRepositoryIntegrationTest extends AbstractIntegrationTest {

  private static final Instant BASE = Instant.parse("2026-03-01T10:00:00Z");

  @Autowired private MarketEventRepository eventRepository;
  @Autowired private VenueRepository venueRepository;
  @Autowired private SymbolRepository symbolRepository;

  private Venue venue;
  private Symbol symbol;

  @BeforeEach
  void loadReferenceData() {
    venue = venueRepository.findByCode("NVLX").orElseThrow();
    symbol =
        symbolRepository.findByVenueIdOrderByTickerAsc(venue.getId()).stream()
            .filter(candidate -> candidate.getTicker().equals("ALPH"))
            .findFirst()
            .orElseThrow();
  }

  @Test
  void migrationsSeedTheExpectedNumberOfSyntheticEvents() {
    assertThat(eventRepository.count()).isEqualTo(600);
  }

  @Test
  void storesAndReadsBackJsonMetadata() {
    MarketEvent saved =
        eventRepository.saveAndFlush(
            event(9_000_001L, EventType.TRADE, BASE, 42, Map.of("gateway", "sim-gw-9")));

    MarketEvent reloaded = eventRepository.findById(saved.getId()).orElseThrow();

    assertThat(reloaded.getMetadata()).containsEntry("gateway", "sim-gw-9");
    assertThat(reloaded.getPrice()).isEqualByComparingTo("101.250000");
  }

  @Test
  void filtersBySymbolTypeTimeRangeAndLatency() {
    eventRepository.saveAndFlush(
        event(9_000_101L, EventType.TRADE, BASE, 500, Map.of("case", "match")));
    eventRepository.saveAndFlush(
        event(9_000_102L, EventType.QUOTE, BASE.plusSeconds(10), 500, Map.of("case", "wrongType")));
    eventRepository.saveAndFlush(
        event(9_000_103L, EventType.TRADE, BASE.plusSeconds(20), 5, Map.of("case", "lowLatency")));
    eventRepository.saveAndFlush(
        event(9_000_104L, EventType.TRADE, BASE.plusSeconds(600), 500, Map.of("case", "tooLate")));

    Page<MarketEvent> result =
        eventRepository.findAll(
            MarketEventSpecifications.filter(
                venue.getId(), symbol.getId(), EventType.TRADE, BASE, BASE.plusSeconds(60), 100L),
            PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "sequenceNumber")));

    assertThat(result.getTotalElements()).isEqualTo(1);
    assertThat(result.getContent().getFirst().getSequenceNumber()).isEqualTo(9_000_101L);
  }

  @Test
  void paginatesAndSortsDeterministically() {
    for (long offset = 0; offset < 5; offset++) {
      eventRepository.saveAndFlush(
          event(
              9_000_201L + offset,
              EventType.TRADE,
              BASE.plusSeconds(offset),
              10,
              Map.of("page", "yes")));
    }

    Page<MarketEvent> page =
        eventRepository.findAll(
            MarketEventSpecifications.filter(
                null, symbol.getId(), null, BASE, BASE.plusSeconds(5), null),
            PageRequest.of(1, 2, Sort.by(Sort.Direction.ASC, "sequenceNumber")));

    assertThat(page.getTotalElements()).isEqualTo(5);
    assertThat(page.getTotalPages()).isEqualTo(3);
    assertThat(page.getContent())
        .extracting(MarketEvent::getSequenceNumber)
        .containsExactly(9_000_203L, 9_000_204L);
  }

  @Test
  void rejectsDuplicateSequenceNumbersForTheSameVenue() {
    eventRepository.saveAndFlush(event(9_000_301L, EventType.TRADE, BASE, 10, Map.of()));
    MarketEvent duplicate = event(9_000_301L, EventType.QUOTE, BASE, 10, Map.of());

    assertThatThrownBy(() -> eventRepository.saveAndFlush(duplicate))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  private MarketEvent event(
      long sequenceNumber,
      EventType type,
      Instant timestamp,
      long latencyMs,
      Map<String, Object> metadata) {
    return new MarketEvent(
        UUID.randomUUID(),
        venue.getId(),
        symbol.getId(),
        sequenceNumber,
        type,
        new BigDecimal("101.250000"),
        100,
        timestamp,
        timestamp.plusMillis(latencyMs),
        latencyMs,
        "SIM-FEED-TEST",
        metadata);
  }
}
