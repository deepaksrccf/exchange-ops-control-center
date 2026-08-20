import type { MarketEvent } from "../types/events";

export type RealtimeConnectionState =
  "CONNECTING" | "CONNECTED" | "RECONNECTING" | "DISCONNECTED" | "ERROR";

export interface RealtimeState {
  connectionState: RealtimeConnectionState;
  receivedEventCount: number;
  lastMessageAt: string | null;
  latestEvent: MarketEvent | null;
  error: string | null;
}
