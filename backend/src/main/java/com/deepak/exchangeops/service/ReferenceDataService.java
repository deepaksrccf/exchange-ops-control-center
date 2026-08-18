package com.deepak.exchangeops.service;

import com.deepak.exchangeops.domain.Symbol;
import com.deepak.exchangeops.domain.Venue;
import com.deepak.exchangeops.dto.SymbolResponse;
import com.deepak.exchangeops.dto.VenueResponse;
import com.deepak.exchangeops.mapper.SymbolMapper;
import com.deepak.exchangeops.mapper.VenueMapper;
import com.deepak.exchangeops.repository.SymbolRepository;
import com.deepak.exchangeops.repository.VenueRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read access to venues and symbols, plus lookup maps used when enriching other responses. */
@Service
@Transactional(readOnly = true)
public class ReferenceDataService {

  private final VenueRepository venueRepository;
  private final SymbolRepository symbolRepository;
  private final VenueMapper venueMapper;
  private final SymbolMapper symbolMapper;

  public ReferenceDataService(
      VenueRepository venueRepository,
      SymbolRepository symbolRepository,
      VenueMapper venueMapper,
      SymbolMapper symbolMapper) {
    this.venueRepository = venueRepository;
    this.symbolRepository = symbolRepository;
    this.venueMapper = venueMapper;
    this.symbolMapper = symbolMapper;
  }

  public List<VenueResponse> listVenues() {
    return venueRepository.findAll().stream()
        .sorted(Comparator.comparing(Venue::getCode))
        .map(venueMapper::toResponse)
        .toList();
  }

  public List<SymbolResponse> listSymbols(UUID venueId, Boolean active) {
    Map<UUID, String> venueCodes = venueCodesById();
    return symbolRepository.findAll().stream()
        .filter(symbol -> venueId == null || venueId.equals(symbol.getVenueId()))
        .filter(symbol -> active == null || active == symbol.isActive())
        .sorted(Comparator.comparing(Symbol::getTicker))
        .map(symbol -> symbolMapper.toResponse(symbol, venueCodes.get(symbol.getVenueId())))
        .toList();
  }

  public Map<UUID, String> venueCodesById() {
    return venueRepository.findAll().stream()
        .collect(Collectors.toMap(Venue::getId, Venue::getCode));
  }

  public Map<UUID, String> symbolTickersById() {
    return symbolRepository.findAll().stream()
        .collect(Collectors.toMap(Symbol::getId, Symbol::getTicker));
  }
}
