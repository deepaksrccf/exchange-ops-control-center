package com.deepak.exchangeops.controller;

import com.deepak.exchangeops.domain.AlertSeverity;
import com.deepak.exchangeops.domain.AlertStatus;
import com.deepak.exchangeops.dto.AcknowledgeAlertRequest;
import com.deepak.exchangeops.dto.AlertResponse;
import com.deepak.exchangeops.dto.CreateIncidentFromAlertRequest;
import com.deepak.exchangeops.dto.IncidentResponse;
import com.deepak.exchangeops.dto.PageResponse;
import com.deepak.exchangeops.service.AlertService;
import com.deepak.exchangeops.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/alerts")
@Tag(name = "Alerts", description = "Operations alert queue and triage actions.")
public class AlertController {

  private final AlertService alertService;
  private final IncidentService incidentService;

  public AlertController(AlertService alertService, IncidentService incidentService) {
    this.alertService = alertService;
    this.incidentService = incidentService;
  }

  @GetMapping
  @Operation(summary = "List alerts with pagination, sorting and filtering")
  public PageResponse<AlertResponse> list(
      @RequestParam(required = false) AlertStatus status,
      @RequestParam(required = false) AlertSeverity severity,
      @RequestParam(required = false) UUID venueId,
      @RequestParam(required = false) UUID symbolId,
      @RequestParam(required = false) UUID ruleId,
      @RequestParam(required = false) String assignedTo,
      @PageableDefault(size = 25, sort = "detectedAt", direction = Sort.Direction.DESC)
          Pageable pageable) {
    return alertService.search(status, severity, venueId, symbolId, ruleId, assignedTo, pageable);
  }

  @GetMapping("/{id}")
  @Operation(summary = "Fetch a single alert")
  public AlertResponse get(@PathVariable UUID id) {
    return alertService.getById(id);
  }

  @PostMapping("/{id}/acknowledge")
  @Operation(summary = "Acknowledge an alert and assign it to an operator")
  public AlertResponse acknowledge(
      @PathVariable UUID id, @Valid @RequestBody AcknowledgeAlertRequest request) {
    return alertService.acknowledge(id, request.operator());
  }

  @PostMapping("/{id}/create-incident")
  @Operation(summary = "Open an incident from an alert")
  public ResponseEntity<IncidentResponse> createIncident(
      @PathVariable UUID id, @Valid @RequestBody CreateIncidentFromAlertRequest request) {
    IncidentResponse incident = incidentService.createFromAlert(id, request);
    return ResponseEntity.created(URI.create("/api/v1/incidents/" + incident.id())).body(incident);
  }
}
