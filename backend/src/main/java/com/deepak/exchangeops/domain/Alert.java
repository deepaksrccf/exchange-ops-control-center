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

/** An operator-facing alert raised by an {@link AlertRule} against a {@link MarketEvent}. */
@Entity
@Table(name = "alert")
public class Alert {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "rule_id", nullable = false)
  private UUID ruleId;

  @Column(name = "event_id")
  private UUID eventId;

  @Column(name = "venue_id", nullable = false)
  private UUID venueId;

  @Column(name = "symbol_id")
  private UUID symbolId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private AlertSeverity severity;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private AlertStatus status;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(nullable = false, length = 2000)
  private String explanation;

  @Column(name = "assigned_to", length = 128)
  private String assignedTo;

  @Column(name = "detected_at", nullable = false)
  private Instant detectedAt;

  @Column(name = "acknowledged_at")
  private Instant acknowledgedAt;

  @Column(name = "resolved_at")
  private Instant resolvedAt;

  protected Alert() {}

  @SuppressWarnings("checkstyle:ParameterNumber")
  public Alert(
      UUID id,
      UUID ruleId,
      UUID eventId,
      UUID venueId,
      UUID symbolId,
      AlertSeverity severity,
      AlertStatus status,
      String title,
      String explanation,
      String assignedTo,
      Instant detectedAt) {
    this.id = id;
    this.ruleId = ruleId;
    this.eventId = eventId;
    this.venueId = venueId;
    this.symbolId = symbolId;
    this.severity = severity;
    this.status = status;
    this.title = title;
    this.explanation = explanation;
    this.assignedTo = assignedTo;
    this.detectedAt = detectedAt;
  }

  @PrePersist
  void onCreate() {
    if (id == null) {
      id = UUID.randomUUID();
    }
  }

  /** Marks the alert acknowledged by an operator. No-op if already acknowledged. */
  public void acknowledge(String operator, Instant when) {
    this.status = AlertStatus.ACKNOWLEDGED;
    this.assignedTo = operator;
    if (this.acknowledgedAt == null) {
      this.acknowledgedAt = when;
    }
  }

  public UUID getId() {
    return id;
  }

  public UUID getRuleId() {
    return ruleId;
  }

  public UUID getEventId() {
    return eventId;
  }

  public UUID getVenueId() {
    return venueId;
  }

  public UUID getSymbolId() {
    return symbolId;
  }

  public AlertSeverity getSeverity() {
    return severity;
  }

  public AlertStatus getStatus() {
    return status;
  }

  public void setStatus(AlertStatus status) {
    this.status = status;
  }

  public String getTitle() {
    return title;
  }

  public String getExplanation() {
    return explanation;
  }

  public String getAssignedTo() {
    return assignedTo;
  }

  public void setAssignedTo(String assignedTo) {
    this.assignedTo = assignedTo;
  }

  public Instant getDetectedAt() {
    return detectedAt;
  }

  public Instant getAcknowledgedAt() {
    return acknowledgedAt;
  }

  public Instant getResolvedAt() {
    return resolvedAt;
  }

  public void setResolvedAt(Instant resolvedAt) {
    this.resolvedAt = resolvedAt;
  }

  @Override
  public boolean equals(Object other) {
    return other instanceof Alert alert && id != null && id.equals(alert.id);
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(id);
  }
}
