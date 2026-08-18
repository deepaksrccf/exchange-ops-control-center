package com.deepak.exchangeops.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.deepak.exchangeops.domain.Symbol;
import com.deepak.exchangeops.domain.Venue;
import com.deepak.exchangeops.domain.VenueStatus;
import com.deepak.exchangeops.support.AbstractIntegrationTest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

class ReferenceDataRepositoryIntegrationTest extends AbstractIntegrationTest {

  @Autowired private VenueRepository venueRepository;
  @Autowired private SymbolRepository symbolRepository;
  @Autowired private AlertRuleRepository alertRuleRepository;

  @Test
  void migrationsSeedTheExpectedSyntheticReferenceData() {
    assertThat(venueRepository.count()).isEqualTo(3);
    assertThat(symbolRepository.count()).isEqualTo(10);
    assertThat(alertRuleRepository.count()).isEqualTo(6);
  }

  @Test
  void venueCodeIsUnique() {
    assertThat(venueRepository.findByCode("NVLX")).isPresent();
    Venue duplicate = new Venue(UUID.randomUUID(), "NVLX", "Duplicate", VenueStatus.OPERATIONAL);

    assertThatThrownBy(() -> venueRepository.saveAndFlush(duplicate))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void symbolsCanBeFilteredByVenueAndActiveFlag() {
    Venue novalux = venueRepository.findByCode("NVLX").orElseThrow();

    assertThat(symbolRepository.findByVenueIdOrderByTickerAsc(novalux.getId()))
        .extracting(Symbol::getTicker)
        .containsExactly("ALPH", "BRVO", "CDRA", "DLTA");
    assertThat(symbolRepository.findByActiveOrderByTickerAsc(false))
        .extracting(Symbol::getTicker)
        .containsExactly("JUNO");
  }

  @Test
  void symbolRequiresAnExistingVenue() {
    Symbol orphan = new Symbol(UUID.randomUUID(), "ZZZZ", "Orphan", UUID.randomUUID(), true);

    assertThatThrownBy(() -> symbolRepository.saveAndFlush(orphan))
        .isInstanceOf(DataIntegrityViolationException.class);
  }
}
