package com.deepak.exchangeops.dto;

import com.deepak.exchangeops.domain.IncidentSeverity;
import com.deepak.exchangeops.domain.IncidentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "An operational incident tracking remediation work.")
public record IncidentResponse(
    UUID id,
    String incidentNumber,
    UUID alertId,
    String title,
    String description,
    IncidentSeverity severity,
    IncidentStatus status,
    String owner,
    String resolutionSummary,
    Instant createdAt,
    Instant updatedAt,
    Instant resolvedAt) {}
