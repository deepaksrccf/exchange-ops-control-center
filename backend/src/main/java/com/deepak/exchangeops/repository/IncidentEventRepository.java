package com.deepak.exchangeops.repository;

import com.deepak.exchangeops.domain.IncidentEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IncidentEventRepository extends JpaRepository<IncidentEvent, UUID> {

  List<IncidentEvent> findByIncidentIdOrderByCreatedAtAsc(UUID incidentId);
}
