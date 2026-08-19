package com.deepak.exchangeops.repository;

import com.deepak.exchangeops.domain.MarketEvent;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface MarketEventRepository
    extends JpaRepository<MarketEvent, UUID>, JpaSpecificationExecutor<MarketEvent> {

  @Query("select avg(e.processingLatencyMs) from MarketEvent e")
  Double averageProcessingLatencyMs();

  @Query("select coalesce(max(e.sequenceNumber), 0) from MarketEvent e")
  long maximumSequenceNumber();
}
