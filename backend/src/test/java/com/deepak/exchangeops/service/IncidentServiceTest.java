package com.deepak.exchangeops.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.deepak.exchangeops.domain.Alert;
import com.deepak.exchangeops.domain.AlertSeverity;
import com.deepak.exchangeops.domain.AlertStatus;
import com.deepak.exchangeops.domain.Incident;
import com.deepak.exchangeops.domain.IncidentEvent;
import com.deepak.exchangeops.domain.IncidentEventType;
import com.deepak.exchangeops.domain.IncidentNote;
import com.deepak.exchangeops.domain.IncidentSeverity;
import com.deepak.exchangeops.domain.IncidentStatus;
import com.deepak.exchangeops.dto.CreateIncidentFromAlertRequest;
import com.deepak.exchangeops.dto.CreateIncidentNoteRequest;
import com.deepak.exchangeops.dto.IncidentResponse;
import com.deepak.exchangeops.dto.UpdateIncidentRequest;
import com.deepak.exchangeops.exception.ConflictException;
import com.deepak.exchangeops.exception.ResourceNotFoundException;
import com.deepak.exchangeops.mapper.IncidentMapper;
import com.deepak.exchangeops.repository.IncidentEventRepository;
import com.deepak.exchangeops.repository.IncidentNoteRepository;
import com.deepak.exchangeops.repository.IncidentRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

  private static final Instant NOW = Instant.parse("2026-04-01T12:00:00Z");
  private static final UUID ALERT_ID = UUID.fromString("aaaaaaaa-0000-4000-8000-000000000001");
  private static final UUID INCIDENT_ID = UUID.fromString("eeeeeeee-0000-4000-8000-000000000001");

  @Mock private IncidentRepository incidentRepository;
  @Mock private IncidentNoteRepository noteRepository;
  @Mock private IncidentEventRepository eventRepository;

  private StubAlertService alertService;

  private IncidentService incidentService;

  @BeforeEach
  void setUp() {
    alertService = new StubAlertService();
    incidentService =
        new IncidentService(
            incidentRepository,
            noteRepository,
            eventRepository,
            alertService,
            new IncidentMapper(),
            Clock.fixed(NOW, ZoneOffset.UTC));
  }

  @Test
  void createFromAlertAllocatesTheNextIncidentNumberAndSeedsTheTimeline() {
    alertService.registerAlert(ALERT_ID, alert());
    when(incidentRepository.findByAlertId(ALERT_ID)).thenReturn(Optional.empty());
    when(incidentRepository.findHighestIncidentNumber()).thenReturn(Optional.of("INC-2026-0004"));
    when(incidentRepository.save(any(Incident.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    IncidentResponse response =
        incidentService.createFromAlert(
            ALERT_ID,
            new CreateIncidentFromAlertRequest(
                "Latency spike",
                "Synthetic latency spike.",
                IncidentSeverity.SEV2,
                "ops.avery",
                "ops.avery"));

    assertThat(response.incidentNumber()).isEqualTo("INC-2026-0005");
    assertThat(response.status()).isEqualTo(IncidentStatus.OPEN);
    assertThat(response.alertId()).isEqualTo(ALERT_ID);

    ArgumentCaptor<IncidentEvent> captor = ArgumentCaptor.forClass(IncidentEvent.class);
    verify(eventRepository, org.mockito.Mockito.times(2)).save(captor.capture());
    assertThat(captor.getAllValues())
        .extracting(IncidentEvent::getEventType)
        .containsExactly(IncidentEventType.CREATED, IncidentEventType.OWNER_ASSIGNED);
  }

  @Test
  void createFromAlertStartsNumberingWhenNoIncidentsExist() {
    alertService.registerAlert(ALERT_ID, alert());
    when(incidentRepository.findByAlertId(ALERT_ID)).thenReturn(Optional.empty());
    when(incidentRepository.findHighestIncidentNumber()).thenReturn(Optional.empty());
    when(incidentRepository.save(any(Incident.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    IncidentResponse response =
        incidentService.createFromAlert(
            ALERT_ID,
            new CreateIncidentFromAlertRequest(
                "First", "First synthetic incident.", IncidentSeverity.SEV3, null, "ops.avery"));

    assertThat(response.incidentNumber()).isEqualTo("INC-2026-0001");
    verify(eventRepository, org.mockito.Mockito.times(1)).save(any(IncidentEvent.class));
  }

  @Test
  void createFromAlertRejectsADuplicateIncident() {
    alertService.registerAlert(ALERT_ID, alert());
    when(incidentRepository.findByAlertId(ALERT_ID)).thenReturn(Optional.of(incident()));

    assertThatThrownBy(
            () ->
                incidentService.createFromAlert(
                    ALERT_ID,
                    new CreateIncidentFromAlertRequest(
                        "Duplicate", "Duplicate.", IncidentSeverity.SEV3, null, "ops.avery")))
        .isInstanceOf(ConflictException.class)
        .hasMessageContaining("INC-2026-0009");
    verify(incidentRepository, never()).save(any());
  }

  @Test
  void resolvingRequiresAResolutionSummary() {
    when(incidentRepository.findById(INCIDENT_ID)).thenReturn(Optional.of(incident()));

    assertThatThrownBy(
            () ->
                incidentService.update(
                    INCIDENT_ID,
                    new UpdateIncidentRequest(
                        null, null, IncidentStatus.RESOLVED, null, null, null, "ops.avery")))
        .isInstanceOf(ConflictException.class)
        .hasMessageContaining("resolution summary");
  }

  @Test
  void resolvingStampsResolvedAtAndRecordsTheTimeline() {
    when(incidentRepository.findById(INCIDENT_ID)).thenReturn(Optional.of(incident()));
    when(incidentRepository.save(any(Incident.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    IncidentResponse response =
        incidentService.update(
            INCIDENT_ID,
            new UpdateIncidentRequest(
                null,
                null,
                IncidentStatus.RESOLVED,
                IncidentSeverity.SEV4,
                "ops.casey",
                "Simulator restarted.",
                "ops.casey"));

    assertThat(response.status()).isEqualTo(IncidentStatus.RESOLVED);
    assertThat(response.resolvedAt()).isEqualTo(NOW);
    assertThat(response.resolutionSummary()).isEqualTo("Simulator restarted.");

    ArgumentCaptor<IncidentEvent> captor = ArgumentCaptor.forClass(IncidentEvent.class);
    verify(eventRepository, org.mockito.Mockito.times(3)).save(captor.capture());
    assertThat(captor.getAllValues())
        .extracting(IncidentEvent::getEventType)
        .containsExactly(
            IncidentEventType.OWNER_ASSIGNED,
            IncidentEventType.SEVERITY_CHANGED,
            IncidentEventType.RESOLVED);
  }

  @Test
  void updateWithoutChangesRecordsNoTimelineEntries() {
    when(incidentRepository.findById(INCIDENT_ID)).thenReturn(Optional.of(incident()));
    when(incidentRepository.save(any(Incident.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    incidentService.update(
        INCIDENT_ID, new UpdateIncidentRequest(null, null, null, null, null, null, "ops.avery"));

    verify(eventRepository, never()).save(any());
  }

  @Test
  void addNoteAppendsATimelineEntry() {
    when(incidentRepository.findById(INCIDENT_ID)).thenReturn(Optional.of(incident()));
    when(noteRepository.save(any(IncidentNote.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));

    var note =
        incidentService.addNote(
            INCIDENT_ID, new CreateIncidentNoteRequest("ops.avery", "Replay completed."));

    assertThat(note.author()).isEqualTo("ops.avery");
    assertThat(note.content()).isEqualTo("Replay completed.");

    ArgumentCaptor<IncidentEvent> captor = ArgumentCaptor.forClass(IncidentEvent.class);
    verify(eventRepository).save(captor.capture());
    assertThat(captor.getValue().getEventType()).isEqualTo(IncidentEventType.NOTE_ADDED);
  }

  @Test
  void timelineLookupFailsForAnUnknownIncident() {
    when(incidentRepository.findById(INCIDENT_ID)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> incidentService.listTimeline(INCIDENT_ID))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void countsOpenIncidentsAcrossActiveStatuses() {
    when(incidentRepository.countByStatusIn(
            List.of(IncidentStatus.OPEN, IncidentStatus.INVESTIGATING, IncidentStatus.MITIGATED)))
        .thenReturn(7L);

    assertThat(incidentService.countOpenIncidents()).isEqualTo(7L);
  }

  private Alert alert() {
    return new Alert(
        ALERT_ID,
        UUID.fromString("bbbbbbbb-0000-4000-8000-000000000001"),
        null,
        UUID.fromString("cccccccc-0000-4000-8000-000000000001"),
        null,
        AlertSeverity.HIGH,
        AlertStatus.ACKNOWLEDGED,
        "Feed Latency Breach",
        "Synthetic detection.",
        "ops.avery",
        Instant.parse("2026-04-01T11:00:00Z"));
  }

  private Incident incident() {
    return new Incident(
        INCIDENT_ID,
        "INC-2026-0009",
        ALERT_ID,
        "Latency spike",
        "Synthetic latency spike.",
        IncidentSeverity.SEV2,
        IncidentStatus.INVESTIGATING,
        "ops.avery");
  }

  /**
   * Stub implementation of AlertService for testing IncidentService. Uses a simple HashMap to store
   * alerts instead of Mockito mocking, avoiding Java 25 bytecode instrumentation issues.
   */
  private static class StubAlertService extends AlertService {
    private final Map<UUID, Alert> alerts = new HashMap<>();

    StubAlertService() {
      super(null, null, null, null, null, null);
    }

    void registerAlert(UUID id, Alert alert) {
      alerts.put(id, alert);
    }

    @Override
    public Alert requireAlert(UUID id) {
      Alert alert = alerts.get(id);
      if (alert == null) {
        throw new IllegalStateException("Alert not registered: " + id);
      }
      return alert;
    }
  }
}
