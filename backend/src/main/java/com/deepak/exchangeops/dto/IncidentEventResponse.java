package com.deepak.exchangeops.dto;

import com.deepak.exchangeops.domain.IncidentEventType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "An immutable entry on the incident timeline.")
public record IncidentEventResponse(
    UUID id,
    UUID incidentId,
    IncidentEventType eventType,
    String actor,
    String description,
    Instant createdAt) {}
