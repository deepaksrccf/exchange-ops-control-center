package com.deepak.exchangeops.controller;

import com.deepak.exchangeops.dto.MetricsSummaryResponse;
import com.deepak.exchangeops.service.MetricsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/metrics")
@Tag(name = "Metrics", description = "Aggregated figures for the operations dashboard.")
public class MetricsController {

  private final MetricsService metricsService;

  public MetricsController(MetricsService metricsService) {
    this.metricsService = metricsService;
  }

  @GetMapping("/summary")
  @Operation(summary = "Aggregate dashboard metrics computed from synthetic data")
  public MetricsSummaryResponse summary() {
    return metricsService.summary();
  }
}
