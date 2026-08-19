import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { queryClient } from "../api/queryClient";
import {
  useIncidentsQuery,
  useIncidentQuery,
  useIncidentTimelineQuery,
  useUpdateIncident,
  useCreateIncidentNote,
} from "../hooks/useIncidents";
import * as incidentsApi from "../api/services/incidentsApi";
import type {
  Incident,
  IncidentPage,
  IncidentEvent,
  IncidentNote,
} from "../types/incidents";

// Mock the API service
vi.mock("../api/services/incidentsApi");

const mockIncidents: Incident[] = [
  {
    id: "incident-1",
    incidentNumber: "INC-001",
    title: "Test incident",
    description: "Test description",
    severity: "SEV1",
    status: "OPEN",
    owner: undefined,
    createdAt: "2026-01-15T10:30:00Z",
    updatedAt: "2026-01-15T10:30:00Z",
  },
];

const mockPage: IncidentPage = {
  content: mockIncidents,
  page: 0,
  size: 25,
  totalElements: 1,
  totalPages: 1,
  first: true,
  last: true,
};

const mockIncident: Incident = mockIncidents[0];

const mockTimeline: IncidentEvent[] = [
  {
    id: "event-1",
    incidentId: "incident-1",
    eventType: "CREATED",
    actor: "ops.deepak",
    description: "Incident created",
    createdAt: "2026-01-15T10:30:00Z",
  },
];

const mockNote: IncidentNote = {
  id: "note-1",
  incidentId: "incident-1",
  author: "ops.deepak",
  content: "Test note",
  createdAt: "2026-01-15T10:35:00Z",
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useIncidentsQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("should fetch paginated incidents", async () => {
    vi.mocked(incidentsApi.getIncidents).mockResolvedValue(mockPage);

    const { result } = renderHook(
      () =>
        useIncidentsQuery({
          page: 0,
          size: 25,
          sort: "createdAt,desc",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPage);
    expect(result.current.data?.content.length).toBe(1);
  });

  it("should apply filters", async () => {
    vi.mocked(incidentsApi.getIncidents).mockResolvedValue(mockPage);

    renderHook(
      () =>
        useIncidentsQuery({
          page: 0,
          size: 25,
          sort: "createdAt,desc",
          status: "OPEN",
          severity: "SEV1",
          owner: "ops.deepak",
        }),
      { wrapper },
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

    const { result } = renderHook(
      () =>
        useIncidentsQuery({
          page: 0,
          size: 25,
          sort: "createdAt,desc",
        }),
      { wrapper },
    );

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 3000 },
    );

    expect(result.current.error).toBe(error);
  });

  it("should maintain previous data during pagination", async () => {
    vi.mocked(incidentsApi.getIncidents).mockResolvedValue(mockPage);

    const { result, rerender } = renderHook(
      ({ page }) =>
        useIncidentsQuery({
          page,
          size: 25,
          sort: "createdAt,desc",
        }),
      {
        wrapper,
        initialProps: { page: 0 },
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Change page
    rerender({ page: 1 });

    // Old data should still be available while new data loads
    expect(result.current.data).toBeDefined();
  });
});

describe("useIncidentQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("should fetch single incident", async () => {
    vi.mocked(incidentsApi.getIncident).mockResolvedValue(mockIncident);

    const { result } = renderHook(() => useIncidentQuery("incident-1"), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockIncident);
  });

  it("should not fetch when id is undefined", () => {
    vi.mocked(incidentsApi.getIncident).mockResolvedValue(mockIncident);

    const { result } = renderHook(() => useIncidentQuery(undefined), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(vi.mocked(incidentsApi.getIncident)).not.toHaveBeenCalled();
  });

  it("should fetch when id changes from undefined to defined", async () => {
    vi.mocked(incidentsApi.getIncident).mockResolvedValue(mockIncident);

    type RenderHookProps = { id: string | undefined };
    const { result, rerender } = renderHook(
      ({ id }: RenderHookProps) => useIncidentQuery(id),
      {
        wrapper,
        initialProps: { id: undefined } as RenderHookProps,
      },
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

    const { result } = renderHook(() => useIncidentQuery("incident-1"), {
      wrapper,
    });

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true);
      },
      { timeout: 3000 },
    );

    expect(result.current.error).toBe(error);
  });
});

describe("useIncidentTimelineQuery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("should fetch incident timeline", async () => {
    vi.mocked(incidentsApi.getIncidentTimeline).mockResolvedValue(mockTimeline);

    const { result } = renderHook(
      () => useIncidentTimelineQuery("incident-1"),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTimeline);
  });

  it("should not fetch when id is undefined", () => {
    vi.mocked(incidentsApi.getIncidentTimeline).mockResolvedValue(mockTimeline);

    const { result } = renderHook(() => useIncidentTimelineQuery(undefined), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(vi.mocked(incidentsApi.getIncidentTimeline)).not.toHaveBeenCalled();
  });
});

describe("useUpdateIncident", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("should update incident", async () => {
    const updatedIncident = {
      ...mockIncident,
      status: "INVESTIGATING" as const,
    };
    vi.mocked(incidentsApi.updateIncident).mockResolvedValue(updatedIncident);

    const { result } = renderHook(() => useUpdateIncident(), { wrapper });

    result.current.mutate({
      id: "incident-1",
      request: {
        status: "INVESTIGATING",
        actor: "ops.deepak",
      },
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
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateIncident(), { wrapper });

    result.current.mutate({
      id: "incident-1",
      request: {
        status: "INVESTIGATING",
        actor: "ops.deepak",
      },
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
  });

  it("should handle API errors", async () => {
    const error = new Error("Update failed");
    vi.mocked(incidentsApi.updateIncident).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateIncident(), { wrapper });

    result.current.mutate({
      id: "incident-1",
      request: {
        status: "INVESTIGATING",
        actor: "ops.deepak",
      },
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});

describe("useCreateIncidentNote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("should create incident note", async () => {
    vi.mocked(incidentsApi.createIncidentNote).mockResolvedValue(mockNote);

    const { result } = renderHook(() => useCreateIncidentNote(), { wrapper });

    result.current.mutate({
      incidentId: "incident-1",
      request: {
        author: "ops.deepak",
        content: "Test note",
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(vi.mocked(incidentsApi.createIncidentNote)).toHaveBeenCalledWith(
      "incident-1",
      expect.objectContaining({
        author: "ops.deepak",
        content: "Test note",
      }),
    );
  });

  it("should invalidate related queries on success", async () => {
    vi.mocked(incidentsApi.createIncidentNote).mockResolvedValue(mockNote);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateIncidentNote(), { wrapper });

    result.current.mutate({
      incidentId: "incident-1",
      request: {
        author: "ops.deepak",
        content: "Test note",
      },
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["incident", "incident-1"] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["incident-timeline", "incident-1"],
      }),
    );
  });
});
