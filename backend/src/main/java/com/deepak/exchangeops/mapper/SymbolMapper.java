package com.deepak.exchangeops.mapper;

import com.deepak.exchangeops.domain.Symbol;
import com.deepak.exchangeops.dto.SymbolResponse;
import org.springframework.stereotype.Component;

@Component
public class SymbolMapper {

  public SymbolResponse toResponse(Symbol symbol, String venueCode) {
    return new SymbolResponse(
        symbol.getId(),
        symbol.getTicker(),
        symbol.getDisplayName(),
        symbol.getVenueId(),
        venueCode,
        symbol.isActive(),
        symbol.getCreatedAt(),
        symbol.getUpdatedAt());
  }
}
