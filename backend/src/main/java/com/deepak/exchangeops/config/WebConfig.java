package com.deepak.exchangeops.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Registers the explicit CORS allow-list for the browser client. */
@Configuration
@EnableConfigurationProperties(CorsProperties.class)
public class WebConfig implements WebMvcConfigurer {

  private final CorsProperties corsProperties;

  public WebConfig(CorsProperties corsProperties) {
    this.corsProperties = corsProperties;
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOrigins(corsProperties.getAllowedOrigins().toArray(String[]::new))
        .allowedMethods("GET", "POST", "PATCH", "OPTIONS")
        .allowedHeaders("Content-Type", "Accept")
        .maxAge(3600);
  }
}
