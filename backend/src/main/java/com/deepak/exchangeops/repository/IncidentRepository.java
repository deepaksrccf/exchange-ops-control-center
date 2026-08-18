package com.deepak.exchangeops.repository;

import com.deepak.exchangeops.domain.Incident;
import com.deepak.exchangeops.domain.IncidentStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface IncidentRepository
    extends JpaRepository<Incident, UUID>, JpaSpecificationExecutor<Incident> {

  long countByStatusIn(Collection<IncidentStatus> statuses);

  List<Incident> findTop5ByOrderByCreatedAtDesc();

  Optional<Incident> findByAlertId(UUID alertId);

  List<Incident> findByAlertIdIn(Collection<UUID> alertIds);

  @Query("select max(i.incidentNumber) from Incident i")
  Optional<String> findHighestIncidentNumber();
}
