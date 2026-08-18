package com.deepak.exchangeops.service;

import com.deepak.exchangeops.domain.AlertSeverity;
import com.deepak.exchangeops.domain.AlertStatus;
import com.deepak.exchangeops.dto.MetricsSummaryResponse;
import com.deepak.exchangeops.repository.AlertRepository;
import com.deepak.exchangeops.repository.MarketEventRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Aggregates dashboard figures from the synthetic dataset. */
@Service
@Transactional(readOnly = true)
public class MetricsService {

  private final AlertRepository alertRepository;
  private final MarketEventRepository eventRepository;
  private final IncidentService incidentService;
  private final AlertService alertService;
  private final ReferenceDataService referenceDataService;
  private final Clock clock;

  public MetricsService(
      AlertRepository alertRepository,
      MarketEventRepository eventRepository,
      IncidentService incidentService,
      AlertService alertService,
      ReferenceDataService referenceDataService,
      Clock clock) {
    this.alertRepository = alertRepository;
    this.eventRepository = eventRepository;
    this.incidentService = incidentService;
    this.alertService = alertService;
    this.referenceDataService = referenceDataService;
    this.clock = clock;
  }

  public MetricsSummaryResponse summary() {
    long activeAlerts =
        alertRepository.countByStatusIn(
            List.of(AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED, AlertStatus.ESCALATED));
    long unacknowledgedCritical =
        alertRepository.countByStatusAndSeverity(AlertStatus.OPEN, AlertSeverity.CRITICAL);
    Double averageLatency = eventRepository.averageProcessingLatencyMs();

    return new MetricsSummaryResponse(
        activeAlerts,
        unacknowledgedCritical,
        incidentService.countOpenIncidents(),
        eventRepository.count(),
        averageLatency == null
            ? 0d
            : BigDecimal.valueOf(averageLatency).setScale(2, RoundingMode.HALF_UP).doubleValue(),
        referenceDataService.listVenues(),
        alertService.toResponses(alertRepository.findTop5ByOrderByDetectedAtDesc()),
        incidentService.recentIncidents(),
        clock.instant());
  }
}
