import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SystemHealthControl } from "./SystemHealthControl";
import * as generatorApi from "../../api/services/generatorApi";
import * as operationsApi from "../../api/services/operationsApi";
import { useRealtimeStore } from "../../store/realtimeStore";
import { createTestQueryClient } from "../../test/incidentFixtures";
import type { GeneratorStatus } from "../../types/generator";

vi.mock("../../api/services/generatorApi");
vi.mock("../../api/services/operationsApi");

const runningStatus: GeneratorStatus = {
  state: "RUNNING",
  generatedCount: 42,
  lastSequenceNumber: 42,
  intervalMs: 1000,
  eventsPerCycle: 1,
  syntheticDataOnly: true,
  timestamp: "2026-08-20T00:00:00Z",
};

function renderControl() {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <SystemHealthControl />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  useRealtimeStore.getState().resetRealtimeState();
});

describe("SystemHealthControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(operationsApi.checkApiHealth).mockResolvedValue(true);
    vi.mocked(generatorApi.getGeneratorStatus).mockResolvedValue(runningStatus);
  });

  it("opens a popover combining API, realtime, and generator status", async () => {
    const user = userEvent.setup();
    useRealtimeStore.getState().setConnectionState("CONNECTED");
    useRealtimeStore.getState().recordEvent({
      id: "event-1",
      venueId: "venue-1",
      venueCode: "ARCD",
      symbolId: "symbol-1",
      symbolTicker: "FRST",
      sequenceNumber: 1,
      eventType: "TRADE",
      price: 10,
      quantity: 5,
      eventTimestamp: "2026-08-20T18:00:00Z",
      receivedTimestamp: "2026-08-20T18:00:01Z",
      processingLatencyMs: 12,
      source: "synthetic",
      metadata: {},
    });

    renderControl();

    await user.click(await screen.findByText("All systems normal"));

    const popover = await screen.findByRole("dialog", {
      name: "System health details",
    });

    expect(popover).toBeInTheDocument();
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("RUNNING")).toBeInTheDocument();
  });
});
