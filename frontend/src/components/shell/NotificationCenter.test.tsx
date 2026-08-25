import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { NotificationCenter } from "./NotificationCenter";
import { useRealtimeStore } from "../../store/realtimeStore";
import type { Alert } from "../../types/alerts";

function buildAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: "alert-1",
    ruleId: "rule-1",
    ruleName: "Volume Spike Detector",
    ruleType: "VOLUME_SPIKE",
    eventId: "event-1",
    venueId: "venue-1",
    venueCode: "ARCD",
    symbolId: "symbol-1",
    symbolTicker: "FRST",
    severity: "CRITICAL",
    status: "OPEN",
    title: "Volume Spike Detector triggered on FRST",
    explanation: "Synthetic detection.",
    assignedTo: undefined,
    incidentId: undefined,
    detectedAt: "2026-08-20T18:00:00Z",
    acknowledgedAt: undefined,
    resolvedAt: undefined,
    ...overrides,
  };
}

afterEach(() => {
  useRealtimeStore.getState().resetRealtimeState();
});

describe("NotificationCenter", () => {
  it("shows an unread count and no notifications message when empty", () => {
    render(
      <MemoryRouter>
        <NotificationCenter />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", {
        name: /live alert notifications \(0 unread\)/i,
      }),
    ).toBeInTheDocument();
  });

  it("lists received alerts, grouped, and supports dismiss all", async () => {
    const user = userEvent.setup();

    useRealtimeStore.getState().recordAlert(buildAlert());

    render(
      <MemoryRouter>
        <NotificationCenter />
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("button", { name: /live alert notifications/i }),
    );

    expect(
      screen.getByText("Volume Spike Detector triggered on FRST"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss all" }));

    expect(useRealtimeStore.getState().notifications).toHaveLength(0);
  });

  it("caps notifications at five", () => {
    for (let index = 0; index < 8; index += 1) {
      useRealtimeStore
        .getState()
        .recordAlert(buildAlert({ id: `alert-${index}` }));
    }

    expect(useRealtimeStore.getState().notifications).toHaveLength(5);
  });
});
