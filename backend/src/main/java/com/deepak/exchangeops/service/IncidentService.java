package com.deepak.exchangeops.service;

import com.deepak.exchangeops.domain.Alert;
import com.deepak.exchangeops.domain.Incident;
import com.deepak.exchangeops.domain.IncidentEvent;
import com.deepak.exchangeops.domain.IncidentEventType;
import com.deepak.exchangeops.domain.IncidentNote;
import com.deepak.exchangeops.domain.IncidentSeverity;
import com.deepak.exchangeops.domain.IncidentStatus;
import com.deepak.exchangeops.dto.CreateIncidentFromAlertRequest;
import com.deepak.exchangeops.dto.CreateIncidentNoteRequest;
import com.deepak.exchangeops.dto.IncidentEventResponse;
import com.deepak.exchangeops.dto.IncidentNoteResponse;
import com.deepak.exchangeops.dto.IncidentResponse;
import com.deepak.exchangeops.dto.PageResponse;
import com.deepak.exchangeops.dto.UpdateIncidentRequest;
import com.deepak.exchangeops.exception.ConflictException;
import com.deepak.exchangeops.exception.ResourceNotFoundException;
import com.deepak.exchangeops.mapper.IncidentMapper;
import com.deepak.exchangeops.repository.IncidentEventRepository;
import com.deepak.exchangeops.repository.IncidentNoteRepository;
import com.deepak.exchangeops.repository.IncidentRepository;
import com.deepak.exchangeops.repository.IncidentSpecifications;
import java.time.Clock;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Incident lifecycle: creation from alerts, updates, notes and the immutable timeline. */
@Service
@Transactional(readOnly = true)
public class IncidentService {

  private static final Logger log = LoggerFactory.getLogger(IncidentService.class);
  private static final Pattern INCIDENT_NUMBER = Pattern.compile("^INC-(\\d{4})-(\\d+)$");

  private final IncidentRepository incidentRepository;
  private final IncidentNoteRepository noteRepository;
  private final IncidentEventRepository eventRepository;
  private final AlertService alertService;
  private final IncidentMapper incidentMapper;
  private final Clock clock;

  public IncidentService(
      IncidentRepository incidentRepository,
      IncidentNoteRepository noteRepository,
      IncidentEventRepository eventRepository,
      AlertService alertService,
      IncidentMapper incidentMapper,
      Clock clock) {
    this.incidentRepository = incidentRepository;
    this.noteRepository = noteRepository;
    this.eventRepository = eventRepository;
    this.alertService = alertService;
    this.incidentMapper = incidentMapper;
    this.clock = clock;
  }

  public PageResponse<IncidentResponse> search(
      IncidentStatus status,
      IncidentSeverity severity,
      String owner,
      String search,
      Pageable pageable) {
    Page<Incident> page =
        incidentRepository.findAll(
            IncidentSpecifications.filter(status, severity, owner, search), pageable);
    return PageResponse.from(page, incidentMapper::toResponse);
  }

  public IncidentResponse getById(UUID id) {
    return incidentMapper.toResponse(requireIncident(id));
  }

  public List<IncidentNoteResponse> listNotes(UUID incidentId) {
    requireIncident(incidentId);
    return noteRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId).stream()
        .map(incidentMapper::toResponse)
        .toList();
  }

  public List<IncidentEventResponse> listTimeline(UUID incidentId) {
    requireIncident(incidentId);
    return eventRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId).stream()
        .map(incidentMapper::toResponse)
        .toList();
  }

  @Transactional
  public IncidentResponse createFromAlert(UUID alertId, CreateIncidentFromAlertRequest request) {
    Alert alert = alertService.requireAlert(alertId);
    incidentRepository
        .findByAlertId(alertId)
        .ifPresent(
            existing -> {
              throw new ConflictException(
                  "An incident already exists for this alert: " + existing.getIncidentNumber());
            });

    Incident incident =
        new Incident(
            UUID.randomUUID(),
            nextIncidentNumber(),
            alert.getId(),
            request.title(),
            request.description(),
            request.severity(),
            IncidentStatus.OPEN,
            request.owner());
    Incident saved = incidentRepository.save(incident);

    recordTimeline(
        saved.getId(),
        IncidentEventType.CREATED,
        request.createdBy(),
        "Incident created from alert.");
    if (request.owner() != null && !request.owner().isBlank()) {
      recordTimeline(
          saved.getId(),
          IncidentEventType.OWNER_ASSIGNED,
          request.createdBy(),
          "Owner set to " + request.owner() + ".");
    }
    log.info("Incident {} created from alert {}", saved.getIncidentNumber(), alertId);
    return incidentMapper.toResponse(saved);
  }

  @Transactional
  public IncidentResponse update(UUID id, UpdateIncidentRequest request) {
    Incident incident = requireIncident(id);
    String actor = request.actor();

    if (request.title() != null && !request.title().equals(incident.getTitle())) {
      incident.setTitle(request.title());
    }
    if (request.description() != null) {
      incident.setDescription(request.description());
    }
    if (request.resolutionSummary() != null) {
      incident.setResolutionSummary(request.resolutionSummary());
    }
    if (request.owner() != null && !request.owner().equals(incident.getOwner())) {
      incident.setOwner(request.owner());
      recordTimeline(
          id, IncidentEventType.OWNER_ASSIGNED, actor, "Owner set to " + request.owner() + ".");
    }
    if (request.severity() != null && request.severity() != incident.getSeverity()) {
      IncidentSeverity previous = incident.getSeverity();
      incident.setSeverity(request.severity());
      recordTimeline(
          id,
          IncidentEventType.SEVERITY_CHANGED,
          actor,
          "Severity changed from " + previous + " to " + request.severity() + ".");
    }
    if (request.status() != null && request.status() != incident.getStatus()) {
      applyStatusChange(incident, request.status(), actor);
    }

    Incident saved = incidentRepository.save(incident);
    log.info("Incident {} updated", saved.getIncidentNumber());
    return incidentMapper.toResponse(saved);
  }

  @Transactional
  public IncidentNoteResponse addNote(UUID incidentId, CreateIncidentNoteRequest request) {
    Incident incident = requireIncident(incidentId);
    IncidentNote note =
        noteRepository.save(
            new IncidentNote(
                UUID.randomUUID(), incident.getId(), request.author(), request.content()));
    recordTimeline(incident.getId(), IncidentEventType.NOTE_ADDED, request.author(), "Note added.");
    log.info("Note {} added to incident {}", note.getId(), incident.getIncidentNumber());
    return incidentMapper.toResponse(note);
  }

  public List<IncidentResponse> recentIncidents() {
    return incidentRepository.findTop5ByOrderByCreatedAtDesc().stream()
        .map(incidentMapper::toResponse)
        .toList();
  }

  public long countOpenIncidents() {
    return incidentRepository.countByStatusIn(
        List.of(IncidentStatus.OPEN, IncidentStatus.INVESTIGATING, IncidentStatus.MITIGATED));
  }

  private void applyStatusChange(Incident incident, IncidentStatus next, String actor) {
    if (incident.getStatus() == IncidentStatus.CLOSED) {
      throw new ConflictException("A closed incident cannot change status.");
    }
    if (next.isTerminal()
        && (incident.getResolutionSummary() == null || incident.getResolutionSummary().isBlank())) {
      throw new ConflictException(
          "A resolution summary is required before an incident can be resolved or closed.");
    }
    IncidentStatus previous = incident.getStatus();
    incident.setStatus(next);
    if (next.isTerminal() && incident.getResolvedAt() == null) {
      incident.setResolvedAt(clock.instant());
    }
    recordTimeline(
        incident.getId(),
        next == IncidentStatus.RESOLVED
            ? IncidentEventType.RESOLVED
            : IncidentEventType.STATUS_CHANGED,
        actor,
        "Status changed from " + previous + " to " + next + ".");
  }

  private void recordTimeline(
      UUID incidentId, IncidentEventType type, String actor, String description) {
    eventRepository.save(
        new IncidentEvent(UUID.randomUUID(), incidentId, type, actor, description));
  }

  private Incident requireIncident(UUID id) {
    return incidentRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Incident", id));
  }

  /**
   * Allocates the next incident number. The unique constraint on {@code incident_number} is the
   * authority; a concurrent insert fails the transaction rather than producing a duplicate.
   */
  private String nextIncidentNumber() {
    int year = clock.instant().atZone(ZoneOffset.UTC).getYear();
    long next =
        incidentRepository
            .findHighestIncidentNumber()
            .map(
                highest -> {
                  Matcher matcher = INCIDENT_NUMBER.matcher(highest);
                  return matcher.matches() ? Long.parseLong(matcher.group(2)) + 1 : 1L;
                })
            .orElse(1L);
    return "INC-%d-%04d".formatted(year, next);
  }
}
