package com.deepak.exchangeops.exception;

/** Raised when a requested resource does not exist. Mapped to HTTP 404. */
public class ResourceNotFoundException extends RuntimeException {

  public ResourceNotFoundException(String resource, Object identifier) {
    super(resource + " not found: " + identifier);
  }
}
