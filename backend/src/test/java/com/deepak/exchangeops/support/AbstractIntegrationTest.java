package com.deepak.exchangeops.support;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * Base class for tests that need a real PostgreSQL instance with migrations applied. Each test runs
 * in a transaction that is rolled back, so the seeded dataset stays deterministic.
 */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
@Transactional
public abstract class AbstractIntegrationTest {}
