package com.deepak.exchangeops.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class CorsPropertiesTest {

  @Test
  void acceptsAnExplicitAllowList() {
    CorsProperties properties =
        new CorsProperties(List.of("http://localhost:5173", "https://ops.example.test"));

    assertThat(properties.getAllowedOrigins())
        .containsExactly("http://localhost:5173", "https://ops.example.test");
  }

  @Test
  void rejectsAWildcardOrigin() {
    assertThatThrownBy(() -> new CorsProperties(List.of("*")))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("Wildcard CORS origins are not permitted");
  }

  @Test
  void rejectsAWildcardSubdomainPattern() {
    assertThatThrownBy(
            () -> new CorsProperties(List.of("http://localhost:5173", "https://*.example.test")))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("https://*.example.test");
  }

  @Test
  void allowedOriginsAreImmutable() {
    CorsProperties properties = new CorsProperties(List.of("http://localhost:5173"));

    assertThatThrownBy(() -> properties.getAllowedOrigins().add("https://elsewhere.example.test"))
        .isInstanceOf(UnsupportedOperationException.class);
  }
}
