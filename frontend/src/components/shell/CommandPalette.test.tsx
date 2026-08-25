import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "./CommandPalette";
import * as generatorApi from "../../api/services/generatorApi";
import { createTestQueryClient } from "../../test/incidentFixtures";
import type { GeneratorStatus } from "../../types/generator";

vi.mock("../../api/services/generatorApi");

function renderPalette() {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const stoppedStatus: GeneratorStatus = {
  state: "STOPPED",
  generatedCount: 0,
  lastSequenceNumber: 0,
  intervalMs: 1000,
  eventsPerCycle: 1,
  syntheticDataOnly: true,
  timestamp: "2026-08-20T00:00:00Z",
};

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generatorApi.getGeneratorStatus).mockResolvedValue(stoppedStatus);
  });

  it("opens with Ctrl+K, filters commands, and closes with Escape", async () => {
    const user = userEvent.setup();
    renderPalette();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(
      await screen.findByRole("dialog", { name: "Command palette" }),
    ).toBeInTheDocument();

    await user.type(
      screen.getByRole("combobox", { name: "Command palette search" }),
      "events",
    );

    expect(
      screen.getByRole("option", { name: /Navigate to Events/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Navigate to Alerts/ }),
    ).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("only shows the start command while the generator is stopped", async () => {
    renderPalette();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    await screen.findByRole("dialog");

    expect(
      await screen.findByRole("option", { name: "Start generator" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Pause generator" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Stop generator" }),
    ).not.toBeInTheDocument();
  });
});
