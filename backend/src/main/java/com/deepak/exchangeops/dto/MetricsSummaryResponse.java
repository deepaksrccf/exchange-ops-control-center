package com.deepak.exchangeops.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

/** Aggregated figures for the operations overview dashboard. */
@Schema(description = "Aggregated operational metrics computed from synthetic data.")
public record MetricsSummaryResponse(
    long activeAlerts,
    long unacknowledgedCriticalAlerts,
    long openIncidents,
    long eventsProcessed,
    double averageProcessingLatencyMs,
    List<VenueResponse> venues,
    List<AlertResponse> recentAlerts,
    List<IncidentResponse> recentIncidents,
    Instant generatedAt) {}
