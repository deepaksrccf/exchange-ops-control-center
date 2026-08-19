import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryRouter } from "react-router-dom";

import { queryClient } from "../api/queryClient";
import { IncidentManagementPage } from "../pages/IncidentManagementPage";
import * as incidentsApi from "../api/services/incidentsApi";
import type { Incident, IncidentPage } from "../types/incidents";

// Mock the API service
vi.mock("../api/services/incidentsApi");

const mockIncidents: Incident[] = [
  {
    id: "incident-1",
    incidentNumber: "INC-001",
    title: "High latency on NASDAQ venue",
    description: "Detected abnormal latency spikes",
    severity: "SEV1",
    status: "OPEN",
    owner: "ops.deepak",
    createdAt: "2026-01-15T10:30:00Z",
    updatedAt: "2026-01-15T10:30:00Z",
  },
  {
    id: "incident-2",
    incidentNumber: "INC-002",
    title: "Circuit breaker triggered on AAPL",
    description: "Trading halted due to price movement",
    severity: "SEV2",
    status: "INVESTIGATING",
    owner: undefined,
    createdAt: "2026-01-15T09:15:00Z",
    updatedAt: "2026-01-15T09:15:00Z",
  },
];

const mockPage: IncidentPage = {
  content: mockIncidents,
  page: 0,
  size: 25,
  totalElements: 2,
  totalPages: 1,
  first: true,
  last: true,
};

describe("IncidentManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();

    vi.mocked(incidentsApi.getIncidents).mockResolvedValue(mockPage);
  });

  const renderWithRouter = () => {
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

    // Check severity badges
    expect(within(table).getByText("SEV1")).toBeInTheDocument();
    expect(within(table).getByText("SEV2")).toBeInTheDocument();

    // Check statuses
    expect(within(table).getByText("OPEN")).toBeInTheDocument();
    expect(within(table).getByText("INVESTIGATING")).toBeInTheDocument();

    // Check owner display
    expect(within(table).getByText("ops.deepak")).toBeInTheDocument();
    expect(within(table).getByText("Unassigned")).toBeInTheDocument();
  });

  it("should show empty state when no incidents match filters", async () => {
    vi.mocked(incidentsApi.getIncidents).mockResolvedValue({
      ...mockPage,
      content: [],
      totalElements: 0,
    });

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
        expect.objectContaining({
          status: "OPEN",
          page: 0,
        }),
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
        expect.objectContaining({
          severity: "SEV1",
          page: 0,
        }),
      );
    });
  });

  it("should filter by owner", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    const ownerInput = screen.getByPlaceholderText("e.g., ops.deepak");
    await userEvent.clear(ownerInput);
    await userEvent.type(ownerInput, "ops.deepak");

    await waitFor(() => {
      expect(vi.mocked(incidentsApi.getIncidents)).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: "ops.deepak",
        }),
      );
    });
  });

  it("should reset all filters", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    // Apply a filter
    const statusSelect = screen.getByLabelText("Status") as HTMLSelectElement;
    await userEvent.selectOptions(statusSelect, "OPEN");

    await waitFor(() => {
      expect(statusSelect.value).toBe("OPEN");
    });

    // Reset filters
    const resetButton = screen.getByRole("button", { name: /reset filters/i });
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
        expect.objectContaining({
          size: 50,
          page: 0,
        }),
      );
    });
  });

  it("should navigate to incident details on view link", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("INC-001")).toBeInTheDocument();
    });

    const viewButton = screen.getAllByRole("link", { name: /view/i })[0];
    expect(viewButton).toHaveAttribute("href", "/incidents/incident-1");
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
