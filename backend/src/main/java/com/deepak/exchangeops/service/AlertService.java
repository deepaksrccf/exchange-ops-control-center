package com.deepak.exchangeops.service;

import com.deepak.exchangeops.domain.Alert;
import com.deepak.exchangeops.domain.AlertRule;
import com.deepak.exchangeops.domain.AlertSeverity;
import com.deepak.exchangeops.domain.AlertStatus;
import com.deepak.exchangeops.domain.Incident;
import com.deepak.exchangeops.dto.AlertResponse;
import com.deepak.exchangeops.dto.PageResponse;
import com.deepak.exchangeops.exception.ConflictException;
import com.deepak.exchangeops.exception.ResourceNotFoundException;
import com.deepak.exchangeops.mapper.AlertMapper;
import com.deepak.exchangeops.repository.AlertRepository;
import com.deepak.exchangeops.repository.AlertRuleRepository;
import com.deepak.exchangeops.repository.AlertSpecifications;
import com.deepak.exchangeops.repository.IncidentRepository;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Alert queue reads and the acknowledge workflow. */
@Service
@Transactional(readOnly = true)
public class AlertService {

  private static final Logger log = LoggerFactory.getLogger(AlertService.class);

  private final AlertRepository alertRepository;
  private final AlertRuleRepository alertRuleRepository;
  private final IncidentRepository incidentRepository;
  private final ReferenceDataService referenceDataService;
  private final AlertMapper alertMapper;
  private final Clock clock;

  public AlertService(
      AlertRepository alertRepository,
      AlertRuleRepository alertRuleRepository,
      IncidentRepository incidentRepository,
      ReferenceDataService referenceDataService,
      AlertMapper alertMapper,
      Clock clock) {
    this.alertRepository = alertRepository;
    this.alertRuleRepository = alertRuleRepository;
    this.incidentRepository = incidentRepository;
    this.referenceDataService = referenceDataService;
    this.alertMapper = alertMapper;
    this.clock = clock;
  }

  public PageResponse<AlertResponse> search(
      AlertStatus status,
      AlertSeverity severity,
      UUID venueId,
      UUID symbolId,
      UUID ruleId,
      String assignedTo,
      Pageable pageable) {
    Page<Alert> page =
        alertRepository.findAll(
            AlertSpecifications.filter(status, severity, venueId, symbolId, ruleId, assignedTo),
            pageable);
    return PageResponse.of(page, toResponses(page.getContent()));
  }

  public AlertResponse getById(UUID id) {
    return toResponses(List.of(requireAlert(id))).getFirst();
  }

  @Transactional
  public AlertResponse acknowledge(UUID id, String operator) {
    Alert alert = requireAlert(id);
    if (alert.getStatus() == AlertStatus.RESOLVED) {
      throw new ConflictException("A resolved alert cannot be acknowledged.");
    }
    alert.acknowledge(operator, clock.instant());
    alertRepository.save(alert);
    log.info("Alert {} acknowledged", alert.getId());
    return toResponses(List.of(alert)).getFirst();
  }

  Alert requireAlert(UUID id) {
    return alertRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Alert", id));
  }

  List<AlertResponse> toResponses(List<Alert> alerts) {
    if (alerts.isEmpty()) {
      return List.of();
    }
    Map<UUID, AlertRule> rules =
        alertRuleRepository.findAll().stream()
            .collect(Collectors.toMap(AlertRule::getId, Function.identity()));
    Map<UUID, String> venueCodes = referenceDataService.venueCodesById();
    Map<UUID, String> symbolTickers = referenceDataService.symbolTickersById();
    Map<UUID, UUID> incidentIdsByAlertId =
        incidentRepository.findByAlertIdIn(alerts.stream().map(Alert::getId).toList()).stream()
            .collect(Collectors.toMap(Incident::getAlertId, Incident::getId, (a, b) -> a));
    return alerts.stream()
        .map(
            alert ->
                alertMapper.toResponse(
                    alert,
                    rules.get(alert.getRuleId()),
                    venueCodes.get(alert.getVenueId()),
                    alert.getSymbolId() == null ? null : symbolTickers.get(alert.getSymbolId()),
                    incidentIdsByAlertId.get(alert.getId())))
        .toList();
  }
}
