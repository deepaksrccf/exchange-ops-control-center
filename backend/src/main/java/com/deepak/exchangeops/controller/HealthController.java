package com.deepak.exchangeops.controller;

import com.deepak.exchangeops.dto.HealthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Clock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health", description = "Service liveness for the API surface.")
public class HealthController {

  private final Clock clock;
  private final String version;

  public HealthController(
      Clock clock, @Value("${spring.application.name:exchange-ops-backend}") String version) {
    this.clock = clock;
    this.version = version;
  }

  @GetMapping
  @Operation(summary = "Report API availability")
  public HealthResponse health() {
    return new HealthResponse("UP", "exchange-ops-backend", version, clock.instant());
  }
}
