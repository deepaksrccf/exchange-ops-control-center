package com.deepak.exchangeops.repository;

import com.deepak.exchangeops.domain.Alert;
import com.deepak.exchangeops.domain.AlertSeverity;
import com.deepak.exchangeops.domain.AlertStatus;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

/** Composable filters for the alert queue endpoint. */
public final class AlertSpecifications {

  private AlertSpecifications() {}

  public static Specification<Alert> filter(
      AlertStatus status,
      AlertSeverity severity,
      UUID venueId,
      UUID symbolId,
      UUID ruleId,
      String assignedTo) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();
      if (status != null) {
        predicates.add(cb.equal(root.get("status"), status));
      }
      if (severity != null) {
        predicates.add(cb.equal(root.get("severity"), severity));
      }
      if (venueId != null) {
        predicates.add(cb.equal(root.get("venueId"), venueId));
      }
      if (symbolId != null) {
        predicates.add(cb.equal(root.get("symbolId"), symbolId));
      }
      if (ruleId != null) {
        predicates.add(cb.equal(root.get("ruleId"), ruleId));
      }
      if (assignedTo != null && !assignedTo.isBlank()) {
        predicates.add(cb.equal(cb.lower(root.get("assignedTo")), assignedTo.toLowerCase()));
      }
      return cb.and(predicates.toArray(Predicate[]::new));
    };
  }
}
