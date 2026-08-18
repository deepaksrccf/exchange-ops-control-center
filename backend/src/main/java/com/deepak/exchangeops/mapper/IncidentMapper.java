package com.deepak.exchangeops.mapper;

import com.deepak.exchangeops.domain.Incident;
import com.deepak.exchangeops.domain.IncidentEvent;
import com.deepak.exchangeops.domain.IncidentNote;
import com.deepak.exchangeops.dto.IncidentEventResponse;
import com.deepak.exchangeops.dto.IncidentNoteResponse;
import com.deepak.exchangeops.dto.IncidentResponse;
import org.springframework.stereotype.Component;

@Component
public class IncidentMapper {

  public IncidentResponse toResponse(Incident incident) {
    return new IncidentResponse(
        incident.getId(),
        incident.getIncidentNumber(),
        incident.getAlertId(),
        incident.getTitle(),
        incident.getDescription(),
        incident.getSeverity(),
        incident.getStatus(),
        incident.getOwner(),
        incident.getResolutionSummary(),
        incident.getCreatedAt(),
        incident.getUpdatedAt(),
        incident.getResolvedAt());
  }

  public IncidentNoteResponse toResponse(IncidentNote note) {
    return new IncidentNoteResponse(
        note.getId(),
        note.getIncidentId(),
        note.getAuthor(),
        note.getContent(),
        note.getCreatedAt());
  }

  public IncidentEventResponse toResponse(IncidentEvent event) {
    return new IncidentEventResponse(
        event.getId(),
        event.getIncidentId(),
        event.getEventType(),
        event.getActor(),
        event.getDescription(),
        event.getCreatedAt());
  }
}
