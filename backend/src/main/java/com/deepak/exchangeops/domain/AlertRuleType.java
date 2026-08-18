package com.deepak.exchangeops.domain;

/** Detection strategy implemented by an alert rule. */
public enum AlertRuleType {
  LATENCY_THRESHOLD,
  PRICE_DEVIATION,
  VOLUME_SPIKE,
  SEQUENCE_GAP,
  STALE_FEED,
  VENUE_STATUS_CHANGE
}
