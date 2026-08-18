package com.deepak.exchangeops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/** An immutable audit entry on an incident timeline. Rows are never updated or deleted. */
@Entity
@Table(name = "incident_event")
public class IncidentEvent {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "incident_id", nullable = false, updatable = false)
  private UUID incidentId;

  @Enumerated(EnumType.STRING)
  @Column(name = "event_type", nullable = false, updatable = false, length = 32)
  private IncidentEventType eventType;

  @Column(nullable = false, updatable = false, length = 128)
  private String actor;

  @Column(nullable = false, updatable = false, length = 1000)
  private String description;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected IncidentEvent() {}

  public IncidentEvent(
      UUID id, UUID incidentId, IncidentEventType eventType, String actor, String description) {
    this.id = id;
    this.incidentId = incidentId;
    this.eventType = eventType;
    this.actor = actor;
    this.description = description;
  }

  @PrePersist
  void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    createdAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public UUID getIncidentId() {
    return incidentId;
  }

  public IncidentEventType getEventType() {
    return eventType;
  }

  public String getActor() {
    return actor;
  }

  public String getDescription() {
    return description;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  @Override
  public boolean equals(Object other) {
    return other instanceof IncidentEvent event && id != null && id.equals(event.id);
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(id);
  }
}
