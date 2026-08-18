package com.deepak.exchangeops.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.deepak.exchangeops.domain.Incident;
import com.deepak.exchangeops.domain.IncidentEvent;
import com.deepak.exchangeops.domain.IncidentEventType;
import com.deepak.exchangeops.domain.IncidentNote;
import com.deepak.exchangeops.domain.IncidentSeverity;
import com.deepak.exchangeops.domain.IncidentStatus;
import com.deepak.exchangeops.support.AbstractIntegrationTest;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

class IncidentRepositoryIntegrationTest extends AbstractIntegrationTest {

  @Autowired private IncidentRepository incidentRepository;
  @Autowired private IncidentNoteRepository noteRepository;
  @Autowired private IncidentEventRepository incidentEventRepository;

  @Test
  void migrationsSeedTheExpectedSyntheticIncidents() {
    assertThat(incidentRepository.count()).isEqualTo(4);
    assertThat(incidentRepository.countByStatusIn(List.of(IncidentStatus.RESOLVED))).isEqualTo(1);
  }

  @Test
  void filtersByStatusSeverityOwnerAndSearchTerm() {
    var page =
        incidentRepository.findAll(
            IncidentSpecifications.filter(
                IncidentStatus.INVESTIGATING, IncidentSeverity.SEV2, "OPS.BLAKE", "arcadia"),
            PageRequest.of(0, 10, Sort.by("createdAt")));

    assertThat(page.getTotalElements()).isEqualTo(1);
    assertThat(page.getContent().getFirst().getIncidentNumber()).isEqualTo("INC-2026-0001");
  }

  @Test
  void searchMatchesIncidentNumberCaseInsensitively() {
    var page =
        incidentRepository.findAll(
            IncidentSpecifications.filter(null, null, null, "inc-2026-0003"),
            PageRequest.of(0, 10, Sort.by("createdAt")));

    assertThat(page.getTotalElements()).isEqualTo(1);
  }

  @Test
  void notesAndTimelineEntriesAreReturnedInChronologicalOrder() {
    Incident incident =
        incidentRepository.findAll().stream()
            .filter(candidate -> candidate.getIncidentNumber().equals("INC-2026-0001"))
            .findFirst()
            .orElseThrow();

    assertThat(noteRepository.findByIncidentIdOrderByCreatedAtAsc(incident.getId()))
        .extracting(IncidentNote::getAuthor)
        .containsExactly("ops.blake", "ops.avery");
    assertThat(incidentEventRepository.findByIncidentIdOrderByCreatedAtAsc(incident.getId()))
        .extracting(IncidentEvent::getEventType)
        .containsExactly(
            IncidentEventType.CREATED,
            IncidentEventType.OWNER_ASSIGNED,
            IncidentEventType.STATUS_CHANGED);
  }

  @Test
  void incidentNumberIsUnique() {
    Incident duplicate =
        new Incident(
            UUID.randomUUID(),
            "INC-2026-0001",
            null,
            "Duplicate number",
            "Should be rejected by the unique constraint.",
            IncidentSeverity.SEV4,
            IncidentStatus.OPEN,
            null);

    assertThatThrownBy(() -> incidentRepository.saveAndFlush(duplicate))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void notesRequireAnExistingIncident() {
    IncidentNote orphan =
        new IncidentNote(UUID.randomUUID(), UUID.randomUUID(), "ops.avery", "Orphan note");

    assertThatThrownBy(() -> noteRepository.saveAndFlush(orphan))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void highestIncidentNumberDrivesTheNextAllocation() {
    assertThat(incidentRepository.findHighestIncidentNumber()).contains("INC-2026-0004");
  }
}
