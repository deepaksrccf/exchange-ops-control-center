package com.deepak.exchangeops.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "A fictional instrument listed on a fictional venue.")
public record SymbolResponse(
    UUID id,
    String ticker,
    String displayName,
    UUID venueId,
    String venueCode,
    boolean active,
    Instant createdAt,
    Instant updatedAt) {}
