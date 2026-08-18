package com.deepak.exchangeops.controller;

import com.deepak.exchangeops.domain.EventType;
import com.deepak.exchangeops.dto.MarketEventResponse;
import com.deepak.exchangeops.dto.PageResponse;
import com.deepak.exchangeops.service.MarketEventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/events")
@Tag(name = "Events", description = "Synthetic market event stream.")
public class MarketEventController {

  private final MarketEventService marketEventService;

  public MarketEventController(MarketEventService marketEventService) {
    this.marketEventService = marketEventService;
  }

  @GetMapping
  @Operation(summary = "List synthetic market events with pagination, sorting and filtering")
  public PageResponse<MarketEventResponse> list(
      @RequestParam(required = false) UUID venueId,
      @RequestParam(required = false) UUID symbolId,
      @RequestParam(required = false) EventType eventType,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          Instant from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          Instant to,
      @RequestParam(required = false) Long minLatencyMs,
      @PageableDefault(size = 25, sort = "eventTimestamp", direction = Sort.Direction.DESC)
          Pageable pageable) {
    return marketEventService.search(
        venueId, symbolId, eventType, from, to, minLatencyMs, pageable);
  }

  @GetMapping("/{id}")
  @Operation(summary = "Fetch a single synthetic market event")
  public MarketEventResponse get(@PathVariable UUID id) {
    return marketEventService.getById(id);
  }
}
