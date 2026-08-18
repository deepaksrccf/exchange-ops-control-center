package com.deepak.exchangeops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** A synthetic market data event ingested from a simulated venue feed. */
@Entity
@Table(name = "market_event")
public class MarketEvent {

  @Id
  @Column(nullable = false, updatable = false)
  private UUID id;

  @Column(name = "venue_id", nullable = false)
  private UUID venueId;

  @Column(name = "symbol_id", nullable = false)
  private UUID symbolId;

  @Column(name = "sequence_number", nullable = false)
  private long sequenceNumber;

  @Enumerated(EnumType.STRING)
  @Column(name = "event_type", nullable = false, length = 32)
  private EventType eventType;

  @Column(precision = 19, scale = 6)
  private BigDecimal price;

  @Column(nullable = false)
  private long quantity;

  @Column(name = "event_timestamp", nullable = false)
  private Instant eventTimestamp;

  @Column(name = "received_timestamp", nullable = false)
  private Instant receivedTimestamp;

  @Column(name = "processing_latency_ms", nullable = false)
  private long processingLatencyMs;

  @Column(nullable = false, length = 64)
  private String source;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb")
  private Map<String, Object> metadata;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  protected MarketEvent() {}

  @SuppressWarnings("checkstyle:ParameterNumber")
  public MarketEvent(
      UUID id,
      UUID venueId,
      UUID symbolId,
      long sequenceNumber,
      EventType eventType,
      BigDecimal price,
      long quantity,
      Instant eventTimestamp,
      Instant receivedTimestamp,
      long processingLatencyMs,
      String source,
      Map<String, Object> metadata) {
    this.id = id;
    this.venueId = venueId;
    this.symbolId = symbolId;
    this.sequenceNumber = sequenceNumber;
    this.eventType = eventType;
    this.price = price;
    this.quantity = quantity;
    this.eventTimestamp = eventTimestamp;
    this.receivedTimestamp = receivedTimestamp;
    this.processingLatencyMs = processingLatencyMs;
    this.source = source;
    this.metadata = metadata;
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

  public UUID getVenueId() {
    return venueId;
  }

  public UUID getSymbolId() {
    return symbolId;
  }

  public long getSequenceNumber() {
    return sequenceNumber;
  }

  public EventType getEventType() {
    return eventType;
  }

  public BigDecimal getPrice() {
    return price;
  }

  public long getQuantity() {
    return quantity;
  }

  public Instant getEventTimestamp() {
    return eventTimestamp;
  }

  public Instant getReceivedTimestamp() {
    return receivedTimestamp;
  }

  public long getProcessingLatencyMs() {
    return processingLatencyMs;
  }

  public String getSource() {
    return source;
  }

  public Map<String, Object> getMetadata() {
    return metadata;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  @Override
  public boolean equals(Object other) {
    return other instanceof MarketEvent event && id != null && id.equals(event.id);
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(id);
  }
}
