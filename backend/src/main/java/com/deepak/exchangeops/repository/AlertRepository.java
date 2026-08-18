package com.deepak.exchangeops.repository;

import com.deepak.exchangeops.domain.Alert;
import com.deepak.exchangeops.domain.AlertSeverity;
import com.deepak.exchangeops.domain.AlertStatus;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AlertRepository
    extends JpaRepository<Alert, UUID>, JpaSpecificationExecutor<Alert> {

  long countByStatusIn(Collection<AlertStatus> statuses);

  long countByStatusAndSeverity(AlertStatus status, AlertSeverity severity);

  List<Alert> findTop5ByOrderByDetectedAtDesc();
}
