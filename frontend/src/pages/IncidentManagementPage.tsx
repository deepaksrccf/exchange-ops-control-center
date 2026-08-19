import { ChevronLeft, ChevronRight, Eye, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { useIncidentsQuery } from "../hooks/useIncidents";
import type { IncidentSeverity, IncidentStatus } from "../types/incidents";
import { formatTimestamp } from "../utils/formatters";

const numberFormatter = new Intl.NumberFormat("en-US");

function severityTone(
  severity: IncidentSeverity,
): "danger" | "warning" | "info" | "neutral" {
  switch (severity) {
    case "SEV1":
      return "danger";
    case "SEV2":
      return "warning";
    case "SEV3":
      return "info";
    default:
      return "neutral";
  }
}

function statusTone(
  status: IncidentStatus,
): "danger" | "warning" | "success" | "neutral" {
  switch (status) {
    case "OPEN":
      return "danger";
    case "INVESTIGATING":
    case "MITIGATED":
      return "warning";
    case "RESOLVED":
    case "CLOSED":
      return "success";
    default:
      return "neutral";
  }
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load incidents.";
}

export function IncidentManagementPage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [status, setStatus] = useState<IncidentStatus | "">("");
  const [severity, setSeverity] = useState<IncidentSeverity | "">("");
  const [owner, setOwner] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const query = useIncidentsQuery({
    page,
    size,
    sort: "createdAt,desc",
    status: status || undefined,
    severity: severity || undefined,
    owner: owner.trim() || undefined,
    search: search || undefined,
  });

  if (query.isPending) {
    return <LoadingState message="Loading incidents..." />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message={messageFrom(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const data = query.data;

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Operational Remediation</p>
          <h1>Incident Management</h1>
          <p>
            Track ownership, investigation, mitigation, and resolution of
            incidents derived from synthetic operational alerts.
          </p>
        </div>

        <div className="incident-header-actions">
          <strong>
            {numberFormatter.format(data.totalElements)} incidents
          </strong>

          <button
            type="button"
            className="event-action-button"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw
              size={17}
              aria-hidden="true"
              className={query.isFetching ? "icon-spinning" : undefined}
            />
            Refresh
          </button>
        </div>
      </header>

      <Card title="Incident Filters">
        <form
          className="incident-filter-grid"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput.trim());
            setPage(0);
          }}
        >
          <label>
            Search
            <input
              value={searchInput}
              placeholder="Title or description"
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>

          <label>
            Status
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as IncidentStatus | "");
                setPage(0);
              }}
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="MITIGATED">Mitigated</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>

          <label>
            Severity
            <select
              value={severity}
              onChange={(event) => {
                setSeverity(event.target.value as IncidentSeverity | "");
                setPage(0);
              }}
            >
              <option value="">All severities</option>
              <option value="SEV1">SEV1</option>
              <option value="SEV2">SEV2</option>
              <option value="SEV3">SEV3</option>
              <option value="SEV4">SEV4</option>
            </select>
          </label>

          <label>
            Owner
            <input
              value={owner}
              placeholder="ops.avery"
              pattern="[A-Za-z0-9._-]*"
              onChange={(event) => {
                setOwner(event.target.value);
                setPage(0);
              }}
            />
          </label>

          <label>
            Rows
            <select
              value={size}
              onChange={(event) => {
                setSize(Number(event.target.value));
                setPage(0);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>

          <button type="submit" className="event-action-button">
            Apply search
          </button>

          <button
            type="button"
            className="event-action-button"
            onClick={() => {
              setStatus("");
              setSeverity("");
              setOwner("");
              setSearchInput("");
              setSearch("");
              setPage(0);
            }}
          >
            Reset
          </button>
        </form>
      </Card>

      <Card title="Operational Incidents">
        <div className="event-table-container">
          <table className="data-table incident-table">
            <caption className="sr-only">
              Paginated synthetic operational incidents
            </caption>

            <thead>
              <tr>
                <th scope="col">Incident</th>
                <th scope="col">Severity</th>
                <th scope="col">Status</th>
                <th scope="col">Title</th>
                <th scope="col">Owner</th>
                <th scope="col">Created</th>
                <th scope="col">Updated</th>
                <th scope="col">Action</th>
              </tr>
            </thead>

            <tbody>
              {data.content.length === 0 ? (
                <tr>
                  <td colSpan={8} className="data-table__empty">
                    No incidents match the selected filters.
                  </td>
                </tr>
              ) : (
                data.content.map((incident) => (
                  <tr key={incident.id}>
                    <td>
                      <Link to={`/incidents/${incident.id}`}>
                        {incident.incidentNumber}
                      </Link>
                    </td>
                    <td>
                      <Badge tone={severityTone(incident.severity)}>
                        {incident.severity}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone={statusTone(incident.status)}>
                        {incident.status}
                      </Badge>
                    </td>
                    <td>{incident.title}</td>
                    <td>{incident.owner ?? "Unassigned"}</td>
                    <td>{formatTimestamp(incident.createdAt)}</td>
                    <td>{formatTimestamp(incident.updatedAt)}</td>
                    <td>
                      <Link
                        className="table-action-button"
                        to={`/incidents/${incident.id}`}
                      >
                        <Eye size={15} aria-hidden="true" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="pagination-bar">
          <span>
            Page {data.page + 1} of {Math.max(data.totalPages, 1)}
          </span>

          <div className="pagination-bar__actions">
            <button
              type="button"
              disabled={data.first || query.isFetching}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Previous
            </button>

            <button
              type="button"
              disabled={data.last || query.isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </Card>
    </div>
  );
}
