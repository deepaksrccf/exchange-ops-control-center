package com.deepak.exchangeops.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Enables controlled background tasks for live synthetic metrics. */
@Configuration
@EnableScheduling
public class SchedulingConfig {}
