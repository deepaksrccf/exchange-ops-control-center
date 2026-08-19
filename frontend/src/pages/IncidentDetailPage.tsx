import { ArrowLeft, ExternalLink, MessageSquarePlus, Save } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import {
  useCreateIncidentNote,
  useIncidentQuery,
  useIncidentTimelineQuery,
  useUpdateIncident,
} from "../hooks/useIncidents";
import type { IncidentSeverity, IncidentStatus } from "../types/incidents";
import { severityTone, statusTone } from "../utils/badgeTone";
import { formatTimestamp } from "../utils/formatters";

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The operation could not be completed.";
}

export function IncidentDetailPage() {
  const { id } = useParams();

  const incidentQuery = useIncidentQuery(id);
  const timelineQuery = useIncidentTimelineQuery(id);
  const updateMutation = useUpdateIncident();
  const noteMutation = useCreateIncidentNote();

  const [actor, setActor] = useState("ops.deepak");
  const [owner, setOwner] = useState("");
  const [status, setStatus] = useState<IncidentStatus>("OPEN");
  const [severity, setSeverity] = useState<IncidentSeverity>("SEV3");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [noteAuthor, setNoteAuthor] = useState("ops.deepak");
  const [noteContent, setNoteContent] = useState("");
  const [feedback, setFeedback] = useState("");

  const incident = incidentQuery.data;

  useEffect(() => {
    if (!incident) {
      return;
    }

    setOwner(incident.owner ?? "");
    setStatus(incident.status);
    setSeverity(incident.severity);
    setResolutionSummary(incident.resolutionSummary ?? "");
  }, [incident]);

  if (incidentQuery.isPending) {
    return <LoadingState message="Loading incident details..." />;
  }

  if (incidentQuery.isError || !incident) {
    return (
      <ErrorState
        message={messageFrom(incidentQuery.error)}
        onRetry={() => void incidentQuery.refetch()}
      />
    );
  }

  const update = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id || !actor.trim()) {
      setFeedback("A valid actor identifier is required.");
      return;
    }

    setFeedback("");

    updateMutation.mutate(
      {
        id,
        request: {
          status,
          severity,
          owner: owner.trim() || undefined,
          resolutionSummary: resolutionSummary.trim() || undefined,
          actor: actor.trim(),
        },
      },
      {
        onSuccess: () => {
          setFeedback("Incident updated successfully.");
        },
        onError: (error) => {
          setFeedback(messageFrom(error));
        },
      },
    );
  };

  const addNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id || !noteAuthor.trim() || !noteContent.trim()) {
      setFeedback("Note author and content are required.");
      return;
    }

    setFeedback("");

    noteMutation.mutate(
      {
        id,
        request: {
          author: noteAuthor.trim(),
          content: noteContent.trim(),
        },
      },
      {
        onSuccess: () => {
          setNoteContent("");
          setFeedback("Note added successfully.");
        },
        onError: (error) => {
          setFeedback(messageFrom(error));
        },
      },
    );
  };

  const timeline = [...(timelineQuery.data ?? [])].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <Link className="back-link" to="/incidents">
            <ArrowLeft size={16} aria-hidden="true" />
            Incident Management
          </Link>

          <p className="page__eyebrow">Synthetic Operational Incident</p>

          <h1>{incident.incidentNumber}</h1>
          <p>{incident.title}</p>
        </div>

        <div className="alert-detail-header__badges">
          <Badge tone={severityTone(incident.severity)}>
            {incident.severity}
          </Badge>

          <Badge tone={statusTone(incident.status)}>{incident.status}</Badge>
        </div>
      </header>

      {feedback && (
        <p className="operation-feedback" role="status">
          {feedback}
        </p>
      )}

      <div className="incident-detail-grid">
        <Card title="Incident Information">
          <dl className="event-detail-list">
            <div>
              <dt>Title</dt>
              <dd>{incident.title}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{incident.description}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{incident.owner ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatTimestamp(incident.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatTimestamp(incident.updatedAt)}</dd>
            </div>
            <div>
              <dt>Resolved</dt>
              <dd>
                {incident.resolvedAt
                  ? formatTimestamp(incident.resolvedAt)
                  : "Not resolved"}
              </dd>
            </div>
            <div>
              <dt>Resolution</dt>
              <dd>
                {incident.resolutionSummary ??
                  "No resolution summary recorded."}
              </dd>
            </div>
          </dl>

          <div className="linked-records">
            {incident.alertId && (
              <Link to={`/alerts/${incident.alertId}`}>
                <ExternalLink size={16} aria-hidden="true" />
                Originating alert
              </Link>
            )}
          </div>
        </Card>

        <Card title="Update Incident">
          <form className="incident-update-form" onSubmit={update}>
            <label>
              Actor
              <input
                required
                value={actor}
                maxLength={128}
                pattern="[A-Za-z0-9._-]+"
                onChange={(event) => setActor(event.target.value)}
              />
            </label>

            <label>
              Owner
              <input
                value={owner}
                maxLength={128}
                pattern="[A-Za-z0-9._-]*"
                onChange={(event) => setOwner(event.target.value)}
              />
            </label>

            <label>
              Status
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as IncidentStatus)
                }
              >
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
                onChange={(event) =>
                  setSeverity(event.target.value as IncidentSeverity)
                }
              >
                <option value="SEV1">SEV1</option>
                <option value="SEV2">SEV2</option>
                <option value="SEV3">SEV3</option>
                <option value="SEV4">SEV4</option>
              </select>
            </label>

            <label>
              Resolution summary
              <textarea
                rows={4}
                maxLength={4000}
                value={resolutionSummary}
                onChange={(event) => setResolutionSummary(event.target.value)}
              />
            </label>

            <button
              type="submit"
              className="primary-action-button"
              disabled={updateMutation.isPending}
            >
              <Save size={17} aria-hidden="true" />
              {updateMutation.isPending ? "Saving" : "Save incident"}
            </button>
          </form>
        </Card>
      </div>

      <div className="incident-detail-grid">
        <Card title="Add Investigation Note">
          <form className="incident-note-form" onSubmit={addNote}>
            <label>
              Author
              <input
                required
                value={noteAuthor}
                maxLength={128}
                pattern="[A-Za-z0-9._-]+"
                onChange={(event) => setNoteAuthor(event.target.value)}
              />
            </label>

            <label>
              Note
              <textarea
                required
                rows={5}
                maxLength={4000}
                value={noteContent}
                onChange={(event) => setNoteContent(event.target.value)}
              />
            </label>

            <button
              type="submit"
              className="primary-action-button"
              disabled={noteMutation.isPending}
            >
              <MessageSquarePlus size={17} aria-hidden="true" />
              {noteMutation.isPending ? "Adding" : "Add note"}
            </button>
          </form>
        </Card>

        <Card title="Immutable Timeline">
          {timelineQuery.isPending ? (
            <LoadingState message="Loading timeline..." />
          ) : timelineQuery.isError ? (
            <ErrorState
              message={messageFrom(timelineQuery.error)}
              onRetry={() => void timelineQuery.refetch()}
            />
          ) : timeline.length === 0 ? (
            <p className="supporting-message">No timeline events were found.</p>
          ) : (
            <ol className="incident-timeline">
              {timeline.map((entry) => (
                <li key={entry.id}>
                  <span
                    className="incident-timeline__marker"
                    aria-hidden="true"
                  />

                  <div>
                    <div className="incident-timeline__heading">
                      <strong>{entry.eventType}</strong>
                      <time dateTime={entry.createdAt}>
                        {formatTimestamp(entry.createdAt)}
                      </time>
                    </div>

                    <p>{entry.description}</p>
                    <small>Actor: {entry.actor}</small>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}
