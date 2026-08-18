package com.deepak.exchangeops.repository;

import com.deepak.exchangeops.domain.IncidentNote;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentNoteRepository extends JpaRepository<IncidentNote, UUID> {

  List<IncidentNote> findByIncidentIdOrderByCreatedAtAsc(UUID incidentId);
}
