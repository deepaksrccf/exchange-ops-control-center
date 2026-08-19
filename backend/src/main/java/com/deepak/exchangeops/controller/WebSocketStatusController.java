package com.deepak.exchangeops.controller;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Reports the configured real-time messaging destinations. */
@RestController
@RequestMapping("/api/v1/realtime")
public class WebSocketStatusController {

  private final Clock clock;

  public WebSocketStatusController(Clock clock) {
    this.clock = clock;
  }

  @GetMapping("/status")
  public ResponseEntity<Map<String, Object>> status() {
    return ResponseEntity.ok(
        Map.of(
            "status", "AVAILABLE",
            "endpoint", "/ws",
            "protocol", "STOMP",
            "eventDestination", "/topic/events",
            "alertDestination", "/topic/alerts",
            "metricsDestination", "/topic/metrics",
            "syntheticDataOnly", true,
            "timestamp", Instant.now(clock)));
  }
}
