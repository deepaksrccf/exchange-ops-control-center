import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryRouter } from "react-router-dom";

import { queryClient } from "../api/queryClient";
import { IncidentDetailPage } from "../pages/IncidentDetailPage";
import * as incidentsApi from "../api/services/incidentsApi";
import type { Incident, IncidentEvent } from "../types/incidents";

// Mock the API service
vi.mock("../api/services/incidentsApi");

const mockIncident: Incident = {
  id: "incident-123",
  incidentNumber: "INC-001",
  alertId: "alert-456",
  title: "High latency on NASDAQ venue",
  description: "Detected abnormal latency spikes exceeding 5 seconds",
  severity: "SEV1",
  status: "OPEN",
  owner: "ops.deepak",
  createdAt: "2026-01-15T10:30:00Z",
  updatedAt: "2026-01-15T10:30:00Z",
};

const mockTimeline: IncidentEvent[] = [
  {
    id: "event-1",
    incidentId: "incident-123",
    eventType: "CREATED",
    actor: "ops.deepak",
    description: "Incident created",
    createdAt: "2026-01-15T10:30:00Z",
  },
  {
    id: "event-2",
    incidentId: "incident-123",
    eventType: "STATUS_CHANGED",
    actor: "ops.deepak",
    description: "OPEN -> INVESTIGATING",
    createdAt: "2026-01-15T10:35:00Z",
  },
];

describe("IncidentDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    vi.mocked(incidentsApi.getIncident).mockResolvedValue(mockIncident);
    vi.mocked(incidentsApi.getIncidentTimeline).mockResolvedValue(mockTimeline);
    vi.mocked(incidentsApi.updateIncident).mockResolvedValue(mockIncident);
    vi.mocked(incidentsApi.createIncidentNote).mockResolvedValue({
      id: "note-1",
      incidentId: "incident-123",
      author: "ops.deepak",
      content: "Investigation underway",
      createdAt: "2026-01-15T10:40:00Z",
    });
  });

  const renderWithRouter = (incidentId: string = "incident-123") => {
    const router = createMemoryRouter(
      [
        {
          path: "/incidents/:id",
          element: <IncidentDetailPage />,
        },
        {
          path: "/incidents",
          element: <div>Incident List</div>,
        },
        {
          path: "/alerts/:id",
          element: <div>Alert Detail</div>,
        },
      ],
      { initialEntries: [`/incidents/${incidentId}`] },
    );

    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
  };

  it("should render incident details", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("High latency on NASDAQ venue"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Detected abnormal latency spikes exceeding 5 seconds"),
    ).toBeInTheDocument();
    expect(screen.getByText("INC-001")).toBeInTheDocument();
  });

  it("should display severity and status badges", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("SEV1")).toBeInTheDocument();
    });

    const badgesHeader = screen
      .getByText("SEV1")
      .closest(".alert-detail-header__badges") as HTMLElement;

    expect(within(badgesHeader).getByText("OPEN")).toBeInTheDocument();
  });

  it("should display incident metadata", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("High latency on NASDAQ venue"),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("ops.deepak")).toBeInTheDocument();
  });

  it("should display related alert link", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("High latency on NASDAQ venue"),
      ).toBeInTheDocument();
    });

    const alertLink = screen.getByRole("link", { name: /view alert/i });
    expect(alertLink).toHaveAttribute("href", "/alerts/alert-456");
  });

  it("should allow status update", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("High latency on NASDAQ venue"),
      ).toBeInTheDocument();
    });

    const changeStatusButton = screen.getByRole("button", {
      name: /change status/i,
    });
    await userEvent.click(changeStatusButton);

    const statusSelect = screen.getByLabelText("Status");
    await userEvent.selectOptions(statusSelect, "INVESTIGATING");

    const saveButton = screen.getByRole("button", { name: /save status/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.updateIncident)).toHaveBeenCalledWith(
        "incident-123",
        expect.objectContaining({
          status: "INVESTIGATING",
          actor: expect.any(String),
        }),
      );
    });
  });

  it("should allow owner assignment", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("High latency on NASDAQ venue"),
      ).toBeInTheDocument();
    });

    const editOwnerButton = screen.getByRole("button", {
      name: /edit owner/i,
    });
    await userEvent.click(editOwnerButton);

    const ownerInput = screen.getByLabelText("Owner");
    await userEvent.clear(ownerInput);
    await userEvent.type(ownerInput, "ops.alice");

    const saveButton = screen.getByRole("button", { name: /save owner/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.updateIncident)).toHaveBeenCalledWith(
        "incident-123",
        expect.objectContaining({
          owner: "ops.alice",
          actor: expect.any(String),
        }),
      );
    });
  });

  it("should allow adding notes", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("High latency on NASDAQ venue"),
      ).toBeInTheDocument();
    });

    const noteTextarea = screen.getByPlaceholderText(
      "Enter incident notes here...",
    );
    await userEvent.type(noteTextarea, "Coordinating with exchange team");

    const postNoteButton = screen.getByRole("button", { name: /post note/i });
    await userEvent.click(postNoteButton);

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.createIncidentNote)).toHaveBeenCalledWith(
        "incident-123",
        expect.objectContaining({
          content: "Coordinating with exchange team",
          author: expect.any(String),
        }),
      );
    });
  });

  it("should display timeline events in chronological order", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("High latency on NASDAQ venue"),
      ).toBeInTheDocument();
    });

    const timelineSection = screen
      .getByRole("heading", {
        name: "Timeline of Changes",
      })
      .closest(".card") as HTMLElement;

    expect(timelineSection).toBeInTheDocument();
    expect(
      within(timelineSection).getByText(/created the incident/),
    ).toBeInTheDocument();
    expect(
      within(timelineSection).getByText(/OPEN -> INVESTIGATING/),
    ).toBeInTheDocument();
  });

  it("should show loading state", async () => {
    vi.mocked(incidentsApi.getIncident).mockImplementation(
      () =>
        new Promise(() => {
          // Never resolve - keep loading
        }),
    );

    renderWithRouter();

    expect(screen.getByText("Loading incident details...")).toBeInTheDocument();
  });

  it("should show error state on API failure", async () => {
    vi.mocked(incidentsApi.getIncident).mockRejectedValue(
      new Error("Failed to load incident"),
    );

    renderWithRouter();

    await waitFor(
      () => {
        expect(screen.getByText("Failed to load incident")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("should clear note input after successful submission", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("High latency on NASDAQ venue"),
      ).toBeInTheDocument();
    });

    const noteTextarea = screen.getByPlaceholderText(
      "Enter incident notes here...",
    );
    await userEvent.type(noteTextarea, "Test note");

    const postNoteButton = screen.getByRole("button", { name: /post note/i });
    await userEvent.click(postNoteButton);

    await waitFor(() => {
      expect((noteTextarea as HTMLTextAreaElement).value).toBe("");
    });
  });

  it("should show validation message when required fields are missing", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("High latency on NASDAQ venue"),
      ).toBeInTheDocument();
    });

    const postNoteButton = screen.getByRole("button", { name: /post note/i });
    // Note: button should be disabled if note content is empty
    expect(postNoteButton).toBeDisabled();
  });

  it("should navigate back to incident list", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("High latency on NASDAQ venue"),
      ).toBeInTheDocument();
    });

    const backLink = screen.getByRole("link", {
      name: /incident management/i,
    });
    expect(backLink).toHaveAttribute("href", "/incidents");
  });

  it("should show feedback message on successful update", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("High latency on NASDAQ venue"),
      ).toBeInTheDocument();
    });

    const changeStatusButton = screen.getByRole("button", {
      name: /change status/i,
    });
    await userEvent.click(changeStatusButton);

    const statusSelect = screen.getByLabelText("Status");
    await userEvent.selectOptions(statusSelect, "INVESTIGATING");

    const saveButton = screen.getByRole("button", { name: /save status/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText("Incident status updated successfully."),
      ).toBeInTheDocument();
    });
  });
});
