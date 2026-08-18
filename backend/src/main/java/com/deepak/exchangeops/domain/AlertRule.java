package com.deepak.exchangeops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/** A configurable detection rule that produces alerts from the synthetic event stream. */
@Entity
@Table(name = "alert_rule")
public class AlertRule {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(nullable = false, unique = true, length = 128)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(name = "rule_type", nullable = false, length = 32)
  private AlertRuleType ruleType;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private AlertSeverity severity;

  @Column(nullable = false, precision = 19, scale = 6)
  private BigDecimal threshold;

  @Column(name = "window_seconds", nullable = false)
  private long windowSeconds;

  @Column(nullable = false)
  private boolean enabled;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected AlertRule() {}

  public AlertRule(
      UUID id,
      String name,
      AlertRuleType ruleType,
      AlertSeverity severity,
      BigDecimal threshold,
      long windowSeconds,
      boolean enabled) {
    this.id = id;
    this.name = name;
    this.ruleType = ruleType;
    this.severity = severity;
    this.threshold = threshold;
    this.windowSeconds = windowSeconds;
    this.enabled = enabled;
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

  public String getName() {
    return name;
  }

  public AlertRuleType getRuleType() {
    return ruleType;
  }

  public AlertSeverity getSeverity() {
    return severity;
  }

  public BigDecimal getThreshold() {
    return threshold;
  }

  public long getWindowSeconds() {
    return windowSeconds;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  @Override
  public boolean equals(Object other) {
    return other instanceof AlertRule rule && id != null && id.equals(rule.id);
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(id);
  }
}
