package com.deepak.exchangeops.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.UUID;

@Schema(description = "An append-only note attached to an incident.")
public record IncidentNoteResponse(
    UUID id, UUID incidentId, String author, String content, Instant createdAt) {}
