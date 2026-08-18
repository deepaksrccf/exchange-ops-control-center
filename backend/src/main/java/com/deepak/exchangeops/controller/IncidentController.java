package com.deepak.exchangeops.controller;

import com.deepak.exchangeops.domain.IncidentSeverity;
import com.deepak.exchangeops.domain.IncidentStatus;
import com.deepak.exchangeops.dto.CreateIncidentNoteRequest;
import com.deepak.exchangeops.dto.IncidentEventResponse;
import com.deepak.exchangeops.dto.IncidentNoteResponse;
import com.deepak.exchangeops.dto.IncidentResponse;
import com.deepak.exchangeops.dto.PageResponse;
import com.deepak.exchangeops.dto.UpdateIncidentRequest;
import com.deepak.exchangeops.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/incidents")
@Tag(name = "Incidents", description = "Incident management workflow.")
public class IncidentController {

  private final IncidentService incidentService;

  public IncidentController(IncidentService incidentService) {
    this.incidentService = incidentService;
  }

  @GetMapping
  @Operation(summary = "List incidents with pagination, sorting and filtering")
  public PageResponse<IncidentResponse> list(
      @RequestParam(required = false) IncidentStatus status,
      @RequestParam(required = false) IncidentSeverity severity,
      @RequestParam(required = false) String owner,
      @RequestParam(required = false) String search,
      @PageableDefault(size = 25, sort = "createdAt", direction = Sort.Direction.DESC)
          Pageable pageable) {
    return incidentService.search(status, severity, owner, search, pageable);
  }

  @GetMapping("/{id}")
  @Operation(summary = "Fetch a single incident")
  public IncidentResponse get(@PathVariable UUID id) {
    return incidentService.getById(id);
  }

  @PatchMapping("/{id}")
  @Operation(summary = "Apply a partial update to an incident")
  public IncidentResponse update(
      @PathVariable UUID id, @Valid @RequestBody UpdateIncidentRequest request) {
    return incidentService.update(id, request);
  }

  @GetMapping("/{id}/notes")
  @Operation(summary = "List notes attached to an incident")
  public List<IncidentNoteResponse> notes(@PathVariable UUID id) {
    return incidentService.listNotes(id);
  }

  @PostMapping("/{id}/notes")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Append a note to an incident")
  public IncidentNoteResponse addNote(
      @PathVariable UUID id, @Valid @RequestBody CreateIncidentNoteRequest request) {
    return incidentService.addNote(id, request);
  }

  @GetMapping("/{id}/timeline")
  @Operation(summary = "Read the immutable incident timeline")
  public List<IncidentEventResponse> timeline(@PathVariable UUID id) {
    return incidentService.listTimeline(id);
  }
}
