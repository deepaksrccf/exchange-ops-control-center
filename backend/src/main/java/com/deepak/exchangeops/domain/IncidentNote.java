package com.deepak.exchangeops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/** A free-text note appended to an incident by an operator. Notes are append-only. */
@Entity
@Table(name = "incident_note")
public class IncidentNote {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "incident_id", nullable = false, updatable = false)
  private UUID incidentId;

  @Column(nullable = false, updatable = false, length = 128)
  private String author;

  @Column(nullable = false, updatable = false, length = 4000)
  private String content;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected IncidentNote() {}

  public IncidentNote(UUID id, UUID incidentId, String author, String content) {
    this.id = id;
    this.incidentId = incidentId;
    this.author = author;
    this.content = content;
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

  public String getAuthor() {
    return author;
  }

  public String getContent() {
    return content;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  @Override
  public boolean equals(Object other) {
    return other instanceof IncidentNote note && id != null && id.equals(note.id);
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(id);
  }
}
