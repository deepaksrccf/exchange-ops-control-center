import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import { useEffect } from "react";

import { queryClient } from "../api/queryClient";
import { useRealtimeStore } from "../store/realtimeStore";
import type { Alert } from "../types/alerts";
import type { MetricsSummary } from "../types/api";
import type { MarketEvent } from "../types/events";

function websocketUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${window.location.host}/ws`;
}

function parseMessage<T>(message: IMessage): T {
  return JSON.parse(message.body) as T;
}

const { setConnectionState, recordEvent, recordAlert, recordMetrics } =
  useRealtimeStore.getState();

export function useRealtimeEvents() {
  const state = useRealtimeStore((current) => current.state);
  const latestEvent = useRealtimeStore((current) => current.latestEvent);
  const latestAlert = useRealtimeStore((current) => current.latestAlert);
  const latestMetrics = useRealtimeStore((current) => current.latestMetrics);
  const receivedEventCount = useRealtimeStore(
    (current) => current.receivedEventCount,
  );
  const receivedAlertCount = useRealtimeStore(
    (current) => current.receivedAlertCount,
  );
  const receivedMetricsCount = useRealtimeStore(
    (current) => current.receivedMetricsCount,
  );
  const lastMessageAt = useRealtimeStore((current) => current.lastMessageAt);
  const errorMessage = useRealtimeStore((current) => current.errorMessage);
  useEffect(() => {
    setConnectionState("CONNECTING");

    const subscriptions: StompSubscription[] = [];

    const client = new Client({
      webSocketFactory: () => new WebSocket(websocketUrl()),
      reconnectDelay: 5_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,

      debug: import.meta.env.DEV
        ? (message) => {
            console.debug("[STOMP]", message);
          }
        : () => {},
    });

    client.onConnect = () => {
      setConnectionState("CONNECTED");

      subscriptions.splice(0).forEach((subscription) => {
        try {
          subscription.unsubscribe();
        } catch {
          // Previous connection may already be closed.
        }
      });

      subscriptions.push(
        client.subscribe("/topic/events", (message: IMessage) => {
          try {
            const event = parseMessage<MarketEvent>(message);

            recordEvent(event);

            void Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["events"],
              }),
              queryClient.invalidateQueries({
                queryKey: ["analytics", "events"],
              }),
            ]);
          } catch {
            setConnectionState(
              "ERROR",
              "A real-time event could not be parsed.",
            );
          }
        }),
      );

      subscriptions.push(
        client.subscribe("/topic/alerts", (message: IMessage) => {
          try {
            const alert = parseMessage<Alert>(message);

            recordAlert(alert);

            void Promise.all([
              queryClient.invalidateQueries({
                queryKey: ["alerts"],
              }),
              queryClient.invalidateQueries({
                queryKey: ["analytics", "alerts"],
              }),
            ]);
          } catch {
            setConnectionState(
              "ERROR",
              "A real-time alert could not be parsed.",
            );
          }
        }),
      );

      subscriptions.push(
        client.subscribe("/topic/metrics", (message: IMessage) => {
          try {
            const metrics = parseMessage<MetricsSummary>(message);

            recordMetrics(metrics);

            queryClient.setQueryData<MetricsSummary>(
              ["metrics-summary"],
              metrics,
            );
          } catch {
            setConnectionState(
              "ERROR",
              "A real-time metrics update could not be parsed.",
            );
          }
        }),
      );
    };

    client.onWebSocketClose = () => {
      if (client.active) {
        setConnectionState("RECONNECTING");
      } else {
        setConnectionState("DISCONNECTED");
      }
    };

    client.onWebSocketError = () => {
      setConnectionState("ERROR", "The WebSocket connection failed.");
    };

    client.onStompError = (frame) => {
      setConnectionState(
        "ERROR",
        frame.headers.message ?? "The STOMP broker reported an error.",
      );
    };

    client.activate();

    return () => {
      subscriptions.forEach((subscription) => {
        try {
          subscription.unsubscribe();
        } catch {
          // The connection may already be closed.
        }
      });

      void client.deactivate();
      setConnectionState("DISCONNECTED");
    };
  }, []);

  return {
    state,
    latestEvent,
    latestAlert,
    latestMetrics,
    receivedEventCount,
    receivedAlertCount,
    receivedMetricsCount,
    lastMessageAt,
    errorMessage,
  };
}
