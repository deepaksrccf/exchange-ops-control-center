package com.deepak.exchangeops.mapper;

import com.deepak.exchangeops.domain.MarketEvent;
import com.deepak.exchangeops.dto.MarketEventResponse;
import org.springframework.stereotype.Component;

@Component
public class MarketEventMapper {

  public MarketEventResponse toResponse(MarketEvent event, String venueCode, String symbolTicker) {
    return new MarketEventResponse(
        event.getId(),
        event.getVenueId(),
        venueCode,
        event.getSymbolId(),
        symbolTicker,
        event.getSequenceNumber(),
        event.getEventType(),
        event.getPrice(),
        event.getQuantity(),
        event.getEventTimestamp(),
        event.getReceivedTimestamp(),
        event.getProcessingLatencyMs(),
        event.getSource(),
        event.getMetadata());
  }
}
