package com.deepak.exchangeops.domain;

/** Category of a synthetic market event received from a simulated venue feed. */
public enum EventType {
  TRADE,
  QUOTE,
  ORDER_ACCEPTED,
  ORDER_CANCELLED,
  HALT,
  RESUME,
  REFERENCE_UPDATE
}
