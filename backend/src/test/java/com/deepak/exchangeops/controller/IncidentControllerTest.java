package com.deepak.exchangeops.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.deepak.exchangeops.domain.IncidentEventType;
import com.deepak.exchangeops.domain.IncidentSeverity;
import com.deepak.exchangeops.domain.IncidentStatus;
import com.deepak.exchangeops.dto.IncidentEventResponse;
import com.deepak.exchangeops.dto.IncidentNoteResponse;
import com.deepak.exchangeops.dto.IncidentResponse;
import com.deepak.exchangeops.dto.PageResponse;
import com.deepak.exchangeops.exception.ConflictException;
import com.deepak.exchangeops.exception.ResourceNotFoundException;
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

@WebMvcTest(IncidentController.class)
class IncidentControllerTest {

  private static final UUID INCIDENT_ID = UUID.fromString("bbbbbbbb-0000-4000-8000-000000000001");
  private static final Instant CREATED = Instant.parse("2026-04-01T09:15:00Z");

  @Autowired private MockMvc mockMvc;

  @MockBean private IncidentService incidentService;

  @Test
  void listReturnsAPaginationEnvelope() throws Exception {
    when(incidentService.search(any(), any(), any(), any(), any()))
        .thenReturn(new PageResponse<>(List.of(incidentResponse()), 0, 25, 1, 1, true, true));

    mockMvc
        .perform(get("/api/v1/incidents").param("status", "OPEN"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalElements").value(1))
        .andExpect(jsonPath("$.page").value(0))
        .andExpect(jsonPath("$.content[0].incidentNumber").value("INC-2026-0001"))
        .andExpect(jsonPath("$.content[0].createdAt").value("2026-04-01T09:15:00Z"));
  }

  @Test
  void listRejectsAnUnknownEnumValue() throws Exception {
    mockMvc
        .perform(get("/api/v1/incidents").param("severity", "SEV9"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.path").value("/api/v1/incidents"));
  }

  @Test
  void getReturnsASingleIncident() throws Exception {
    when(incidentService.getById(INCIDENT_ID)).thenReturn(incidentResponse());

    mockMvc
        .perform(get("/api/v1/incidents/{id}", INCIDENT_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(INCIDENT_ID.toString()))
        .andExpect(jsonPath("$.status").value("OPEN"))
        .andExpect(jsonPath("$.severity").value("SEV2"));
  }

  @Test
  void getReturnsTheSharedErrorShapeWhenTheIncidentIsMissing() throws Exception {
    when(incidentService.getById(INCIDENT_ID))
        .thenThrow(new ResourceNotFoundException("Incident", INCIDENT_ID));

    mockMvc
        .perform(get("/api/v1/incidents/{id}", INCIDENT_ID))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.status").value(404))
        .andExpect(jsonPath("$.error").value("Not Found"))
        .andExpect(jsonPath("$.path").value("/api/v1/incidents/" + INCIDENT_ID))
        .andExpect(jsonPath("$.timestamp").exists());
  }

  @Test
  void patchAppliesAPartialUpdate() throws Exception {
    when(incidentService.update(eq(INCIDENT_ID), any())).thenReturn(incidentResponse());

    mockMvc
        .perform(
            patch("/api/v1/incidents/{id}", INCIDENT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"status":"INVESTIGATING","owner":"ops.avery","actor":"ops.avery"}"""))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.incidentNumber").value("INC-2026-0001"));
  }

  @Test
  void patchRejectsAMissingActor() throws Exception {
    mockMvc
        .perform(
            patch("/api/v1/incidents/{id}", INCIDENT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"status":"INVESTIGATING"}"""))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Request validation failed."))
        .andExpect(jsonPath("$.violations[0].field").value("actor"));

    verify(incidentService, never()).update(any(), any());
  }

  @Test
  void patchRejectsAnOwnerContainingUnsupportedCharacters() throws Exception {
    mockMvc
        .perform(
            patch("/api/v1/incidents/{id}", INCIDENT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"owner":"ops avery <script>","actor":"ops.avery"}"""))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.violations[0].field").value("owner"));

    verify(incidentService, never()).update(any(), any());
  }

  @Test
  void patchSurfacesAConflictAsHttp409() throws Exception {
    when(incidentService.update(eq(INCIDENT_ID), any()))
        .thenThrow(
            new ConflictException(
                "A resolution summary is required before an incident can be resolved or closed."));

    mockMvc
        .perform(
            patch("/api/v1/incidents/{id}", INCIDENT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"status":"RESOLVED","actor":"ops.avery"}"""))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.status").value(409))
        .andExpect(jsonPath("$.error").value("Conflict"));
  }

  @Test
  void addNoteReturnsHttp201() throws Exception {
    when(incidentService.addNote(eq(INCIDENT_ID), any()))
        .thenReturn(
            new IncidentNoteResponse(
                UUID.fromString("cccccccc-0000-4000-8000-000000000001"),
                INCIDENT_ID,
                "ops.avery",
                "Replay completed.",
                CREATED));

    mockMvc
        .perform(
            post("/api/v1/incidents/{id}/notes", INCIDENT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"author":"ops.avery","content":"Replay completed."}"""))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.author").value("ops.avery"))
        .andExpect(jsonPath("$.content").value("Replay completed."));
  }

  @Test
  void addNoteRejectsBlankContent() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/incidents/{id}/notes", INCIDENT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"author":"ops.avery","content":"   "}"""))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.violations[0].field").value("content"));

    verify(incidentService, never()).addNote(any(), any());
  }

  @Test
  void addNoteRejectsAMalformedBody() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/incidents/{id}/notes", INCIDENT_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"author\":"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400));

    verify(incidentService, never()).addNote(any(), any());
  }

  @Test
  void timelineReturnsEntriesInRecordedOrder() throws Exception {
    when(incidentService.listTimeline(INCIDENT_ID))
        .thenReturn(
            List.of(
                timelineEntry(IncidentEventType.CREATED, "Incident created from alert.", CREATED),
                timelineEntry(
                    IncidentEventType.STATUS_CHANGED,
                    "Status changed from OPEN to INVESTIGATING.",
                    CREATED.plusSeconds(120))));

    mockMvc
        .perform(get("/api/v1/incidents/{id}/timeline", INCIDENT_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].eventType").value("CREATED"))
        .andExpect(jsonPath("$[1].eventType").value("STATUS_CHANGED"))
        .andExpect(jsonPath("$[1].createdAt").value("2026-04-01T09:17:00Z"));
  }

  @Test
  void timelineReturnsAnEmptyArrayWhenNothingIsRecorded() throws Exception {
    when(incidentService.listTimeline(INCIDENT_ID)).thenReturn(List.of());

    mockMvc
        .perform(get("/api/v1/incidents/{id}/timeline", INCIDENT_ID))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }

  @Test
  void pathVariableMustBeAValidUuid() throws Exception {
    mockMvc
        .perform(get("/api/v1/incidents/{id}", "not-a-uuid"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400));
  }

  private IncidentResponse incidentResponse() {
    return new IncidentResponse(
        INCIDENT_ID,
        "INC-2026-0001",
        UUID.fromString("aaaaaaaa-0000-4000-8000-000000000001"),
        "Elevated feed latency on Arcadia Markets",
        "Simulated gateway reported sustained processing latency.",
        IncidentSeverity.SEV2,
        IncidentStatus.OPEN,
        "ops.blake",
        null,
        CREATED,
        CREATED,
        null);
  }

  private IncidentEventResponse timelineEntry(
      IncidentEventType type, String description, Instant at) {
    return new IncidentEventResponse(
        UUID.nameUUIDFromBytes(description.getBytes()),
        INCIDENT_ID,
        type,
        "ops.avery",
        description,
        at);
  }
}
