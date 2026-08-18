package com.deepak.exchangeops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/** An operational incident opened to track remediation work for one or more alerts. */
@Entity
@Table(name = "incident")
public class Incident {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "incident_number", nullable = false, unique = true, length = 32)
  private String incidentNumber;

  @Column(name = "alert_id")
  private UUID alertId;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(nullable = false, length = 4000)
  private String description;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private IncidentSeverity severity;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private IncidentStatus status;

  @Column(length = 128)
  private String owner;

  @Column(name = "resolution_summary", length = 4000)
  private String resolutionSummary;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "resolved_at")
  private Instant resolvedAt;

  protected Incident() {}

  public Incident(
      UUID id,
      String incidentNumber,
      UUID alertId,
      String title,
      String description,
      IncidentSeverity severity,
      IncidentStatus status,
      String owner) {
    this.id = id;
    this.incidentNumber = incidentNumber;
    this.alertId = alertId;
    this.title = title;
    this.description = description;
    this.severity = severity;
    this.status = status;
    this.owner = owner;
  }

  @PrePersist
  void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
    Instant now = Instant.now();
    createdAt = now;
    updatedAt = now;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public String getIncidentNumber() {
    return incidentNumber;
  }

  public UUID getAlertId() {
    return alertId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public IncidentSeverity getSeverity() {
    return severity;
  }

  public void setSeverity(IncidentSeverity severity) {
    this.severity = severity;
  }

  public IncidentStatus getStatus() {
    return status;
  }

  public void setStatus(IncidentStatus status) {
    this.status = status;
  }

  public String getOwner() {
    return owner;
  }

  public void setOwner(String owner) {
    this.owner = owner;
  }

  public String getResolutionSummary() {
    return resolutionSummary;
  }

  public void setResolutionSummary(String resolutionSummary) {
    this.resolutionSummary = resolutionSummary;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public Instant getResolvedAt() {
    return resolvedAt;
  }

  public void setResolvedAt(Instant resolvedAt) {
    this.resolvedAt = resolvedAt;
  }

  @Override
  public boolean equals(Object other) {
    return other instanceof Incident incident && id != null && id.equals(incident.id);
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(id);
  }
}
