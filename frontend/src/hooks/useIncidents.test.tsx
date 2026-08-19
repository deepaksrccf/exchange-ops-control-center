import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  useIncidentsQuery,
  useIncidentQuery,
  useIncidentNotesQuery,
  useIncidentTimelineQuery,
  useUpdateIncident,
  useCreateIncidentNote,
} from "../hooks/useIncidents";
import * as incidentsApi from "../api/services/incidentsApi";
import {
  buildIncident,
  buildIncidentEvent,
  buildIncidentNote,
  buildIncidentPage,
  createTestQueryClient,
} from "../test/incidentFixtures";

// Mock the API service
vi.mock("../api/services/incidentsApi");

const mockIncident = buildIncident({ id: "incident-1" });
const mockPage = buildIncidentPage({ content: [mockIncident] });
const mockTimeline = [buildIncidentEvent({ incidentId: "incident-1" })];
const mockNote = buildIncidentNote({ incidentId: "incident-1" });

function renderWithClient<T>(callback: () => T) {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { ...renderHook(callback, { wrapper }), queryClient };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useIncidentsQuery", () => {
  it("should fetch paginated incidents", async () => {
    vi.mocked(incidentsApi.getIncidents).mockResolvedValue(mockPage);

    const { result } = renderWithClient(() =>
      useIncidentsQuery({ page: 0, size: 25, sort: "createdAt,desc" }),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPage);
    expect(result.current.data?.content.length).toBe(1);
  });

  it("should apply filters", async () => {
    vi.mocked(incidentsApi.getIncidents).mockResolvedValue(mockPage);

    renderWithClient(() =>
      useIncidentsQuery({
        page: 0,
        size: 25,
        sort: "createdAt,desc",
        status: "OPEN",
        severity: "SEV1",
        owner: "ops.deepak",
      }),
    );

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.getIncidents)).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "OPEN",
          severity: "SEV1",
          owner: "ops.deepak",
        }),
      );
    });
  });

  it("should handle API errors", async () => {
    const error = new Error("API error");
    vi.mocked(incidentsApi.getIncidents).mockRejectedValue(error);

    const { result } = renderWithClient(() =>
      useIncidentsQuery({ page: 0, size: 25, sort: "createdAt,desc" }),
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });

  it("should maintain previous data during pagination", async () => {
    vi.mocked(incidentsApi.getIncidents).mockResolvedValue(mockPage);

    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result, rerender } = renderHook(
      ({ page }: { page: number }) =>
        useIncidentsQuery({ page, size: 25, sort: "createdAt,desc" }),
      { wrapper, initialProps: { page: 0 } },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    rerender({ page: 1 });

    // Old data should still be available while new data loads
    expect(result.current.data).toBeDefined();
  });
});

describe("useIncidentQuery", () => {
  it("should fetch single incident", async () => {
    vi.mocked(incidentsApi.getIncident).mockResolvedValue(mockIncident);

    const { result } = renderWithClient(() => useIncidentQuery("incident-1"));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockIncident);
  });

  it("should not fetch when id is undefined", () => {
    vi.mocked(incidentsApi.getIncident).mockResolvedValue(mockIncident);

    const { result } = renderWithClient(() => useIncidentQuery(undefined));

    expect(result.current.fetchStatus).toBe("idle");
    expect(vi.mocked(incidentsApi.getIncident)).not.toHaveBeenCalled();
  });

  it("should fetch when id changes from undefined to defined", async () => {
    vi.mocked(incidentsApi.getIncident).mockResolvedValue(mockIncident);

    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    type Props = { id: string | undefined };
    const { result, rerender } = renderHook(
      ({ id }: Props) => useIncidentQuery(id),
      { wrapper, initialProps: { id: undefined } as Props },
    );

    expect(result.current.fetchStatus).toBe("idle");

    rerender({ id: "incident-1" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockIncident);
  });

  it("should handle API errors", async () => {
    const error = new Error("Not found");
    vi.mocked(incidentsApi.getIncident).mockRejectedValue(error);

    const { result } = renderWithClient(() => useIncidentQuery("incident-1"));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});

describe("useIncidentNotesQuery", () => {
  it("should fetch incident notes", async () => {
    vi.mocked(incidentsApi.getIncidentNotes).mockResolvedValue([mockNote]);

    const { result } = renderWithClient(() =>
      useIncidentNotesQuery("incident-1"),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([mockNote]);
  });

  it("should not fetch when id is undefined", () => {
    vi.mocked(incidentsApi.getIncidentNotes).mockResolvedValue([mockNote]);

    const { result } = renderWithClient(() => useIncidentNotesQuery(undefined));

    expect(result.current.fetchStatus).toBe("idle");
    expect(vi.mocked(incidentsApi.getIncidentNotes)).not.toHaveBeenCalled();
  });
});

describe("useIncidentTimelineQuery", () => {
  it("should fetch incident timeline", async () => {
    vi.mocked(incidentsApi.getIncidentTimeline).mockResolvedValue(mockTimeline);

    const { result } = renderWithClient(() =>
      useIncidentTimelineQuery("incident-1"),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTimeline);
  });

  it("should not fetch when id is undefined", () => {
    vi.mocked(incidentsApi.getIncidentTimeline).mockResolvedValue(mockTimeline);

    const { result } = renderWithClient(() =>
      useIncidentTimelineQuery(undefined),
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(vi.mocked(incidentsApi.getIncidentTimeline)).not.toHaveBeenCalled();
  });
});

describe("useUpdateIncident", () => {
  it("should update incident", async () => {
    const updatedIncident = buildIncident({ status: "INVESTIGATING" });
    vi.mocked(incidentsApi.updateIncident).mockResolvedValue(updatedIncident);

    const { result } = renderWithClient(() => useUpdateIncident());

    result.current.mutate({
      id: "incident-1",
      request: { status: "INVESTIGATING", actor: "ops.deepak" },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(vi.mocked(incidentsApi.updateIncident)).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        status: "INVESTIGATING",
        actor: "ops.deepak",
      }),
    );
  });

  it("should invalidate related queries on success", async () => {
    vi.mocked(incidentsApi.updateIncident).mockResolvedValue(mockIncident);

    const { result, queryClient } = renderWithClient(() => useUpdateIncident());
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    result.current.mutate({
      id: "incident-1",
      request: { status: "INVESTIGATING", actor: "ops.deepak" },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["incidents"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["incident", "incident-1"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["incident-timeline", "incident-1"],
      }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["alerts"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["metrics-summary"] }),
    );
  });

  it("should handle API errors", async () => {
    const error = new Error("Update failed");
    vi.mocked(incidentsApi.updateIncident).mockRejectedValue(error);

    const { result } = renderWithClient(() => useUpdateIncident());

    result.current.mutate({
      id: "incident-1",
      request: { status: "INVESTIGATING", actor: "ops.deepak" },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});

describe("useCreateIncidentNote", () => {
  it("should create incident note", async () => {
    vi.mocked(incidentsApi.createIncidentNote).mockResolvedValue(mockNote);

    const { result } = renderWithClient(() => useCreateIncidentNote());

    result.current.mutate({
      id: "incident-1",
      request: { author: "ops.deepak", content: "Test note" },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(vi.mocked(incidentsApi.createIncidentNote)).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({ author: "ops.deepak", content: "Test note" }),
    );
  });

  it("should invalidate related queries on success", async () => {
    vi.mocked(incidentsApi.createIncidentNote).mockResolvedValue(mockNote);

    const { result, queryClient } = renderWithClient(() =>
      useCreateIncidentNote(),
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    result.current.mutate({
      id: "incident-1",
      request: { author: "ops.deepak", content: "Test note" },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["incident", "incident-1"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["incident-notes", "incident-1"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["incident-timeline", "incident-1"],
      }),
    );
  });

  it("should handle API errors", async () => {
    const error = new Error("Note creation failed");
    vi.mocked(incidentsApi.createIncidentNote).mockRejectedValue(error);

    const { result } = renderWithClient(() => useCreateIncidentNote());

    result.current.mutate({
      id: "incident-1",
      request: { author: "ops.deepak", content: "Test note" },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
