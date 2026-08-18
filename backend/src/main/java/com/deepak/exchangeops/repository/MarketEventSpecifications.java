package com.deepak.exchangeops.repository;

import com.deepak.exchangeops.domain.EventType;
import com.deepak.exchangeops.domain.MarketEvent;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

/** Composable filters for the market event list endpoint. */
public final class MarketEventSpecifications {

  private MarketEventSpecifications() {}

  public static Specification<MarketEvent> filter(
      UUID venueId,
      UUID symbolId,
      EventType eventType,
      Instant from,
      Instant to,
      Long minLatencyMs) {
    return (root, query, cb) -> {
      List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
      if (venueId != null) {
        predicates.add(cb.equal(root.get("venueId"), venueId));
      }
      if (symbolId != null) {
        predicates.add(cb.equal(root.get("symbolId"), symbolId));
      }
      if (eventType != null) {
        predicates.add(cb.equal(root.get("eventType"), eventType));
      }
      if (from != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("eventTimestamp"), from));
      }
      if (to != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("eventTimestamp"), to));
      }
      if (minLatencyMs != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("processingLatencyMs"), minLatencyMs));
      }
      return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
    };
  }
}
