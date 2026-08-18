package com.deepak.exchangeops.controller;

import com.deepak.exchangeops.dto.SymbolResponse;
import com.deepak.exchangeops.dto.VenueResponse;
import com.deepak.exchangeops.service.ReferenceDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Reference data", description = "Fictional venues and instruments.")
public class ReferenceDataController {

  private final ReferenceDataService referenceDataService;

  public ReferenceDataController(ReferenceDataService referenceDataService) {
    this.referenceDataService = referenceDataService;
  }

  @GetMapping("/venues")
  @Operation(summary = "List all fictional venues")
  public List<VenueResponse> venues() {
    return referenceDataService.listVenues();
  }

  @GetMapping("/symbols")
  @Operation(summary = "List fictional symbols, optionally filtered by venue or active flag")
  public List<SymbolResponse> symbols(
      @RequestParam(required = false) UUID venueId,
      @RequestParam(required = false) Boolean active) {
    return referenceDataService.listSymbols(venueId, active);
  }
}
