package com.deepak.exchangeops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/** A fictional instrument traded on a fictional venue. */
@Entity
@Table(name = "symbol")
public class Symbol {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(nullable = false, length = 16)
  private String ticker;

  @Column(name = "display_name", nullable = false, length = 128)
  private String displayName;

  @Column(name = "venue_id", nullable = false)
  private UUID venueId;

  @Column(nullable = false)
  private boolean active;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  protected Symbol() {}

  public Symbol(UUID id, String ticker, String displayName, UUID venueId, boolean active) {
    this.id = id;
    this.ticker = ticker;
    this.displayName = displayName;
    this.venueId = venueId;
    this.active = active;
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

  public String getTicker() {
    return ticker;
  }

  public String getDisplayName() {
    return displayName;
  }

  public UUID getVenueId() {
    return venueId;
  }

  public boolean isActive() {
    return active;
  }

  public void setActive(boolean active) {
    this.active = active;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  @Override
  public boolean equals(Object other) {
    return other instanceof Symbol symbol && id != null && id.equals(symbol.id);
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(id);
  }
}
