import { create } from "zustand";

import type { MarketEvent } from "../types/events";
import type { RealtimeConnectionState, RealtimeState } from "../realtime/types";

interface RealtimeActions {
  setConnectionState: (connectionState: RealtimeConnectionState) => void;
  recordEvent: (event: MarketEvent) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: RealtimeState = {
  connectionState: "DISCONNECTED",
  receivedEventCount: 0,
  lastMessageAt: null,
  latestEvent: null,
  error: null,
};

export const useRealtimeStore = create<RealtimeState & RealtimeActions>(
  (set) => ({
    ...initialState,
    setConnectionState: (connectionState) => set({ connectionState }),
    recordEvent: (latestEvent) =>
      set((state) => ({
        latestEvent,
        receivedEventCount: state.receivedEventCount + 1,
        lastMessageAt: new Date().toISOString(),
        error: null,
      })),
    setError: (error) => set({ error, connectionState: "ERROR" }),
    reset: () => set(initialState),
  }),
);
