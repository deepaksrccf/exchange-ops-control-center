package com.deepak.exchangeops.repository;

import com.deepak.exchangeops.domain.Incident;
import com.deepak.exchangeops.domain.IncidentSeverity;
import com.deepak.exchangeops.domain.IncidentStatus;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

/** Composable filters for the incident list endpoint. */
public final class IncidentSpecifications {

  private IncidentSpecifications() {}

  public static Specification<Incident> filter(
      IncidentStatus status, IncidentSeverity severity, String owner, String search) {
    return (root, query, cb) -> {
      List<Predicate> predicates = new ArrayList<>();
      if (status != null) {
        predicates.add(cb.equal(root.get("status"), status));
      }
      if (severity != null) {
        predicates.add(cb.equal(root.get("severity"), severity));
      }
      if (owner != null && !owner.isBlank()) {
        predicates.add(cb.equal(cb.lower(root.get("owner")), owner.toLowerCase()));
      }
      if (search != null && !search.isBlank()) {
        String pattern = "%" + search.toLowerCase() + "%";
        predicates.add(
            cb.or(
                cb.like(cb.lower(root.get("title")), pattern),
                cb.like(cb.lower(root.get("incidentNumber")), pattern)));
      }
      return cb.and(predicates.toArray(Predicate[]::new));
    };
  }
}
