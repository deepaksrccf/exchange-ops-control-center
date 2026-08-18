package com.deepak.exchangeops.dto;

import com.deepak.exchangeops.domain.VenueStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "A fictional trading venue monitored by the control center.")
public record VenueResponse(
    UUID id, String code, String name, VenueStatus status, Instant createdAt, Instant updatedAt) {}
