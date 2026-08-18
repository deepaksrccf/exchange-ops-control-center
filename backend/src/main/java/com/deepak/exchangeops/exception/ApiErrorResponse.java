package com.deepak.exchangeops.exception;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;

/** Consistent error payload returned by every failing endpoint. */
@Schema(description = "Standard error payload.")
public record ApiErrorResponse(
    int status,
    String error,
    String message,
    String path,
    List<FieldViolation> violations,
    Instant timestamp) {

  /** A single field-level validation failure. */
  @Schema(description = "A field-level validation failure.")
  public record FieldViolation(String field, String message) {}

  public static ApiErrorResponse of(int status, String error, String message, String path) {
    return new ApiErrorResponse(status, error, message, path, List.of(), Instant.now());
  }
}
