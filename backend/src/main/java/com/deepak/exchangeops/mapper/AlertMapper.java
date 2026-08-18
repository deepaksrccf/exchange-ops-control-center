package com.deepak.exchangeops.mapper;

import com.deepak.exchangeops.domain.Alert;
import com.deepak.exchangeops.domain.AlertRule;
import com.deepak.exchangeops.dto.AlertResponse;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class AlertMapper {

  public AlertResponse toResponse(
      Alert alert, AlertRule rule, String venueCode, String symbolTicker, UUID incidentId) {
    return new AlertResponse(
        alert.getId(),
        alert.getRuleId(),
        rule == null ? null : rule.getName(),
        rule == null ? null : rule.getRuleType(),
        alert.getEventId(),
        alert.getVenueId(),
        venueCode,
        alert.getSymbolId(),
        symbolTicker,
        alert.getSeverity(),
        alert.getStatus(),
        alert.getTitle(),
        alert.getExplanation(),
        alert.getAssignedTo(),
        incidentId,
        alert.getDetectedAt(),
        alert.getAcknowledgedAt(),
        alert.getResolvedAt());
  }
}
