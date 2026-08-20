import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { MetricCard } from "../components/ui/MetricCard";
import { useAcknowledgeAlert } from "../hooks/useAlerts";
import {
  useMetricsSummary,
  useRecentAlerts,
  useRecentIncidents,
  useVenues,
} from "../hooks/useOperationsQueries";
import { useRealtimeStore } from "../store/realtimeStore";
import { statusTone } from "../utils/badgeTone";
import {
  formatLatency,
  formatNumber,
  formatTimestamp,
} from "../utils/formatters";

const latencyWarningThresholdMs = 100;
const acknowledgingOperator = "ops.deepak";
const sampleWindowMs = 5_000;
const maxSamples = 12;

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to load operations data.";
}

/** Rolling window of live event throughput observed since this page mounted. */
function useLiveThroughputSamples() {
  const receivedEventCount = useRealtimeStore(
    (state) => state.receivedEventCount,
  );
  const [samples, setSamples] = useState<
    Array<{ time: string; events: number }>
  >([]);

  useEffect(() => {
    let lastCount = receivedEventCount;

    const interval = window.setInterval(() => {
      setSamples((current) => {
        const delta = Math.max(0, receivedEventCount - lastCount);
        lastCount = receivedEventCount;

        const next = [
          ...current,
          {
            time: new Date().toLocaleTimeString("en-US", {
              minute: "2-digit",
              second: "2-digit",
            }),
            events: delta,
          },
        ];

        return next.length > maxSamples ? next.slice(-maxSamples) : next;
      });
    }, sampleWindowMs);

    return () => window.clearInterval(interval);
    // Sampling interval intentionally does not restart on every count change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return samples;
}

export function OperationsOverviewPage() {
  const metricsQuery = useMetricsSummary();
  const venuesQuery = useVenues();
  const alertsQuery = useRecentAlerts();
  const incidentsQuery = useRecentIncidents();
  const acknowledgeMutation = useAcknowledgeAlert();

  const realtime = useRealtimeStore();
  const throughputSamples = useLiveThroughputSamples();

  const [pageLoadedAt] = useState(() => new Date());
  const [acknowledgeFeedback, setAcknowledgeFeedback] = useState("");

  const isLoading =
    metricsQuery.isPending ||
    venuesQuery.isPending ||
    alertsQuery.isPending ||
    incidentsQuery.isPending;

  if (isLoading) {
    return <LoadingState message="Loading operations overview..." />;
  }

  const firstError =
    metricsQuery.error ??
    venuesQuery.error ??
    alertsQuery.error ??
    incidentsQuery.error;

  if (firstError) {
    return (
      <ErrorState
        message={errorMessage(firstError)}
        onRetry={() => {
          void metricsQuery.refetch();
          void venuesQuery.refetch();
          void alertsQuery.refetch();
          void incidentsQuery.refetch();
        }}
      />
    );
  }

  const metrics = metricsQuery.data;

  if (!metrics) {
    return <ErrorState message="The API returned no metrics summary." />;
  }

  const venues = venuesQuery.data ?? [];
  const alerts = alertsQuery.data ?? [];
  const incidents = incidentsQuery.data ?? [];

  const priorityAlerts = alerts
    .filter((alert) => alert.status === "OPEN")
    .slice(0, 5);

  const openIncidents = incidents.filter(
    (incident) =>
      incident.status !== "RESOLVED" && incident.status !== "CLOSED",
  );

  const activity = [
    ...alerts.map((alert) => ({
      id: `alert-${alert.id}`,
      kind: "Alert" as const,
      title: alert.title,
      status: alert.status as string,
      timestamp: alert.detectedAt,
      to: `/alerts/${alert.id}`,
    })),
    ...incidents.map((incident) => ({
      id: `incident-${incident.id}`,
      kind: "Incident" as const,
      title: `${incident.incidentNumber}: ${incident.title}`,
      status: incident.status as string,
      timestamp: incident.createdAt,
      to: `/incidents/${incident.id}`,
    })),
  ]
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() -
        new Date(left.timestamp).getTime(),
    )
    .slice(0, 8);

  const acknowledge = (alertId: string) => {
    setAcknowledgeFeedback("");

    acknowledgeMutation.mutate(
      {
        id: alertId,
        request: { operator: acknowledgingOperator },
      },
      {
        onSuccess: () => {
          setAcknowledgeFeedback("Alert acknowledged successfully.");
        },
        onError: (error) => {
          setAcknowledgeFeedback(errorMessage(error));
        },
      },
    );
  };

  const latencyTone: "danger" | "success" =
    metrics.averageProcessingLatencyMs >= latencyWarningThresholdMs
      ? "danger"
      : "success";

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Exchange Operations Control Center</p>
          <h1>Operations Overview</h1>
          <p>
            Monitor synthetic exchange events, operational alerts, incidents,
            latency, and fictional venue availability.
          </p>
        </div>
      </header>

      <section
        className="metrics-grid"
        aria-label="System health command strip"
      >
        <MetricCard
          label="System State"
          value={
            metrics.activeAlerts === 0 && metrics.openIncidents === 0
              ? "Nominal"
              : "Attention"
          }
          tone={
            metrics.activeAlerts === 0 && metrics.openIncidents === 0
              ? "success"
              : "warning"
          }
        />

        <MetricCard
          label="Events Processed"
          value={formatNumber(metrics.eventsProcessed)}
          detail="Synthetic activity, all time"
        />

        <MetricCard
          label="Active Alerts"
          value={formatNumber(metrics.activeAlerts)}
          tone={metrics.activeAlerts > 0 ? "warning" : "success"}
        />

        <MetricCard
          label="Open Incidents"
          value={formatNumber(metrics.openIncidents)}
          tone={metrics.openIncidents > 0 ? "warning" : "success"}
        />

        <MetricCard
          label="Average Latency"
          value={formatLatency(metrics.averageProcessingLatencyMs)}
          tone={latencyTone === "danger" ? "danger" : "default"}
        />

        <MetricCard
          label="Venue Availability"
          value={`${venues.filter((venue) => venue.status === "OPEN").length}/${venues.length}`}
          detail="Fictional venues open"
        />
      </section>

      <Card title="Live Operations">
        <p className="analytics-scope-note">
          Live since this page loaded at{" "}
          {formatTimestamp(pageLoadedAt.toISOString())}. Throughput samples are
          real live-feed arrivals, not historical data.
        </p>

        <div className="live-operations-grid">
          <div
            className="analytics-chart analytics-chart--compact"
            role="img"
            aria-label="Area chart of synthetic events received per five-second interval since page load"
          >
            {throughputSamples.length < 2 ? (
              <p className="analytics-empty">
                Waiting for live samples since page load...
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughputSamples}>
                  <XAxis dataKey="time" hide />
                  <YAxis width={28} allowDecimals={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#4ca6ff"
                    fill="rgba(76, 166, 255, 0.24)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <dl className="live-operations-stats">
            <div>
              <dt>Live feed</dt>
              <dd>
                <Badge
                  tone={realtime.state === "CONNECTED" ? "success" : "warning"}
                >
                  {realtime.state === "CONNECTED"
                    ? "Streaming"
                    : realtime.state}
                </Badge>
              </dd>
            </div>
            <div>
              <dt>Events since page load</dt>
              <dd>{realtime.receivedEventCount}</dd>
            </div>
            <div>
              <dt>Alerts since page load</dt>
              <dd>{realtime.receivedAlertCount}</dd>
            </div>
            <div>
              <dt>Average latency</dt>
              <dd>
                <Badge tone={latencyTone}>
                  {formatLatency(metrics.averageProcessingLatencyMs)}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      {acknowledgeFeedback && (
        <p className="operation-feedback" role="status">
          {acknowledgeFeedback}
        </p>
      )}

      <div className="dashboard-grid">
        <Card
          title="Priority Alerts"
          action={<Link to="/alerts">View all</Link>}
        >
          {priorityAlerts.length === 0 ? (
            <p className="analytics-empty">No open alerts require attention.</p>
          ) : (
            <ul className="priority-list">
              {priorityAlerts.map((alert) => (
                <li key={alert.id} className="priority-list__item">
                  <div>
                    <Badge tone={statusTone(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Link to={`/alerts/${alert.id}`}>{alert.title}</Link>
                    <span className="priority-list__meta">
                      Detected {formatTimestamp(alert.detectedAt)}
                    </span>
                  </div>

                  <div className="priority-list__actions">
                    <Link
                      className="table-action-button"
                      to={`/alerts/${alert.id}`}
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      className="table-action-button"
                      disabled={acknowledgeMutation.isPending}
                      onClick={() => acknowledge(alert.id)}
                    >
                      Acknowledge
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Open Incidents"
          action={<Link to="/incidents">View all</Link>}
        >
          {openIncidents.length === 0 ? (
            <p className="analytics-empty">No open incidents.</p>
          ) : (
            <ul className="priority-list">
              {openIncidents.map((incident) => (
                <li key={incident.id} className="priority-list__item">
                  <div>
                    <Badge tone={statusTone(incident.status)}>
                      {incident.status}
                    </Badge>
                    <Link to={`/incidents/${incident.id}`}>
                      {incident.incidentNumber}: {incident.title}
                    </Link>
                  </div>

                  <Link
                    className="table-action-button"
                    to={`/incidents/${incident.id}`}
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Venue Status">
        <p className="analytics-scope-note">
          All venues are fictional and simulated for this portfolio project.
        </p>

        <div className="venue-grid">
          {venues.map((venue) => (
            <article key={venue.id} className="venue-card">
              <div>
                <strong>{venue.code}</strong>
                <span>{venue.name}</span>
              </div>

              <Badge tone={statusTone(venue.status)}>{venue.status}</Badge>
            </article>
          ))}
        </div>
      </Card>

      <Card title="Recent Activity">
        <p className="analytics-scope-note">
          Derived from the {alerts.length} loaded recent alerts and{" "}
          {incidents.length} loaded recent incidents (API records, not a live
          stream).
        </p>

        {activity.length === 0 ? (
          <p className="analytics-empty">No recent activity.</p>
        ) : (
          <ol className="activity-feed">
            {activity.map((item) => (
              <li key={item.id} className="activity-feed__item">
                <span className="activity-feed__kind">{item.kind}</span>
                <Link to={item.to}>{item.title}</Link>
                <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                <time dateTime={item.timestamp}>
                  {formatTimestamp(item.timestamp)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
