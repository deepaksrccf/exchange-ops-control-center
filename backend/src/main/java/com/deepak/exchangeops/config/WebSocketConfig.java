package com.deepak.exchangeops.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP WebSocket configuration for synthetic operational updates.
 *
 * <p>The simple broker is suitable for this single-instance portfolio application. A production
 * multi-instance deployment would require an external message broker or broker relay.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  private final String[] allowedOrigins;

  public WebSocketConfig(
      @Value(
              "${app.websocket.allowed-origins:"
                  + "http://localhost:3000,"
                  + "http://localhost:5173}")
          String allowedOrigins) {

    this.allowedOrigins = allowedOrigins.split(",");
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {

    registry.enableSimpleBroker("/topic");
    registry.setApplicationDestinationPrefixes("/app");
  }

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {

    registry.addEndpoint("/ws").setAllowedOrigins(allowedOrigins);
  }
}
