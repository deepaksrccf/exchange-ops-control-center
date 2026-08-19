import { ArrowLeft, CheckCircle2, ExternalLink, Siren } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import {
  useAcknowledgeAlert,
  useAlertQuery,
  useCreateIncidentFromAlert,
} from "../hooks/useAlerts";
import type { IncidentSeverity } from "../types/alerts";
import { severityTone, statusTone } from "../utils/badgeTone";
import { formatTimestamp } from "../utils/formatters";

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The operation could not be completed.";
}

export function AlertDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const alertQuery = useAlertQuery(id);
  const acknowledgeMutation = useAcknowledgeAlert();
  const incidentMutation = useCreateIncidentFromAlert();

  const [operator, setOperator] = useState("ops.deepak");
  const [createdBy, setCreatedBy] = useState("ops.deepak");
  const [owner, setOwner] = useState("ops.deepak");
  const [severity, setSeverity] = useState<IncidentSeverity>("HIGH");
  const [feedback, setFeedback] = useState("");

  if (alertQuery.isPending) {
    return <LoadingState message="Loading alert details..." />;
  }

  if (alertQuery.isError || !alertQuery.data) {
    return (
      <ErrorState
        message={messageFrom(alertQuery.error)}
        onRetry={() => void alertQuery.refetch()}
      />
    );
  }

  const alert = alertQuery.data;

  const acknowledge = () => {
    if (!id || !operator.trim()) {
      return;
    }

    setFeedback("");

    acknowledgeMutation.mutate(
      {
        id,
        request: {
          operator: operator.trim(),
        },
      },
      {
        onSuccess: () => {
          setFeedback("Alert acknowledged successfully.");
        },
        onError: (error) => {
          setFeedback(messageFrom(error));
        },
      },
    );
  };

  const createIncident = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) {
      return;
    }

    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();

    if (!title || !description || !createdBy.trim()) {
      setFeedback("Complete all required incident fields.");
      return;
    }

    setFeedback("");

    incidentMutation.mutate(
      {
        alertId: id,
        request: {
          title,
          description,
          severity,
          owner: owner.trim() || undefined,
          createdBy: createdBy.trim(),
        },
      },
      {
        onSuccess: (incident) => {
          navigate(`/incidents/${incident.id}`);
        },
        onError: (error) => {
          setFeedback(messageFrom(error));
        },
      },
    );
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Link className="back-link" to="/alerts">
            <ArrowLeft size={16} aria-hidden="true" />
            Alert Queue
          </Link>

          <p className="page__eyebrow">Synthetic Alert Investigation</p>

          <h1>{alert.title}</h1>

          <p>{alert.explanation}</p>
        </div>

        <div className="alert-detail-header__badges">
          <Badge tone={severityTone(alert.severity)}>{alert.severity}</Badge>

          <Badge tone={statusTone(alert.status)}>{alert.status}</Badge>
        </div>
      </header>

      {feedback && (
        <p className="operation-feedback" role="status">
          {feedback}
        </p>
      )}

      <div className="alert-detail-grid">
        <Card title="Alert Details">
          <dl className="event-detail-list">
            <div>
              <dt>Rule</dt>
              <dd>{alert.ruleName}</dd>
            </div>
            <div>
              <dt>Rule type</dt>
              <dd>{alert.ruleType}</dd>
            </div>
            <div>
              <dt>Venue</dt>
              <dd>{alert.venueCode}</dd>
            </div>
            <div>
              <dt>Symbol</dt>
              <dd>{alert.symbolTicker}</dd>
            </div>
            <div>
              <dt>Detected</dt>
              <dd>{formatTimestamp(alert.detectedAt)}</dd>
            </div>
            <div>
              <dt>Assigned to</dt>
              <dd>{alert.assignedTo ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt>Acknowledged</dt>
              <dd>
                {alert.acknowledgedAt
                  ? formatTimestamp(alert.acknowledgedAt)
                  : "Not acknowledged"}
              </dd>
            </div>
            <div>
              <dt>Resolved</dt>
              <dd>
                {alert.resolvedAt
                  ? formatTimestamp(alert.resolvedAt)
                  : "Not resolved"}
              </dd>
            </div>
          </dl>

          <div className="linked-records">
            <Link to={`/events?eventId=${alert.eventId}`}>
              <ExternalLink size={16} aria-hidden="true" />
              Related event
            </Link>

            {alert.incidentId && (
              <Link to={`/incidents/${alert.incidentId}`}>
                <ExternalLink size={16} aria-hidden="true" />
                Related incident
              </Link>
            )}
          </div>
        </Card>

        <Card title="Triage Actions">
          {alert.status === "OPEN" ? (
            <div className="alert-action-form">
              <label>
                Operator identifier
                <input
                  value={operator}
                  maxLength={128}
                  pattern="[A-Za-z0-9._-]+"
                  onChange={(event) => setOperator(event.target.value)}
                />
              </label>

              <button
                type="button"
                className="primary-action-button"
                disabled={acknowledgeMutation.isPending || !operator.trim()}
                onClick={acknowledge}
              >
                <CheckCircle2 size={17} aria-hidden="true" />
                {acknowledgeMutation.isPending
                  ? "Acknowledging"
                  : "Acknowledge alert"}
              </button>
            </div>
          ) : (
            <p className="supporting-message">
              This alert is currently {alert.status.toLowerCase()}.
            </p>
          )}
        </Card>
      </div>

      {!alert.incidentId && (
        <Card title="Create Incident">
          <form className="incident-create-form" onSubmit={createIncident}>
            <label className="form-field--wide">
              Incident title
              <input
                name="title"
                required
                maxLength={200}
                defaultValue={alert.title}
              />
            </label>

            <label className="form-field--wide">
              Description
              <textarea
                name="description"
                required
                maxLength={4000}
                rows={5}
                defaultValue={alert.explanation}
              />
            </label>

            <label>
              Severity
              <select
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value as IncidentSeverity)
                }
              >
                <option value="SEV1">SEV1 - Critical</option>
                <option value="SEV2">SEV2 - High</option>
                <option value="SEV3">SEV3 - Medium</option>
                <option value="SEV4">SEV4 - Low</option>
              </select>
            </label>

            <label>
              Owner
              <input
                value={owner}
                maxLength={128}
                pattern="[A-Za-z0-9._-]+"
                onChange={(event) => setOwner(event.target.value)}
              />
            </label>

            <label>
              Created by
              <input
                required
                value={createdBy}
                maxLength={128}
                pattern="[A-Za-z0-9._-]+"
                onChange={(event) => setCreatedBy(event.target.value)}
              />
            </label>

            <div className="incident-create-form__action">
              <button
                type="submit"
                className="primary-action-button"
                disabled={incidentMutation.isPending}
              >
                <Siren size={17} aria-hidden="true" />
                {incidentMutation.isPending
                  ? "Creating incident"
                  : "Create incident"}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
