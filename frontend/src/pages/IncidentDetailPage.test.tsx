import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryRouter } from "react-router-dom";

import { IncidentDetailPage } from "../pages/IncidentDetailPage";
import * as incidentsApi from "../api/services/incidentsApi";
import {
  buildIncident,
  buildIncidentEvent,
  buildIncidentNote,
  createTestQueryClient,
} from "../test/incidentFixtures";

// Mock the API service
vi.mock("../api/services/incidentsApi");

const mockIncident = buildIncident();

const mockTimeline = [
  buildIncidentEvent({
    id: "event-1",
    eventType: "CREATED",
    description: "Incident created",
    createdAt: "2026-01-15T10:30:00Z",
  }),
  buildIncidentEvent({
    id: "event-2",
    eventType: "STATUS_CHANGED",
    description: "OPEN -> INVESTIGATING",
    createdAt: "2026-01-15T10:35:00Z",
  }),
];

describe("IncidentDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(incidentsApi.getIncident).mockResolvedValue(mockIncident);
    vi.mocked(incidentsApi.getIncidentTimeline).mockResolvedValue(mockTimeline);
    vi.mocked(incidentsApi.updateIncident).mockResolvedValue(mockIncident);
    vi.mocked(incidentsApi.createIncidentNote).mockResolvedValue(
      buildIncidentNote(),
    );
  });

  const renderWithRouter = (incidentId: string = "incident-123") => {
    const queryClient = createTestQueryClient();
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
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    // Title appears in header and in details card; get first occurrence
    const titleElements = screen.getAllByText("High latency on NASDAQ venue");
    expect(titleElements.length).toBeGreaterThan(0);

    // Description is in the Incident Information card
    expect(
      screen.getByText("Detected abnormal latency spikes exceeding 5 seconds"),
    ).toBeInTheDocument();
  });

  it("should display severity and status badges", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const badgesHeader = document.querySelector(
      ".alert-detail-header__badges",
    ) as HTMLElement;

    expect(within(badgesHeader).getByText("SEV1")).toBeInTheDocument();
    expect(within(badgesHeader).getByText("OPEN")).toBeInTheDocument();
  });

  it("should display incident metadata", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const infoCard = screen
      .getByRole("heading", { name: "Incident Information" })
      .closest(".card") as HTMLElement;

    expect(within(infoCard).getByText("ops.deepak")).toBeInTheDocument();
    expect(within(infoCard).getByText("Not resolved")).toBeInTheDocument();
    expect(
      within(infoCard).getByText("No resolution summary recorded."),
    ).toBeInTheDocument();
  });

  it("should display related alert link", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const alertLink = screen.getByRole("link", {
      name: /originating alert/i,
    });
    expect(alertLink).toHaveAttribute("href", "/alerts/alert-456");
  });

  it("should not render an alert link when the incident has no alertId", async () => {
    vi.mocked(incidentsApi.getIncident).mockResolvedValue(
      buildIncident({ alertId: undefined }),
    );

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("link", { name: /originating alert/i }),
    ).not.toBeInTheDocument();
  });

  it("should submit status changes through the update form", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText("Status");
    await userEvent.selectOptions(statusSelect, "INVESTIGATING");

    const saveButton = screen.getByRole("button", { name: /save incident/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.updateIncident)).toHaveBeenCalledWith(
        "incident-123",
        expect.objectContaining({
          status: "INVESTIGATING",
          actor: "ops.deepak",
        }),
      );
    });
  });

  it("should submit owner changes through the update form", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const ownerInput = screen.getByLabelText("Owner");
    await userEvent.clear(ownerInput);
    await userEvent.type(ownerInput, "ops.alice");

    const saveButton = screen.getByRole("button", { name: /save incident/i });
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

  it("should submit a resolution summary through the update form", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const resolutionInput = screen.getByLabelText("Resolution summary");
    await userEvent.type(
      resolutionInput,
      "Mitigated by failover to backup venue",
    );

    const saveButton = screen.getByRole("button", { name: /save incident/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.updateIncident)).toHaveBeenCalledWith(
        "incident-123",
        expect.objectContaining({
          resolutionSummary: "Mitigated by failover to backup venue",
        }),
      );
    });
  });

  it("should show feedback message on successful update", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save incident/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText("Incident updated successfully."),
      ).toBeInTheDocument();
    });
  });

  it("should show error feedback when update fails", async () => {
    vi.mocked(incidentsApi.updateIncident).mockRejectedValue(
      new Error("Update rejected"),
    );

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: /save incident/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Update rejected")).toBeInTheDocument();
    });
  });

  it("should create a note through the note form", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const noteTextarea = screen.getByLabelText("Note");
    await userEvent.type(noteTextarea, "Coordinating with exchange team");

    const postNoteButton = screen.getByRole("button", { name: /add note/i });
    await userEvent.click(postNoteButton);

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.createIncidentNote)).toHaveBeenCalledWith(
        "incident-123",
        expect.objectContaining({
          content: "Coordinating with exchange team",
          author: "ops.deepak",
        }),
      );
    });
  });

  it("should clear note input after successful submission", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const noteTextarea = screen.getByLabelText("Note") as HTMLTextAreaElement;
    await userEvent.type(noteTextarea, "Test note");

    const postNoteButton = screen.getByRole("button", { name: /add note/i });
    await userEvent.click(postNoteButton);

    await waitFor(() => {
      expect(noteTextarea.value).toBe("");
    });
  });

  it("should require note content before it can be submitted", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const noteTextarea = screen.getByLabelText("Note") as HTMLTextAreaElement;

    expect(noteTextarea).toBeRequired();
    expect(noteTextarea.validity.valid).toBe(false);
  });

  it("should display timeline events in chronological order", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const timelineCard = screen
      .getByRole("heading", { name: "Immutable Timeline" })
      .closest(".card") as HTMLElement;

    const entries = within(timelineCard).getAllByRole("listitem");
    expect(entries).toHaveLength(2);
    expect(
      within(entries[0]).getByText("Incident created"),
    ).toBeInTheDocument();
    expect(
      within(entries[1]).getByText("OPEN -> INVESTIGATING"),
    ).toBeInTheDocument();
  });

  it("should show an empty timeline message when no events exist", async () => {
    vi.mocked(incidentsApi.getIncidentTimeline).mockResolvedValue([]);

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("No timeline events were found."),
      ).toBeInTheDocument();
    });
  });

  it("should show loading state", () => {
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

  it("should navigate back to incident list", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "INC-001", level: 1 }),
      ).toBeInTheDocument();
    });

    const backLink = screen.getByRole("link", {
      name: /incident management/i,
    });
    expect(backLink).toHaveAttribute("href", "/incidents");
  });
});
