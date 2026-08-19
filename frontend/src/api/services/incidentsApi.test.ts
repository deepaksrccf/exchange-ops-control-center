import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  getIncidents,
  getIncident,
  updateIncident,
  getIncidentNotes,
  getIncidentTimeline,
  createIncidentNote,
} from "./incidentsApi";
import { apiClient } from "../client";
import type {
  Incident,
  IncidentPage,
  IncidentEvent,
  IncidentNote,
} from "../../types/incidents";

// Mock the API client
vi.mock("../client");

const mockIncident: Incident = {
  id: "incident-1",
  incidentNumber: "INC-001",
  title: "Test incident",
  description: "Test description",
  severity: "SEV1",
  status: "OPEN",
  owner: undefined,
  createdAt: "2026-01-15T10:30:00Z",
  updatedAt: "2026-01-15T10:30:00Z",
};

const mockPage: IncidentPage = {
  content: [mockIncident],
  page: 0,
  size: 25,
  totalElements: 1,
  totalPages: 1,
  first: true,
  last: true,
};

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

describe("incidentsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getIncidents", () => {
    it("should fetch paginated incidents with parameters", async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockPage });
      vi.mocked(apiClient).get = mockGet;

      const result = await getIncidents({
        page: 0,
        size: 25,
        sort: "createdAt,desc",
        status: "OPEN",
      });

      expect(mockGet).toHaveBeenCalledWith("/incidents", {
        params: {
          page: 0,
          size: 25,
          sort: "createdAt,desc",
          status: "OPEN",
        },
      });

      expect(result).toEqual(mockPage);
    });

    it("should handle pagination", async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockPage });
      vi.mocked(apiClient).get = mockGet;

      await getIncidents({
        page: 1,
        size: 50,
        sort: "createdAt,asc",
      });

      expect(mockGet).toHaveBeenCalledWith(
        "/incidents",
        expect.objectContaining({
          params: expect.objectContaining({
            page: 1,
            size: 50,
          }),
        }),
      );
    });

    it("should omit undefined filters", async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockPage });
      vi.mocked(apiClient).get = mockGet;

      await getIncidents({
        page: 0,
        size: 25,
        sort: "createdAt,desc",
        status: undefined,
        severity: undefined,
      });

      const callParams = mockGet.mock.calls[0][1].params;
      expect(callParams.status).toBeUndefined();
      expect(callParams.severity).toBeUndefined();
    });
  });

  describe("getIncident", () => {
    it("should fetch single incident by ID", async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockIncident });
      vi.mocked(apiClient).get = mockGet;

      const result = await getIncident("incident-1");

      expect(mockGet).toHaveBeenCalledWith("/incidents/incident-1");
      expect(result).toEqual(mockIncident);
    });

    it("should construct correct URL with ID", async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockIncident });
      vi.mocked(apiClient).get = mockGet;

      await getIncident("abc-123-def");

      expect(mockGet).toHaveBeenCalledWith("/incidents/abc-123-def");
    });
  });

  describe("updateIncident", () => {
    it("should send PATCH request with update payload", async () => {
      const mockPatch = vi.fn().mockResolvedValue({ data: mockIncident });
      vi.mocked(apiClient).patch = mockPatch;

      const updateRequest = {
        status: "INVESTIGATING" as const,
        actor: "ops.deepak",
      };

      const result = await updateIncident("incident-1", updateRequest);

      expect(mockPatch).toHaveBeenCalledWith(
        "/incidents/incident-1",
        updateRequest,
      );

      expect(result).toEqual(mockIncident);
    });

    it("should handle partial updates", async () => {
      const mockPatch = vi.fn().mockResolvedValue({ data: mockIncident });
      vi.mocked(apiClient).patch = mockPatch;

      const updateRequest = {
        owner: "ops.alice",
        actor: "ops.deepak",
      };

      await updateIncident("incident-1", updateRequest);

      expect(mockPatch).toHaveBeenCalledWith(
        "/incidents/incident-1",
        updateRequest,
      );
    });

    it("should omit undefined fields in update request", async () => {
      const mockPatch = vi.fn().mockResolvedValue({ data: mockIncident });
      vi.mocked(apiClient).patch = mockPatch;

      const updateRequest = {
        actor: "ops.deepak",
        status: undefined,
      };

      await updateIncident("incident-1", updateRequest);

      expect(mockPatch).toHaveBeenCalledWith(
        "/incidents/incident-1",
        updateRequest,
      );
    });
  });

  describe("getIncidentNotes", () => {
    it("should fetch notes for an incident", async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: [mockNote] });
      vi.mocked(apiClient).get = mockGet;

      const result = await getIncidentNotes("incident-1");

      expect(mockGet).toHaveBeenCalledWith("/incidents/incident-1/notes");
      expect(result).toEqual([mockNote]);
    });

    it("should handle an incident with no notes", async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: [] });
      vi.mocked(apiClient).get = mockGet;

      const result = await getIncidentNotes("incident-1");

      expect(result).toEqual([]);
    });
  });

  describe("getIncidentTimeline", () => {
    it("should fetch immutable timeline events", async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockTimeline });
      vi.mocked(apiClient).get = mockGet;

      const result = await getIncidentTimeline("incident-1");

      expect(mockGet).toHaveBeenCalledWith("/incidents/incident-1/timeline");
      expect(result).toEqual(mockTimeline);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle empty timeline", async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: [] });
      vi.mocked(apiClient).get = mockGet;

      const result = await getIncidentTimeline("incident-1");

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it("should return events in order received from API", async () => {
      const events: IncidentEvent[] = [
        {
          id: "event-2",
          incidentId: "incident-1",
          eventType: "STATUS_CHANGED",
          actor: "ops.deepak",
          description: "OPEN -> INVESTIGATING",
          createdAt: "2026-01-15T10:35:00Z",
        },
        {
          id: "event-1",
          incidentId: "incident-1",
          eventType: "CREATED",
          actor: "ops.deepak",
          description: "Incident created",
          createdAt: "2026-01-15T10:30:00Z",
        },
      ];

      const mockGet = vi.fn().mockResolvedValue({ data: events });
      vi.mocked(apiClient).get = mockGet;

      const result = await getIncidentTimeline("incident-1");

      expect(result).toEqual(events);
    });
  });

  describe("createIncidentNote", () => {
    it("should create note with POST request", async () => {
      const mockPost = vi.fn().mockResolvedValue({ data: mockNote });
      vi.mocked(apiClient).post = mockPost;

      const createRequest = {
        author: "ops.deepak",
        content: "Test note",
      };

      const result = await createIncidentNote("incident-1", createRequest);

      expect(mockPost).toHaveBeenCalledWith(
        "/incidents/incident-1/notes",
        createRequest,
      );

      expect(result).toEqual(mockNote);
    });

    it("should return created note response", async () => {
      const newNote: IncidentNote = {
        id: "note-new",
        incidentId: "incident-1",
        author: "ops.alice",
        content: "Investigation update",
        createdAt: "2026-01-15T11:00:00Z",
      };

      const mockPost = vi.fn().mockResolvedValue({ data: newNote });
      vi.mocked(apiClient).post = mockPost;

      const result = await createIncidentNote("incident-1", {
        author: "ops.alice",
        content: "Investigation update",
      });

      expect(result).toEqual(newNote);
      expect(result.id).toBe("note-new");
      expect(result.createdAt).toBe("2026-01-15T11:00:00Z");
    });

    it("should handle note content with special characters", async () => {
      const mockPost = vi.fn().mockResolvedValue({ data: mockNote });
      vi.mocked(apiClient).post = mockPost;

      const createRequest = {
        author: "ops.deepak",
        content: 'Issue: "High latency" on {NASDAQ} - 50% traffic affected',
      };

      await createIncidentNote("incident-1", createRequest);

      expect(mockPost).toHaveBeenCalledWith(
        "/incidents/incident-1/notes",
        createRequest,
      );
    });
  });
});
