package com.deepak.exchangeops.dto;

import com.deepak.exchangeops.domain.EventType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Schema(description = "A synthetic market data event received from a simulated venue feed.")
public record MarketEventResponse(
    UUID id,
    UUID venueId,
    String venueCode,
    UUID symbolId,
    String symbolTicker,
    long sequenceNumber,
    EventType eventType,
    BigDecimal price,
    long quantity,
    Instant eventTimestamp,
    Instant receivedTimestamp,
    long processingLatencyMs,
    String source,
    Map<String, Object> metadata) {}
