package com.deepak.exchangeops.domain;

/** Lifecycle state of an operational incident. */
public enum IncidentStatus {
  OPEN,
  INVESTIGATING,
  MITIGATED,
  RESOLVED,
  CLOSED;

  /** Terminal states stamp {@code resolvedAt} and forbid further status transitions. */
  public boolean isTerminal() {
    return this == RESOLVED || this == CLOSED;
  }
}
