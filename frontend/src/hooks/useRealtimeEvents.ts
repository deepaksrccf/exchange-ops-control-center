import { Client, type IMessage } from "@stomp/stompjs";
import { useEffect, useRef } from "react";

import { queryClient } from "../api/queryClient";
import type { MarketEvent } from "../types/events";
import { useRealtimeStore } from "../store/realtimeStore";

function getBrokerUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

function isMarketEvent(value: unknown): value is MarketEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const event = value as Record<string, unknown>;
  return (
    typeof event.id === "string" &&
    typeof event.venueId === "string" &&
    typeof event.venueCode === "string" &&
    typeof event.symbolId === "string" &&
    typeof event.symbolTicker === "string" &&
    typeof event.sequenceNumber === "number" &&
    typeof event.eventType === "string" &&
    typeof event.price === "number" &&
    typeof event.quantity === "number" &&
    typeof event.eventTimestamp === "string" &&
    typeof event.receivedTimestamp === "string" &&
    typeof event.processingLatencyMs === "number" &&
    typeof event.source === "string" &&
    typeof event.metadata === "object" &&
    event.metadata !== null
  );
}

function handleMessage(message: IMessage) {
  let payload: unknown;

  try {
    payload = JSON.parse(message.body) as unknown;
  } catch {
    useRealtimeStore.getState().setError("Live event payload was invalid.");
    return;
  }

  if (!isMarketEvent(payload)) {
    useRealtimeStore.getState().setError("Live event payload was invalid.");
    return;
  }

  useRealtimeStore.getState().recordEvent(payload);
  void Promise.all([
    queryClient.invalidateQueries({ queryKey: ["events"] }),
    queryClient.invalidateQueries({ queryKey: ["metrics-summary"] }),
    queryClient.invalidateQueries({ queryKey: ["analytics", "events"] }),
  ]);
}

export function useRealtimeEvents() {
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const store = useRealtimeStore.getState();
    store.setConnectionState("CONNECTING");

    const client = new Client({
      brokerURL: getBrokerUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: import.meta.env.DEV
        ? (message) => console.debug(message)
        : () => {},
      onConnect: () => {
        useRealtimeStore.getState().setConnectionState("CONNECTED");
        client.subscribe("/topic/events", handleMessage);
      },
      onDisconnect: () => {
        useRealtimeStore.getState().setConnectionState("DISCONNECTED");
      },
      onWebSocketClose: () => {
        useRealtimeStore.getState().setConnectionState("RECONNECTING");
      },
      onStompError: () => {
        useRealtimeStore.getState().setError("Live connection error.");
      },
      onWebSocketError: () => {
        useRealtimeStore.getState().setError("Live connection error.");
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      clientRef.current = null;
      void client.deactivate();
    };
  }, []);
}
