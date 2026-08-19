import { ArrowLeft, Clock, ExternalLink, Save, Send } from "lucide-react";
import { type FormEvent, useState, useMemo } from "react";
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
import type { IncidentStatus, IncidentEvent } from "../types/incidents";
import { severityTone, statusTone } from "../utils/badgeTone";
import { formatTimestamp } from "../utils/formatters";

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The operation could not be completed.";
}

// Map event types to human-readable descriptions
function describeEventType(event: IncidentEvent): string {
  const prefix = `${event.actor}`;
  switch (event.eventType) {
    case "CREATED":
      return `${prefix} created the incident`;
    case "STATUS_CHANGED":
      return `${prefix} changed status: ${event.description}`;
    case "SEVERITY_CHANGED":
      return `${prefix} changed severity: ${event.description}`;
    case "OWNER_ASSIGNED":
      return `${prefix} assigned to ${event.description}`;
    case "NOTE_ADDED":
      return `${prefix} added a note`;
    case "RESOLVED":
      return `${prefix} marked as resolved`;
    default:
      return event.description;
  }
}

// Sort timeline events by creation time (oldest first)
function sortTimeline(events: IncidentEvent[]): IncidentEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function IncidentDetailPage() {
  const { id } = useParams();

  // Queries
  const incidentQuery = useIncidentQuery(id);
  const timelineQuery = useIncidentTimelineQuery(id);

  // Mutations
  const updateMutation = useUpdateIncident();
  const noteMutation = useCreateIncidentNote();

  // Local state for form controls
  const [operator, setOperator] = useState("ops.deepak");
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingOwner, setEditingOwner] = useState(false);
  // Form state - only used when editing, defaults to current values
  const [formStatus, setFormStatus] = useState<IncidentStatus | "">(
    incidentQuery.data?.status ?? "",
  );
  const [formOwner, setFormOwner] = useState(incidentQuery.data?.owner ?? "");
  const [noteContent, setNoteContent] = useState("");
  const [feedback, setFeedback] = useState("");

  // Compute sorted timeline unconditionally (move before conditionals)
  const sortedTimeline = useMemo(
    () => (timelineQuery.data ? sortTimeline(timelineQuery.data) : []),
    [timelineQuery.data],
  );

  // Handle loading states
  if (incidentQuery.isPending) {
    return <LoadingState message="Loading incident details..." />;
  }

  if (incidentQuery.isError || !incidentQuery.data) {
    return (
      <ErrorState
        message={messageFrom(incidentQuery.error)}
        onRetry={() => void incidentQuery.refetch()}
      />
    );
  }

  const incident = incidentQuery.data;

  // Submit status update
  const handleStatusUpdate = () => {
    if (!id || !formStatus || !operator.trim()) {
      setFeedback("Please select a status and provide an operator name.");
      return;
    }

    setFeedback("");

    updateMutation.mutate(
      {
        id,
        request: {
          status: formStatus as IncidentStatus,
          actor: operator.trim(),
        },
      },
      {
        onSuccess: () => {
          setFeedback("Incident status updated successfully.");
          setEditingStatus(false);
        },
        onError: (error) => {
          setFeedback(messageFrom(error));
        },
      },
    );
  };

  // Submit owner update
  const handleOwnerUpdate = () => {
    if (!id || !operator.trim()) {
      setFeedback("Please provide an operator name.");
      return;
    }

    setFeedback("");

    updateMutation.mutate(
      {
        id,
        request: {
          owner: formOwner.trim() || undefined,
          actor: operator.trim(),
        },
      },
      {
        onSuccess: () => {
          setFeedback("Incident owner updated successfully.");
          setEditingOwner(false);
        },
        onError: (error) => {
          setFeedback(messageFrom(error));
        },
      },
    );
  };

  // Submit new note
  const handleAddNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id || !noteContent.trim() || !operator.trim()) {
      setFeedback("Please provide a note and operator name.");
      return;
    }

    setFeedback("");

    noteMutation.mutate(
      {
        incidentId: id,
        request: {
          author: operator.trim(),
          content: noteContent.trim(),
        },
      },
      {
        onSuccess: () => {
          setFeedback("Note added successfully.");
          setNoteContent("");
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
          <Link className="back-link" to="/incidents">
            <ArrowLeft size={16} aria-hidden="true" />
            Incident Management
          </Link>

          <p className="page__eyebrow">Incident Resolution</p>

          <h1>{incident.title}</h1>

          <p>{incident.description}</p>
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
              <dt>Incident Number</dt>
              <dd>{incident.incidentNumber}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatTimestamp(incident.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatTimestamp(incident.updatedAt)}</dd>
            </div>
            {incident.resolvedAt && (
              <div>
                <dt>Resolved</dt>
                <dd>{formatTimestamp(incident.resolvedAt)}</dd>
              </div>
            )}
            {incident.alertId && (
              <div>
                <dt>Related Alert</dt>
                <dd>
                  <Link to={`/alerts/${incident.alertId}`}>
                    <ExternalLink size={16} aria-hidden="true" />
                    View Alert
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card title="Status Management">
          {editingStatus ? (
            <div className="incident-edit-form">
              <label>
                Status
                <select
                  value={formStatus}
                  onChange={(e) =>
                    setFormStatus(e.target.value as IncidentStatus | "")
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
                Operator
                <input
                  value={operator}
                  maxLength={128}
                  pattern="[A-Za-z0-9._-]+"
                  onChange={(e) => setOperator(e.target.value)}
                />
              </label>

              <div className="incident-form-actions">
                <button
                  type="button"
                  className="event-action-button"
                  disabled={updateMutation.isPending}
                  onClick={handleStatusUpdate}
                >
                  <Save size={15} aria-hidden="true" />
                  Save Status
                </button>

                <button
                  type="button"
                  className="event-action-button"
                  onClick={() => setEditingStatus(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <dl className="event-detail-list">
                <div>
                  <dt>Current Status</dt>
                  <dd>
                    <Badge tone={statusTone(incident.status)}>
                      {incident.status}
                    </Badge>
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                className="event-action-button"
                onClick={() => setEditingStatus(true)}
              >
                Change Status
              </button>
            </>
          )}
        </Card>

        <Card title="Owner Assignment">
          {editingOwner ? (
            <div className="incident-edit-form">
              <label>
                Owner
                <input
                  value={formOwner}
                  maxLength={128}
                  pattern="[A-Za-z0-9._-]*"
                  onChange={(e) => setFormOwner(e.target.value)}
                  placeholder="e.g., ops.deepak"
                />
              </label>

              <label>
                Operator
                <input
                  value={operator}
                  maxLength={128}
                  pattern="[A-Za-z0-9._-]+"
                  onChange={(e) => setOperator(e.target.value)}
                />
              </label>

              <div className="incident-form-actions">
                <button
                  type="button"
                  className="event-action-button"
                  disabled={updateMutation.isPending}
                  onClick={handleOwnerUpdate}
                >
                  <Save size={15} aria-hidden="true" />
                  Save Owner
                </button>

                <button
                  type="button"
                  className="event-action-button"
                  onClick={() => setEditingOwner(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <dl className="event-detail-list">
                <div>
                  <dt>Current Owner</dt>
                  <dd>{incident.owner ?? "Unassigned"}</dd>
                </div>
              </dl>

              <button
                type="button"
                className="event-action-button"
                onClick={() => setEditingOwner(true)}
              >
                Edit Owner
              </button>
            </>
          )}
        </Card>

        {incident.resolutionSummary && (
          <Card title="Resolution Summary">
            <p>{incident.resolutionSummary}</p>
          </Card>
        )}

        <Card title="Add a Note">
          <form onSubmit={handleAddNote} className="incident-note-form">
            <label>
              Operator
              <input
                value={operator}
                maxLength={128}
                pattern="[A-Za-z0-9._-]+"
                onChange={(e) => setOperator(e.target.value)}
              />
            </label>

            <label>
              Note
              <textarea
                value={noteContent}
                maxLength={4000}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter incident notes here..."
                rows={4}
              />
            </label>

            <button
              type="submit"
              className="event-action-button"
              disabled={noteMutation.isPending || !noteContent.trim()}
            >
              <Send size={15} aria-hidden="true" />
              Post Note
            </button>
          </form>
        </Card>

        <Card title="Timeline of Changes">
          {timelineQuery.isPending ? (
            <LoadingState message="Loading timeline..." />
          ) : timelineQuery.isError ? (
            <ErrorState
              message={messageFrom(timelineQuery.error)}
              onRetry={() => void timelineQuery.refetch()}
            />
          ) : sortedTimeline.length === 0 ? (
            <p className="data-table__empty">No events recorded yet.</p>
          ) : (
            <ul className="incident-timeline">
              {sortedTimeline.map((event) => (
                <li key={event.id} className="timeline-entry">
                  <div className="timeline-marker">
                    <Clock size={16} aria-hidden="true" />
                  </div>
                  <div className="timeline-content">
                    <p className="timeline-description">
                      {describeEventType(event)}
                    </p>
                    <time className="timeline-time">
                      {formatTimestamp(event.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
