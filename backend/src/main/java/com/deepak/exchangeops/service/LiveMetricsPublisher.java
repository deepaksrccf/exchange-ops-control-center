package com.deepak.exchangeops.service;

import com.deepak.exchangeops.dto.MetricsSummaryResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Periodically broadcasts the existing synthetic operations summary.
 *
 * <p>The REST metrics endpoint and this publisher use the same
 * MetricsService, keeping the persisted database as the source of truth.
 */
@Service
public class LiveMetricsPublisher {

  private static final Logger log =
      LoggerFactory.getLogger(LiveMetricsPublisher.class);

  private final MetricsService metricsService;
  private final SimpMessagingTemplate messagingTemplate;
  private final boolean enabled;

  public LiveMetricsPublisher(
      MetricsService metricsService,
      SimpMessagingTemplate messagingTemplate,
      @Value("${app.metrics-broadcast.enabled:true}")
          boolean enabled) {

    this.metricsService = metricsService;
    this.messagingTemplate = messagingTemplate;
    this.enabled = enabled;
  }

  @Scheduled(
      fixedDelayString =
          "${app.metrics-broadcast.interval-ms:2000}",
      initialDelayString =
          "${app.metrics-broadcast.initial-delay-ms:3000}")
  public void broadcastSummary() {
    if (!enabled) {
      return;
    }

    try {
      MetricsSummaryResponse summary =
          metricsService.summary();

      messagingTemplate.convertAndSend(
          "/topic/metrics",
          summary);
    } catch (RuntimeException exception) {
      log.warn(
          "Live metrics publication failed: {}",
          exception.getMessage());
    }
  }
}
