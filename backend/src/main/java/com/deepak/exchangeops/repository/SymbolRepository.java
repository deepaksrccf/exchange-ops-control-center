package com.deepak.exchangeops.repository;

import com.deepak.exchangeops.domain.Symbol;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SymbolRepository extends JpaRepository<Symbol, UUID> {

  List<Symbol> findByVenueIdOrderByTickerAsc(UUID venueId);

  List<Symbol> findByActiveOrderByTickerAsc(boolean active);
}
