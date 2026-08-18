package com.deepak.exchangeops.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Shared PostgreSQL container for integration tests. A single reusable static container keeps the
 * suite fast while still exercising real Flyway migrations and PostgreSQL-specific types.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

  private static final PostgreSQLContainer<?> POSTGRES =
      new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
          .withDatabaseName("exchangeops_test")
          .withUsername("exchangeops_test")
          .withPassword("exchangeops_test");

  static {
    POSTGRES.start();
  }

  @Bean
  @ServiceConnection
  PostgreSQLContainer<?> postgresContainer() {
    return POSTGRES;
  }
}
