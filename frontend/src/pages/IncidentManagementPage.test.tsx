import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryRouter } from "react-router-dom";

import { IncidentManagementPage } from "../pages/IncidentManagementPage";
import * as incidentsApi from "../api/services/incidentsApi";
import {
  buildIncident,
  buildIncidentPage,
  createTestQueryClient,
} from "../test/incidentFixtures";

// Mock the API service
vi.mock("../api/services/incidentsApi");

const mockIncidents = [
  buildIncident({
    id: "incident-1",
    incidentNumber: "INC-001",
    title: "High latency on NASDAQ venue",
    description: "Detected abnormal latency spikes",
    severity: "SEV1",
    status: "OPEN",
    owner: "ops.deepak",
    createdAt: "2026-01-15T10:30:00Z",
    updatedAt: "2026-01-15T10:30:00Z",
  }),
  buildIncident({
    id: "incident-2",
    incidentNumber: "INC-002",
    title: "Circuit breaker triggered on AAPL",
    description: "Trading halted due to price movement",
    severity: "SEV2",
    status: "INVESTIGATING",
    owner: undefined,
    createdAt: "2026-01-15T09:15:00Z",
    updatedAt: "2026-01-15T09:15:00Z",
  }),
];

const mockPage = buildIncidentPage({
  content: mockIncidents,
  totalElements: 2,
});

describe("IncidentManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(incidentsApi.getIncidents).mockResolvedValue(mockPage);
  });

  const renderWithRouter = () => {
    const queryClient = createTestQueryClient();
    const router = createMemoryRouter(
      [
        {
          path: "/incidents",
          element: <IncidentManagementPage />,
        },
        {
          path: "/incidents/:id",
          element: <div>Incident Detail</div>,
        },
      ],
      { initialEntries: ["/incidents"] },
    );

    return render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
  };

  it("should render incident list", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("Incident Management")).toBeInTheDocument();
    });

    expect(screen.getByText("INC-001")).toBeInTheDocument();
    expect(screen.getByText("INC-002")).toBeInTheDocument();
  });

  it("should display incident details in table", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    const table = screen.getByRole("table");

    expect(within(table).getByText("SEV1")).toBeInTheDocument();
    expect(within(table).getByText("SEV2")).toBeInTheDocument();
    expect(within(table).getByText("OPEN")).toBeInTheDocument();
    expect(within(table).getByText("INVESTIGATING")).toBeInTheDocument();
    expect(within(table).getByText("ops.deepak")).toBeInTheDocument();
    expect(within(table).getByText("Unassigned")).toBeInTheDocument();
  });

  it("should show empty state when no incidents match filters", async () => {
    vi.mocked(incidentsApi.getIncidents).mockResolvedValue(
      buildIncidentPage({ content: [], totalElements: 0 }),
    );

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("No incidents match the selected filters."),
      ).toBeInTheDocument();
    });
  });

  it("should filter by status", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText("Status");
    await userEvent.selectOptions(statusSelect, "OPEN");

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.getIncidents)).toHaveBeenCalledWith(
        expect.objectContaining({ status: "OPEN", page: 0 }),
      );
    });
  });

  it("should filter by severity", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    const severitySelect = screen.getByLabelText("Severity");
    await userEvent.selectOptions(severitySelect, "SEV1");

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.getIncidents)).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "SEV1", page: 0 }),
      );
    });
  });

  it("should filter by owner", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    const ownerInput = screen.getByLabelText("Owner");
    await userEvent.type(ownerInput, "ops.deepak");

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.getIncidents)).toHaveBeenCalledWith(
        expect.objectContaining({ owner: "ops.deepak" }),
      );
    });
  });

  it("should apply a search term", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText("Search");
    await userEvent.type(searchInput, "latency");

    const applyButton = screen.getByRole("button", { name: /apply search/i });
    await userEvent.click(applyButton);

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.getIncidents)).toHaveBeenCalledWith(
        expect.objectContaining({ search: "latency", page: 0 }),
      );
    });
  });

  it("should reset all filters", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;
    await userEvent.selectOptions(statusSelect, "OPEN");

    await waitFor(() => {
      expect(statusSelect.value).toBe("OPEN");
    });

    const resetButton = screen.getByRole("button", { name: /^reset$/i });
    await userEvent.click(resetButton);

    await waitFor(() => {
      expect(statusSelect.value).toBe("");
    });
  });

  it("should change page size", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    const sizeSelect = screen.getByLabelText("Rows");
    await userEvent.selectOptions(sizeSelect, "50");

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.getIncidents)).toHaveBeenCalledWith(
        expect.objectContaining({ size: 50, page: 0 }),
      );
    });
  });

  it("should navigate to incident details on view link", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    const viewLink = screen.getAllByRole("link", { name: /view/i })[0];
    expect(viewLink).toHaveAttribute("href", "/incidents/incident-1");
  });

  it("should show error state on API failure", async () => {
    vi.mocked(incidentsApi.getIncidents).mockRejectedValue(
      new Error("Failed to fetch incidents"),
    );

    renderWithRouter();

    await waitFor(
      () => {
        expect(
          screen.getByText("Failed to fetch incidents"),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("should refresh incidents on button click", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole("button", { name: /refresh/i });
    await userEvent.click(refreshButton);

    await waitFor(() => {
      expect(
        vi.mocked(incidentsApi.getIncidents).mock.calls.length,
      ).toBeGreaterThan(1);
    });
  });

  it("should display pagination info", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    expect(screen.getByText("2 incidents")).toBeInTheDocument();
  });
});
