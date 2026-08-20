import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../client";
import {
  getGeneratorStatus,
  pauseGenerator,
  resumeGenerator,
  startGenerator,
  stopGenerator,
} from "./generatorApi";
import type { GeneratorStatus } from "../../types/generator";

vi.mock("../client");

const status: GeneratorStatus = {
  state: "STOPPED",
  generatedCount: 0,
  lastSequenceNumber: 0,
  intervalMs: 1000,
  eventsPerCycle: 1,
  syntheticDataOnly: true,
  timestamp: "2026-08-20T00:00:00Z",
};

describe("generatorApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["get", "/generator/status", () => getGeneratorStatus()],
    ["start", "/generator/start", () => startGenerator()],
    ["pause", "/generator/pause", () => pauseGenerator()],
    ["resume", "/generator/resume", () => resumeGenerator()],
    ["stop", "/generator/stop", () => stopGenerator()],
  ])("uses the relative path for %s", async (_, path, request) => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: status });
    vi.mocked(apiClient.post).mockResolvedValue({ data: status });

    await request();

    const clientMethod = path.endsWith("status")
      ? vi.mocked(apiClient.get)
      : vi.mocked(apiClient.post);
    expect(clientMethod).toHaveBeenCalledWith(path);
  });
});
