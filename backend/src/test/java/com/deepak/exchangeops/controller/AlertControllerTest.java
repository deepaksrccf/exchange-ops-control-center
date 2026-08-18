package com.deepak.exchangeops.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deepak.exchangeops.domain.AlertRuleType;
import com.deepak.exchangeops.domain.AlertSeverity;
import com.deepak.exchangeops.domain.AlertStatus;
import com.deepak.exchangeops.domain.IncidentSeverity;
import com.deepak.exchangeops.domain.IncidentStatus;
import com.deepak.exchangeops.dto.AlertResponse;
import com.deepak.exchangeops.dto.IncidentResponse;
import com.deepak.exchangeops.dto.PageResponse;
import com.deepak.exchangeops.exception.ConflictException;
import com.deepak.exchangeops.exception.ResourceNotFoundException;
import com.deepak.exchangeops.service.AlertService;
import com.deepak.exchangeops.service.IncidentService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AlertController.class)
class AlertControllerTest {

  private static final UUID ALERT_ID = UUID.fromString("aaaaaaaa-0000-4000-8000-000000000001");
  private static final Instant DETECTED = Instant.parse("2026-04-01T11:00:00Z");

  @Autowired private MockMvc mockMvc;

  @MockBean private AlertService alertService;
  @MockBean private IncidentService incidentService;

  @Test
  void listReturnsAPaginationEnvelope() throws Exception {
    when(alertService.search(any(), any(), any(), any(), any(), any(), any()))
        .thenReturn(new PageResponse<>(List.of(alertResponse()), 0, 25, 1, 1, true, true));

    mockMvc
        .perform(get("/api/v1/alerts").param("status", "OPEN"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1))
        .andExpect(jsonPath("$.content[0].severity").value("HIGH"))
        .andExpect(jsonPath("$.content[0].detectedAt").value("2026-04-01T11:00:00Z"));
  }

  @Test
  void listRejectsAnUnknownEnumValue() throws Exception {
    mockMvc
        .perform(get("/api/v1/alerts").param("status", "NOT_A_STATUS"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.path").value("/api/v1/alerts"));
  }

  @Test
  void unknownAlertReturnsNotFound() throws Exception {
    when(alertService.getById(ALERT_ID))
        .thenThrow(new ResourceNotFoundException("Alert", ALERT_ID));

    mockMvc
        .perform(get("/api/v1/alerts/{id}", ALERT_ID))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.message").value("Alert not found: " + ALERT_ID));
  }

  @Test
  void acknowledgeRequiresAnOperator() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/alerts/{id}/acknowledge", ALERT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"operator\":\"\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Request validation failed."))
        .andExpect(jsonPath("$.violations[0].field").value("operator"));

    verify(alertService, never()).acknowledge(any(), any());
  }

  @Test
  void acknowledgeRejectsAnOperatorWithUnsupportedCharacters() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/alerts/{id}/acknowledge", ALERT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"operator\":\"ops avery<script>\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.violations[0].field").value("operator"));
  }

  @Test
  void acknowledgeReturnsTheUpdatedAlert() throws Exception {
    when(alertService.acknowledge(eq(ALERT_ID), eq("ops.avery"))).thenReturn(alertResponse());

    mockMvc
        .perform(
            post("/api/v1/alerts/{id}/acknowledge", ALERT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"operator\":\"ops.avery\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(ALERT_ID.toString()));
  }

  @Test
  void createIncidentReturnsCreatedWithALocationHeader() throws Exception {
    IncidentResponse incident = incidentResponse();
    when(incidentService.createFromAlert(eq(ALERT_ID), any())).thenReturn(incident);

    mockMvc
        .perform(
            post("/api/v1/alerts/{id}/create-incident", ALERT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"title":"Latency spike","description":"Synthetic latency spike.",
                     "severity":"SEV2","owner":"ops.avery","createdBy":"ops.avery"}"""))
        .andExpect(status().isCreated())
        .andExpect(
            org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                .string("Location", "/api/v1/incidents/" + incident.id()))
        .andExpect(jsonPath("$.incidentNumber").value("INC-2026-0005"));
  }

  @Test
  void createIncidentValidatesTheRequestBody() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/alerts/{id}/create-incident", ALERT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"\",\"description\":\"\",\"createdBy\":\"ops.avery\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.violations[0].field").value("description"))
        .andExpect(jsonPath("$.violations[1].field").value("severity"))
        .andExpect(jsonPath("$.violations[2].field").value("title"));
  }

  @Test
  void createIncidentReturnsConflictWhenOneAlreadyExists() throws Exception {
    when(incidentService.createFromAlert(eq(ALERT_ID), any()))
        .thenThrow(
            new ConflictException("An incident already exists for this alert: INC-2026-0001"));

    mockMvc
        .perform(
            post("/api/v1/alerts/{id}/create-incident", ALERT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"title":"Latency spike","description":"Synthetic latency spike.",
                     "severity":"SEV2","createdBy":"ops.avery"}"""))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.status").value(409));
  }

  @Test
  void malformedJsonIsRejected() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/alerts/{id}/acknowledge", ALERT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{not json"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400));
  }

  private AlertResponse alertResponse() {
    return new AlertResponse(
        ALERT_ID,
        UUID.fromString("bbbbbbbb-0000-4000-8000-000000000001"),
        "Feed Latency Breach",
        AlertRuleType.LATENCY_THRESHOLD,
        null,
        UUID.fromString("cccccccc-0000-4000-8000-000000000001"),
        "NVLX",
        null,
        "ALPH",
        AlertSeverity.HIGH,
        AlertStatus.OPEN,
        "Feed Latency Breach triggered on ALPH",
        "Synthetic detection.",
        null,
        null,
        DETECTED,
        null,
        null);
  }

  private IncidentResponse incidentResponse() {
    return new IncidentResponse(
        UUID.fromString("eeeeeeee-0000-4000-8000-000000000001"),
        "INC-2026-0005",
        ALERT_ID,
        "Latency spike",
        "Synthetic latency spike.",
        IncidentSeverity.SEV2,
        IncidentStatus.OPEN,
        "ops.avery",
        null,
        DETECTED,
        DETECTED,
        null);
  }
}
