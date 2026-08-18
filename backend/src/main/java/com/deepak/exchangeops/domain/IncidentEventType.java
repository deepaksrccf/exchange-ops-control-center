package com.deepak.exchangeops.domain;

/** Entry type recorded on the immutable incident timeline. */
public enum IncidentEventType {
  CREATED,
  STATUS_CHANGED,
  SEVERITY_CHANGED,
  OWNER_ASSIGNED,
  NOTE_ADDED,
  RESOLVED
}
