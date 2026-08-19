package com.deepak.exchangeops.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.deepak.exchangeops.domain.Alert;
import com.deepak.exchangeops.domain.AlertRule;
import com.deepak.exchangeops.domain.AlertRuleType;
import com.deepak.exchangeops.domain.AlertSeverity;
import com.deepak.exchangeops.domain.AlertStatus;
import com.deepak.exchangeops.dto.AlertResponse;
import com.deepak.exchangeops.exception.ConflictException;
import com.deepak.exchangeops.exception.ResourceNotFoundException;
import com.deepak.exchangeops.mapper.AlertMapper;
import com.deepak.exchangeops.repository.AlertRepository;
import com.deepak.exchangeops.repository.AlertRuleRepository;
import com.deepak.exchangeops.repository.IncidentRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AlertServiceTest {

  private static final Instant NOW = Instant.parse("2026-04-01T12:00:00Z");
  private static final Instant DETECTED = Instant.parse("2026-04-01T11:00:00Z");
  private static final UUID ALERT_ID = UUID.fromString("aaaaaaaa-0000-4000-8000-000000000001");
  private static final UUID RULE_ID = UUID.fromString("bbbbbbbb-0000-4000-8000-000000000001");
  private static final UUID VENUE_ID = UUID.fromString("cccccccc-0000-4000-8000-000000000001");
  private static final UUID SYMBOL_ID = UUID.fromString("dddddddd-0000-4000-8000-000000000001");

  @Mock private AlertRepository alertRepository;
  @Mock private AlertRuleRepository alertRuleRepository;
  @Mock private IncidentRepository incidentRepository;

  private StubReferenceDataService referenceDataService;

  private AlertService alertService;

  @BeforeEach
  void setUp() {
    referenceDataService = new StubReferenceDataService();
    alertService =
        new AlertService(
            alertRepository,
            alertRuleRepository,
            incidentRepository,
            referenceDataService,
            new AlertMapper(),
            Clock.fixed(NOW, ZoneOffset.UTC));
  }

  @Test
  void acknowledgeStampsOperatorAndTimestamp() {
    Alert alert = alert(AlertStatus.OPEN);
    when(alertRepository.findById(ALERT_ID)).thenReturn(Optional.of(alert));
    stubEnrichment();

    AlertResponse response = alertService.acknowledge(ALERT_ID, "ops.avery");

    assertThat(response.status()).isEqualTo(AlertStatus.ACKNOWLEDGED);
    assertThat(response.assignedTo()).isEqualTo("ops.avery");
    assertThat(response.acknowledgedAt()).isEqualTo(NOW);
    assertThat(response.ruleName()).isEqualTo("Feed Latency Breach");
    assertThat(response.venueCode()).isEqualTo("NVLX");
    assertThat(response.symbolTicker()).isEqualTo("ALPH");
    verify(alertRepository).save(alert);
  }

  @Test
  void acknowledgeKeepsTheOriginalAcknowledgementTimestamp() {
    Alert alert = alert(AlertStatus.OPEN);
    alert.acknowledge("ops.blake", DETECTED);
    when(alertRepository.findById(ALERT_ID)).thenReturn(Optional.of(alert));
    stubEnrichment();

    AlertResponse response = alertService.acknowledge(ALERT_ID, "ops.avery");

    assertThat(response.acknowledgedAt()).isEqualTo(DETECTED);
    assertThat(response.assignedTo()).isEqualTo("ops.avery");
  }

  @Test
  void acknowledgeRejectsResolvedAlerts() {
    when(alertRepository.findById(ALERT_ID)).thenReturn(Optional.of(alert(AlertStatus.RESOLVED)));

    assertThatThrownBy(() -> alertService.acknowledge(ALERT_ID, "ops.avery"))
        .isInstanceOf(ConflictException.class)
        .hasMessageContaining("resolved alert");
    verify(alertRepository, never()).save(any());
  }

  @Test
  void getByIdFailsWhenTheAlertDoesNotExist() {
    when(alertRepository.findById(ALERT_ID)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> alertService.getById(ALERT_ID))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  private void stubEnrichment() {
    when(alertRuleRepository.findAll()).thenReturn(List.of(rule()));
    when(incidentRepository.findByAlertIdIn(anyList())).thenReturn(List.of());
    referenceDataService.setVenueCodesById(Map.of(VENUE_ID, "NVLX"));
    referenceDataService.setSymbolTickersById(Map.of(SYMBOL_ID, "ALPH"));
  }

  private Alert alert(AlertStatus status) {
    return new Alert(
        ALERT_ID,
        RULE_ID,
        null,
        VENUE_ID,
        SYMBOL_ID,
        AlertSeverity.HIGH,
        status,
        "Feed Latency Breach triggered on ALPH",
        "Synthetic detection.",
        null,
        DETECTED);
  }

  private AlertRule rule() {
    return new AlertRule(
        RULE_ID,
        "Feed Latency Breach",
        AlertRuleType.LATENCY_THRESHOLD,
        AlertSeverity.HIGH,
        new BigDecimal("250.000000"),
        60,
        true);
  }

  /**
   * Stub implementation of ReferenceDataService for testing AlertService. Uses simple HashMaps to
   * store data instead of Mockito mocking, avoiding Java 25 bytecode instrumentation issues.
   */
  private static class StubReferenceDataService extends ReferenceDataService {
    private Map<UUID, String> venueCodesById = new HashMap<>();
    private Map<UUID, String> symbolTickersById = new HashMap<>();

    StubReferenceDataService() {
      super(null, null, null, null);
    }

    void setVenueCodesById(Map<UUID, String> data) {
      this.venueCodesById = new HashMap<>(data);
    }

    void setSymbolTickersById(Map<UUID, String> data) {
      this.symbolTickersById = new HashMap<>(data);
    }

    @Override
    public Map<UUID, String> venueCodesById() {
      return new HashMap<>(venueCodesById);
    }

    @Override
    public Map<UUID, String> symbolTickersById() {
      return new HashMap<>(symbolTickersById);
    }
  }
}
