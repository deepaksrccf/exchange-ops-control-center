import { QueryClient } from "@tanstack/react-query";

import type {
  Incident,
  IncidentEvent,
  IncidentNote,
  IncidentPage,
} from "../types/incidents";

/** Fresh, retry-disabled QueryClient for deterministic test isolation. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function buildIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: "incident-123",
    incidentNumber: "INC-001",
    alertId: "alert-456",
    title: "High latency on NASDAQ venue",
    description: "Detected abnormal latency spikes exceeding 5 seconds",
    severity: "SEV1",
    status: "OPEN",
    owner: "ops.deepak",
    resolutionSummary: undefined,
    createdAt: "2026-01-15T10:30:00Z",
    updatedAt: "2026-01-15T10:30:00Z",
    resolvedAt: undefined,
    ...overrides,
  };
}

export function buildIncidentPage(
  overrides: Partial<IncidentPage> = {},
): IncidentPage {
  return {
    content: [buildIncident()],
    page: 0,
    size: 25,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
    ...overrides,
  };
}

export function buildIncidentEvent(
  overrides: Partial<IncidentEvent> = {},
): IncidentEvent {
  return {
    id: "event-1",
    incidentId: "incident-123",
    eventType: "CREATED",
    actor: "ops.deepak",
    description: "Incident created",
    createdAt: "2026-01-15T10:30:00Z",
    ...overrides,
  };
}

export function buildIncidentNote(
  overrides: Partial<IncidentNote> = {},
): IncidentNote {
  return {
    id: "note-1",
    incidentId: "incident-123",
    author: "ops.deepak",
    content: "Investigation underway",
    createdAt: "2026-01-15T10:40:00Z",
    ...overrides,
  };
}
