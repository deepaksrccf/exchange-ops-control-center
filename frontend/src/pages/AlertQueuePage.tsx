import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { AlertDetailContent } from "../components/alerts/AlertDetailContent";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { useAcknowledgeAlert, useAlertsQuery } from "../hooks/useAlerts";
import { useMediaQuery } from "../hooks/useMediaQuery";
import type { AlertSeverity, AlertStatus } from "../types/alerts";
import { severityTone, statusTone } from "../utils/badgeTone";
import { formatTimestamp } from "../utils/formatters";

const numberFormatter = new Intl.NumberFormat("en-US");

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The operation could not be completed.";
}

export function AlertQueuePage() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);
  const [status, setStatus] = useState<AlertStatus | "">("");
  const [severity, setSeverity] = useState<AlertSeverity | "">("");
  const [operator, setOperator] = useState("ops.deepak");
  const [feedback, setFeedback] = useState("");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  const isDesktop = useMediaQuery("(min-width: 1100px)");

  const query = useAlertsQuery({
    page,
    size,
    sort: "detectedAt,desc",
    status: status || undefined,
    severity: severity || undefined,
  });

  const acknowledgeMutation = useAcknowledgeAlert();

  if (query.isPending) {
    return <LoadingState message="Loading alert queue..." />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message={errorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const data = query.data;

  const acknowledge = (id: string) => {
    setFeedback("");

    acknowledgeMutation.mutate(
      {
        id,
        request: { operator },
      },
      {
        onSuccess: () => {
          setFeedback("Alert acknowledged successfully.");
        },
        onError: (error) => {
          setFeedback(errorMessage(error));
        },
      },
    );
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Operations Triage</p>
          <h1>Alert Queue</h1>
          <p>
            Review, assign, and acknowledge alerts generated from the synthetic
            event stream.
          </p>
        </div>

        <div className="alert-header-actions">
          <strong>{numberFormatter.format(data.totalElements)} alerts</strong>

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

      <Card title="Queue Controls">
        <div className="alert-filter-grid">
          <label>
            Status
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as AlertStatus | "");
                setPage(0);
              }}
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
              <option value="SUPPRESSED">Suppressed</option>
            </select>
          </label>

          <label>
            Severity
            <select
              value={severity}
              onChange={(event) => {
                setSeverity(event.target.value as AlertSeverity | "");
                setPage(0);
              }}
            >
              <option value="">All severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
              <option value="INFO">Info</option>
            </select>
          </label>

          <label>
            Operator
            <input
              value={operator}
              maxLength={128}
              pattern="[A-Za-z0-9._-]+"
              onChange={(event) => setOperator(event.target.value)}
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

          <button
            type="button"
            className="event-action-button"
            onClick={() => {
              setStatus("");
              setSeverity("");
              setPage(0);
            }}
          >
            Reset filters
          </button>
        </div>

        {feedback && (
          <p className="operation-feedback" role="status">
            {feedback}
          </p>
        )}
      </Card>

      <div className={isDesktop ? "alert-queue-layout" : undefined}>
        <Card title="Operational Alerts">
          <div className="event-table-container">
            <table className="data-table alert-table">
              <caption className="sr-only">
                Paginated synthetic operational alerts
              </caption>

              <thead>
                <tr>
                  <th scope="col">Severity</th>
                  <th scope="col">Status</th>
                  <th scope="col">Alert</th>
                  <th scope="col">Rule</th>
                  <th scope="col">Venue</th>
                  <th scope="col">Symbol</th>
                  <th scope="col">Assigned</th>
                  <th scope="col">Detected</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>

              <tbody>
                {data.content.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="data-table__empty">
                      No alerts match the selected filters.
                    </td>
                  </tr>
                ) : (
                  data.content.map((alert) => (
                    <tr key={alert.id}>
                      <td>
                        <Badge tone={severityTone(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={statusTone(alert.status)}>
                          {alert.status}
                        </Badge>
                      </td>
                      <td>
                        {isDesktop ? (
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => setSelectedAlertId(alert.id)}
                          >
                            {alert.title}
                          </button>
                        ) : (
                          <Link to={`/alerts/${alert.id}`}>{alert.title}</Link>
                        )}
                      </td>
                      <td>{alert.ruleName}</td>
                      <td>{alert.venueCode}</td>
                      <td>
                        <strong>{alert.symbolTicker}</strong>
                      </td>
                      <td>{alert.assignedTo ?? "Unassigned"}</td>
                      <td>{formatTimestamp(alert.detectedAt)}</td>
                      <td>
                        <div className="alert-row-actions">
                          {isDesktop ? (
                            <button
                              type="button"
                              className="table-action-button"
                              onClick={() => setSelectedAlertId(alert.id)}
                            >
                              <Eye size={15} aria-hidden="true" />
                              View
                            </button>
                          ) : (
                            <Link
                              className="table-action-button"
                              to={`/alerts/${alert.id}`}
                            >
                              <Eye size={15} aria-hidden="true" />
                              View
                            </Link>
                          )}

                          {alert.status === "OPEN" && (
                            <button
                              type="button"
                              className="table-action-button"
                              disabled={
                                acknowledgeMutation.isPending ||
                                !operator.trim()
                              }
                              onClick={() => acknowledge(alert.id)}
                            >
                              <CheckCircle2 size={15} aria-hidden="true" />
                              Acknowledge
                            </button>
                          )}
                        </div>
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

        {isDesktop && (
          <div className="alert-queue-layout__detail">
            {selectedAlertId ? (
              <AlertDetailContent alertId={selectedAlertId} />
            ) : (
              <Card title="Alert Detail">
                <EmptyState message="Select an alert from the queue to view details." />
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
