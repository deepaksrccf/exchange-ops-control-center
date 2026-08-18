package com.deepak.exchangeops.domain;

/** Lifecycle state of an alert in the operations queue. */
public enum AlertStatus {
  OPEN,
  ACKNOWLEDGED,
  ESCALATED,
  RESOLVED,
  SUPPRESSED
}
