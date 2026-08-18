package com.deepak.exchangeops.mapper;

import com.deepak.exchangeops.domain.Venue;
import com.deepak.exchangeops.dto.VenueResponse;
import org.springframework.stereotype.Component;

@Component
public class VenueMapper {

  public VenueResponse toResponse(Venue venue) {
    return new VenueResponse(
        venue.getId(),
        venue.getCode(),
        venue.getName(),
        venue.getStatus(),
        venue.getCreatedAt(),
        venue.getUpdatedAt());
  }
}
