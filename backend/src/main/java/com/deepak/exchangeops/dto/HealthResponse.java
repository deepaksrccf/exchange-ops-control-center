package com.deepak.exchangeops.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;

/** Lightweight liveness payload for the API base path. */
@Schema(description = "Service health summary.")
public record HealthResponse(String status, String service, String version, Instant timestamp) {}
