import { create } from "zustand";

import type { Alert } from "../types/alerts";
import type { MarketEvent } from "../types/events";
import type { RealtimeConnectionState } from "../realtime/types";

export interface LiveAlertNotification {
  notificationId: string;
  alert: Alert;
  receivedAt: string;
}

interface RealtimeStore {
  state: RealtimeConnectionState;
  latestEvent?: MarketEvent;
  latestAlert?: Alert;
  receivedEventCount: number;
  receivedAlertCount: number;
  lastMessageAt?: string;
  errorMessage?: string;
  notifications: LiveAlertNotification[];

  setConnectionState: (
    state: RealtimeConnectionState,
    errorMessage?: string,
  ) => void;

  recordEvent: (event: MarketEvent) => void;
  recordAlert: (alert: Alert) => void;
  dismissNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  resetRealtimeState: () => void;
}

const maximumNotifications = 5;

export const useRealtimeStore = create<RealtimeStore>()((set) => ({
  state: "DISCONNECTED",
  receivedEventCount: 0,
  receivedAlertCount: 0,
  notifications: [],

  setConnectionState: (state, errorMessage) =>
    set({
      state,
      errorMessage,
    }),

  recordEvent: (event) =>
    set((current) => ({
      latestEvent: event,
      receivedEventCount: current.receivedEventCount + 1,
      lastMessageAt: new Date().toISOString(),
      errorMessage: undefined,
    })),

  recordAlert: (alert) =>
    set((current) => {
      const receivedAt = new Date().toISOString();

      const notification: LiveAlertNotification = {
        notificationId: `${alert.id}-${receivedAt}`,
        alert,
        receivedAt,
      };

      return {
        latestAlert: alert,
        receivedAlertCount: current.receivedAlertCount + 1,
        lastMessageAt: receivedAt,
        errorMessage: undefined,
        notifications: [notification, ...current.notifications].slice(
          0,
          maximumNotifications,
        ),
      };
    }),

  dismissNotification: (notificationId) =>
    set((current) => ({
      notifications: current.notifications.filter(
        (notification) => notification.notificationId !== notificationId,
      ),
    })),

  clearNotifications: () =>
    set({
      notifications: [],
    }),

  resetRealtimeState: () =>
    set({
      state: "DISCONNECTED",
      latestEvent: undefined,
      latestAlert: undefined,
      receivedEventCount: 0,
      receivedAlertCount: 0,
      lastMessageAt: undefined,
      errorMessage: undefined,
      notifications: [],
    }),
}));
