package com.deepak.exchangeops.dto;

import com.deepak.exchangeops.domain.AlertRuleType;
import com.deepak.exchangeops.domain.AlertSeverity;
import com.deepak.exchangeops.domain.AlertStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "An alert raised by a detection rule against the synthetic event stream.")
public record AlertResponse(
    UUID id,
    UUID ruleId,
    String ruleName,
    AlertRuleType ruleType,
    UUID eventId,
    UUID venueId,
    String venueCode,
    UUID symbolId,
    String symbolTicker,
    AlertSeverity severity,
    AlertStatus status,
    String title,
    String explanation,
    String assignedTo,
    UUID incidentId,
    Instant detectedAt,
    Instant acknowledgedAt,
    Instant resolvedAt) {}
