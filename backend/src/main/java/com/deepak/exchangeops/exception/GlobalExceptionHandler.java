package com.deepak.exchangeops.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mapping.PropertyReferenceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Translates exceptions into the shared {@link ApiErrorResponse} shape. */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ApiErrorResponse> handleNotFound(
      ResourceNotFoundException ex, HttpServletRequest request) {
    log.info("Resource not found for {} {}", request.getMethod(), request.getRequestURI());
    return build(HttpStatus.NOT_FOUND, ex.getMessage(), request, List.of());
  }

  @ExceptionHandler(NoResourceFoundException.class)
  public ResponseEntity<ApiErrorResponse> handleNoHandler(
      NoResourceFoundException ex, HttpServletRequest request) {
    return build(HttpStatus.NOT_FOUND, "No endpoint matches this path.", request, List.of());
  }

  @ExceptionHandler(ConflictException.class)
  public ResponseEntity<ApiErrorResponse> handleConflict(
      ConflictException ex, HttpServletRequest request) {
    log.info("Conflict for {} {}", request.getMethod(), request.getRequestURI());
    return build(HttpStatus.CONFLICT, ex.getMessage(), request, List.of());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleValidation(
      MethodArgumentNotValidException ex, HttpServletRequest request) {
    List<ApiErrorResponse.FieldViolation> violations =
        ex.getBindingResult().getFieldErrors().stream()
            .map(
                error ->
                    new ApiErrorResponse.FieldViolation(
                        error.getField(),
                        error.getDefaultMessage() == null
                            ? "is invalid"
                            : error.getDefaultMessage()))
            .sorted((a, b) -> a.field().compareTo(b.field()))
            .toList();
    return build(HttpStatus.BAD_REQUEST, "Request validation failed.", request, violations);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
      ConstraintViolationException ex, HttpServletRequest request) {
    List<ApiErrorResponse.FieldViolation> violations =
        ex.getConstraintViolations().stream()
            .map(
                violation ->
                    new ApiErrorResponse.FieldViolation(
                        violation.getPropertyPath().toString(), violation.getMessage()))
            .sorted((a, b) -> a.field().compareTo(b.field()))
            .toList();
    return build(HttpStatus.BAD_REQUEST, "Request validation failed.", request, violations);
  }

  @ExceptionHandler({
    MethodArgumentTypeMismatchException.class,
    MissingServletRequestParameterException.class,
    HttpMessageNotReadableException.class,
    PropertyReferenceException.class
  })
  public ResponseEntity<ApiErrorResponse> handleBadRequest(
      Exception ex, HttpServletRequest request) {
    log.info(
        "Rejected malformed request for {} {}: {}",
        request.getMethod(),
        request.getRequestURI(),
        ex.getClass().getSimpleName());
    return build(
        HttpStatus.BAD_REQUEST,
        "The request could not be read. Check parameter names, types and body format.",
        request,
        List.of());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorResponse> handleUnexpected(
      Exception ex, HttpServletRequest request) {

    log.error(
        "Unhandled exception while processing {} {}",
        request.getMethod(),
        request.getRequestURI(),
        ex);
    // Log the cause internally; never return internal details to the client.
    log.error("Unhandled error for {} {}", request.getMethod(), request.getRequestURI(), ex);
    return build(
        HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.", request, List.of());
  }

  private ResponseEntity<ApiErrorResponse> build(
      HttpStatus status,
      String message,
      HttpServletRequest request,
      List<ApiErrorResponse.FieldViolation> violations) {
    ApiErrorResponse body =
        new ApiErrorResponse(
            status.value(),
            status.getReasonPhrase(),
            message,
            request.getRequestURI(),
            violations,
            Instant.now());
    return ResponseEntity.status(status).body(body);
  }
}
