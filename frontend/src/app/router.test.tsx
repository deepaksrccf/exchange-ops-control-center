import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouterProvider } from "react-router-dom";

import { router } from "./router";

vi.mock("../api/services/operationsApi", () => ({
  checkApiHealth: vi.fn().mockResolvedValue(true),

  getMetricsSummary: vi.fn().mockResolvedValue({
    activeAlerts: 18,
    unacknowledgedCriticalAlerts: 2,
    openIncidents: 4,
    eventsProcessed: 600,
    averageProcessingLatencyMs: 24.5,
  }),

  getVenues: vi.fn().mockResolvedValue([
    {
      id: "11111111-1111-1111-1111-111111111111",
      code: "XALP",
      name: "Alpha Exchange",
      status: "OPEN",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      code: "XBTA",
      name: "Beta Exchange",
      status: "OPEN",
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      code: "XGMA",
      name: "Gamma Exchange",
      status: "DEGRADED",
    },
  ]),

  getRecentAlerts: vi.fn().mockResolvedValue([
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      title: "Synthetic latency threshold exceeded",
      severity: "HIGH",
      status: "OPEN",
      detectedAt: "2026-08-18T18:00:00Z",
      assignedTo: null,
    },
  ]),

  getRecentIncidents: vi.fn().mockResolvedValue([
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      incidentNumber: "INC-0001",
      title: "Synthetic venue latency investigation",
      severity: "HIGH",
      status: "INVESTIGATING",
      owner: "Operations Team",
      createdAt: "2026-08-18T18:05:00Z",
    },
  ]),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("application router", () => {
  it("renders the operations overview with API data", async () => {
    window.history.pushState({}, "", "/");

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Operations Overview",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Synthetic latency threshold exceeded"),
    ).toBeInTheDocument();

    expect(screen.getByText("INC-0001")).toBeInTheDocument();
    expect(screen.getByText("Alpha Exchange")).toBeInTheDocument();

    queryClient.clear();
  });
});
