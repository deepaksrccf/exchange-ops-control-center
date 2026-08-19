package com.deepak.exchangeops.dto;

import com.deepak.exchangeops.generator.GeneratorState;
import java.time.Instant;

/** Runtime status of the synthetic event generator. */
public record GeneratorStatusResponse(
    GeneratorState state,
    long generatedCount,
    long lastSequenceNumber,
    long intervalMs,
    int eventsPerCycle,
    boolean syntheticDataOnly,
    Instant timestamp) {}
