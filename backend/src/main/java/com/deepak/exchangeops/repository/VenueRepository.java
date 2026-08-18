package com.deepak.exchangeops.repository;

import com.deepak.exchangeops.domain.Venue;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VenueRepository extends JpaRepository<Venue, UUID> {

  java.util.Optional<Venue> findByCode(String code);
}
