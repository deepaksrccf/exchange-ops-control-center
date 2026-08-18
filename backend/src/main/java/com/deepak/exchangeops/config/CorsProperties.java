package com.deepak.exchangeops.config;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * CORS configuration. Origins are an explicit allow-list; wildcard values are rejected so a
 * misconfigured deployment fails fast instead of silently opening the API to any origin.
 */
@Validated
@ConfigurationProperties(prefix = "app.cors")
public class CorsProperties {

  @NotEmpty private final List<String> allowedOrigins;

  public CorsProperties(List<String> allowedOrigins) {
    List<String> origins = allowedOrigins == null ? List.of() : allowedOrigins;
    origins.stream()
        .filter(origin -> origin.contains("*"))
        .findFirst()
        .ifPresent(
            origin -> {
              throw new IllegalStateException(
                  "Wildcard CORS origins are not permitted: '" + origin + "'");
            });
    this.allowedOrigins = List.copyOf(origins);
  }

  public List<String> getAllowedOrigins() {
    return allowedOrigins;
  }
}
