import { Link } from "react-router-dom";

import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { MetricCard } from "../components/ui/MetricCard";
import {
  useMetricsSummary,
  useRecentAlerts,
  useRecentIncidents,
  useVenues,
} from "../hooks/useOperationsQueries";
import type { AlertSummary, IncidentSummary } from "../types/api";
import { severityTone, statusTone } from "../utils/badgeTone";
import {
  formatLatency,
  formatNumber,
  formatTimestamp,
} from "../utils/formatters";

const alertColumns: DataTableColumn<AlertSummary>[] = [
  {
    id: "severity",
    header: "Severity",
    render: (alert) => (
      <Badge tone={severityTone(alert.severity)}>{alert.severity}</Badge>
    ),
  },
  {
    id: "title",
    header: "Alert",
    render: (alert) => <Link to={`/alerts/${alert.id}`}>{alert.title}</Link>,
  },
  {
    id: "status",
    header: "Status",
    render: (alert) => (
      <Badge tone={statusTone(alert.status)}>{alert.status}</Badge>
    ),
  },
  {
    id: "detected",
    header: "Detected",
    render: (alert) => formatTimestamp(alert.detectedAt),
  },
];

const incidentColumns: DataTableColumn<IncidentSummary>[] = [
  {
    id: "number",
    header: "Incident",
    render: (incident) => (
      <Link to={`/incidents/${incident.id}`}>{incident.incidentNumber}</Link>
    ),
  },
  {
    id: "title",
    header: "Title",
    render: (incident) => incident.title,
  },
  {
    id: "severity",
    header: "Severity",
    render: (incident) => (
      <Badge tone={severityTone(incident.severity)}>{incident.severity}</Badge>
    ),
  },
  {
    id: "status",
    header: "Status",
    render: (incident) => (
      <Badge tone={statusTone(incident.status)}>{incident.status}</Badge>
    ),
  },
];

export function OperationsOverviewPage() {
  const metricsQuery = useMetricsSummary();
  const venuesQuery = useVenues();
  const alertsQuery = useRecentAlerts();
  const incidentsQuery = useRecentIncidents();

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
        message={
          firstError instanceof Error
            ? firstError.message
            : "Unable to load operations data."
        }
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

      <section className="metrics-grid" aria-label="Operational metrics">
        <MetricCard
          label="Active Alerts"
          value={formatNumber(metrics.activeAlerts)}
          tone={metrics.activeAlerts > 0 ? "warning" : "success"}
        />

        <MetricCard
          label="Critical Unacknowledged"
          value={formatNumber(metrics.unacknowledgedCriticalAlerts)}
          tone={metrics.unacknowledgedCriticalAlerts > 0 ? "danger" : "success"}
        />

        <MetricCard
          label="Open Incidents"
          value={formatNumber(metrics.openIncidents)}
          tone={metrics.openIncidents > 0 ? "warning" : "success"}
        />

        <MetricCard
          label="Events Processed"
          value={formatNumber(metrics.eventsProcessed)}
        />

        <MetricCard
          label="Average Latency"
          value={formatLatency(metrics.averageProcessingLatencyMs)}
        />

        <MetricCard
          label="Venues Monitored"
          value={formatNumber(venues.length)}
        />
      </section>

      <div className="dashboard-grid">
        <Card title="Recent Alerts" action={<Link to="/alerts">View all</Link>}>
          <DataTable
            caption="Recent operational alerts"
            columns={alertColumns}
            rows={alerts}
            getRowKey={(alert) => alert.id}
            emptyMessage="No recent alerts."
          />
        </Card>

        <Card
          title="Recent Incidents"
          action={<Link to="/incidents">View all</Link>}
        >
          <DataTable
            caption="Recent operational incidents"
            columns={incidentColumns}
            rows={incidents}
            getRowKey={(incident) => incident.id}
            emptyMessage="No recent incidents."
          />
        </Card>
      </div>

      <Card title="Venue Status">
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
    </div>
  );
}
