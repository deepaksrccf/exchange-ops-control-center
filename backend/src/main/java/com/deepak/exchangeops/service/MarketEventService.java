package com.deepak.exchangeops.service;

import com.deepak.exchangeops.domain.EventType;
import com.deepak.exchangeops.domain.MarketEvent;
import com.deepak.exchangeops.dto.MarketEventResponse;
import com.deepak.exchangeops.dto.PageResponse;
import com.deepak.exchangeops.exception.ResourceNotFoundException;
import com.deepak.exchangeops.mapper.MarketEventMapper;
import com.deepak.exchangeops.repository.MarketEventRepository;
import com.deepak.exchangeops.repository.MarketEventSpecifications;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read access to the synthetic market event stream. */
@Service
@Transactional(readOnly = true)
public class MarketEventService {

  private final MarketEventRepository eventRepository;
  private final ReferenceDataService referenceDataService;
  private final MarketEventMapper eventMapper;

  public MarketEventService(
      MarketEventRepository eventRepository,
      ReferenceDataService referenceDataService,
      MarketEventMapper eventMapper) {
    this.eventRepository = eventRepository;
    this.referenceDataService = referenceDataService;
    this.eventMapper = eventMapper;
  }

  public PageResponse<MarketEventResponse> search(
      UUID venueId,
      UUID symbolId,
      EventType eventType,
      Instant from,
      Instant to,
      Long minLatencyMs,
      Pageable pageable) {
    Page<MarketEvent> page =
        eventRepository.findAll(
            MarketEventSpecifications.filter(venueId, symbolId, eventType, from, to, minLatencyMs),
            pageable);
    Map<UUID, String> venueCodes = referenceDataService.venueCodesById();
    Map<UUID, String> symbolTickers = referenceDataService.symbolTickersById();
    List<MarketEventResponse> content =
        page.getContent().stream()
            .map(
                event ->
                    eventMapper.toResponse(
                        event,
                        venueCodes.get(event.getVenueId()),
                        symbolTickers.get(event.getSymbolId())))
            .toList();
    return PageResponse.of(page, content);
  }

  public MarketEventResponse getById(UUID id) {
    MarketEvent event =
        eventRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Market event", id));
    return eventMapper.toResponse(
        event,
        referenceDataService.venueCodesById().get(event.getVenueId()),
        referenceDataService.symbolTickersById().get(event.getSymbolId()));
  }
}
