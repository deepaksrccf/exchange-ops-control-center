package com.deepak.exchangeops.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** OpenAPI document metadata. */
@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI exchangeOpsOpenApi() {
    return new OpenAPI()
        .info(
            new Info()
                .title("Exchange Operations Control Center API")
                .version("v1")
                .description(
                    """
                    Read and workflow endpoints for a fictional exchange operations console.
                    All venues, symbols, events, alerts and incidents are synthetic. This API \
                    does not expose licensed market data and does not reproduce any real \
                    exchange system.""")
                .license(new License().name("MIT")));
  }
}
