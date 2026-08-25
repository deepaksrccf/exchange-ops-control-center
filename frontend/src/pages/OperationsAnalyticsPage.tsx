import {
  Activity,
  AlertTriangle,
  Clock3,
  RefreshCw,
  Siren,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card } from "../components/ui/Card";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { MetricCard } from "../components/ui/MetricCard";
import { useAnalyticsQueries } from "../hooks/useAnalyticsQueries";

const palette = [
  "#5daeff",
  "#42cf94",
  "#f2bd52",
  "#ff6b7d",
  "#9b8cff",
  "#62d6e8",
];

function countValues(values: string[]): Array<{ name: string; value: number }> {
  const results = new Map<string, number>();

  for (const value of values) {
    results.set(value, (results.get(value) ?? 0) + 1);
  }

  return [...results.entries()]
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((left, right) => right.value - left.value);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function messageFrom(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unable to load analytics data.";
}

function datasetLabel(loadedCount: number, totalElements?: number): string {
  if (totalElements === undefined || loadedCount >= totalElements) {
    return `Complete dataset: ${loadedCount} record${loadedCount === 1 ? "" : "s"}.`;
  }

  return `Loaded sample: ${loadedCount} of ${totalElements} records.`;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: {
      name?: string;
    };
  }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const entry = payload[0];

  return (
    <div className="analytics-tooltip">
      <strong>{entry?.payload?.name ?? entry?.name}</strong>
      <span>{entry?.value ?? 0}</span>
    </div>
  );
}

export function OperationsAnalyticsPage() {
  const queries = useAnalyticsQueries();

  const [venueFilter, setVenueFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [incidentStatusFilter, setIncidentStatusFilter] = useState("");

  const isLoading =
    queries.events.isPending ||
    queries.alerts.isPending ||
    queries.incidents.isPending;

  if (isLoading) {
    return <LoadingState message="Loading operational analytics..." />;
  }

  const firstError =
    queries.events.error ?? queries.alerts.error ?? queries.incidents.error;

  if (firstError) {
    return (
      <ErrorState
        message={messageFrom(firstError)}
        onRetry={() => {
          void queries.events.refetch();
          void queries.alerts.refetch();
          void queries.incidents.refetch();
        }}
      />
    );
  }

  const events = queries.events.data?.content ?? [];
  const alerts = queries.alerts.data?.content ?? [];
  const incidents = queries.incidents.data?.content ?? [];

  const venueOptions = [
    ...new Set(events.map((event) => event.venueCode)),
  ].sort();
  const eventTypeOptions = [
    ...new Set(events.map((event) => event.eventType)),
  ].sort();

  const filteredEvents = events.filter(
    (event) =>
      (!venueFilter || event.venueCode === venueFilter) &&
      (!eventTypeFilter || event.eventType === eventTypeFilter),
  );

  const filteredAlerts = alerts.filter(
    (alert) => !severityFilter || alert.severity === severityFilter,
  );

  const filteredIncidents = incidents.filter(
    (incident) =>
      !incidentStatusFilter || incident.status === incidentStatusFilter,
  );

  const eventTypeData = countValues(
    filteredEvents.map((event) => event.eventType),
  );

  const venueData = countValues(filteredEvents.map((event) => event.venueCode));

  const alertSeverityData = countValues(
    filteredAlerts.map((alert) => alert.severity),
  );

  const incidentStatusData = countValues(
    filteredIncidents.map((incident) => incident.status),
  );

  const averageLatency = average(
    filteredEvents.map((event) => event.processingLatencyMs),
  );

  const highLatencyEvents = filteredEvents.filter(
    (event) => event.processingLatencyMs >= 100,
  ).length;

  const activeAlerts = filteredAlerts.filter(
    (alert) =>
      alert.status === "OPEN" ||
      alert.status === "ACKNOWLEDGED" ||
      alert.status === "ESCALATED",
  ).length;

  const openIncidents = filteredIncidents.filter(
    (incident) =>
      incident.status !== "RESOLVED" && incident.status !== "CLOSED",
  ).length;

  const refreshing =
    queries.events.isFetching ||
    queries.alerts.isFetching ||
    queries.incidents.isFetching;

  const refresh = async () => {
    await Promise.all([
      queries.events.refetch(),
      queries.alerts.refetch(),
      queries.incidents.refetch(),
    ]);
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Operational Intelligence</p>
          <h1>Operations Analytics</h1>
          <p>
            Analyze the latest loaded sample of synthetic events, alerts, and
            incidents. Charts do not represent real exchange activity.
          </p>
        </div>

        <button
          type="button"
          className="event-action-button"
          disabled={refreshing}
          onClick={() => void refresh()}
        >
          <RefreshCw
            size={17}
            aria-hidden="true"
            className={refreshing ? "icon-spinning" : undefined}
          />
          {refreshing ? "Refreshing" : "Refresh analytics"}
        </button>
      </header>

      <Card title="Filters">
        <div className="alert-filter-grid">
          <label>
            Venue
            <select
              value={venueFilter}
              onChange={(event) => setVenueFilter(event.target.value)}
            >
              <option value="">All venues</option>
              {venueOptions.map((venue) => (
                <option key={venue} value={venue}>
                  {venue}
                </option>
              ))}
            </select>
          </label>

          <label>
            Event type
            <select
              value={eventTypeFilter}
              onChange={(event) => setEventTypeFilter(event.target.value)}
            >
              <option value="">All event types</option>
              {eventTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            Alert severity
            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
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
            Incident status
            <select
              value={incidentStatusFilter}
              onChange={(event) => setIncidentStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="MITIGATED">Mitigated</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </label>

          <button
            type="button"
            className="event-action-button"
            onClick={() => {
              setVenueFilter("");
              setEventTypeFilter("");
              setSeverityFilter("");
              setIncidentStatusFilter("");
            }}
          >
            Reset filters
          </button>
        </div>
      </Card>

      <section
        className="analytics-metric-grid"
        aria-label="Loaded operational sample metrics"
      >
        <MetricCard
          label="Events Loaded"
          value={events.length}
          detail={`of ${
            queries.events.data?.totalElements ?? events.length
          } available`}
        />

        <MetricCard
          label="Average Latency"
          value={`${averageLatency.toFixed(1)} ms`}
          detail="Loaded event sample"
          tone={averageLatency >= 100 ? "danger" : "default"}
        />

        <MetricCard
          label="High-Latency Events"
          value={highLatencyEvents}
          detail="100 ms or greater"
          tone={highLatencyEvents > 0 ? "warning" : "success"}
        />

        <MetricCard
          label="Active Alerts"
          value={activeAlerts}
          detail={`From ${alerts.length} loaded alerts`}
          tone={activeAlerts > 0 ? "warning" : "success"}
        />

        <MetricCard
          label="Open Incidents"
          value={openIncidents}
          detail={`From ${incidents.length} loaded incidents`}
          tone={openIncidents > 0 ? "danger" : "success"}
        />
      </section>

      <div className="analytics-grid">
        <Card title="Events by Type">
          <p className="analytics-scope-note">
            {datasetLabel(
              filteredEvents.length,
              queries.events.data?.totalElements,
            )}
          </p>

          <div
            className="analytics-chart"
            role="img"
            aria-label="Bar chart showing loaded events by type"
          >
            {eventTypeData.length === 0 ? (
              <p className="analytics-empty">No event records are available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={eventTypeData}
                  margin={{
                    top: 10,
                    right: 12,
                    bottom: 5,
                    left: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} width={38} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="value"
                    name="Events"
                    fill="#5daeff"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Events by Synthetic Venue">
          <p className="analytics-scope-note">
            {datasetLabel(
              filteredEvents.length,
              queries.events.data?.totalElements,
            )}
          </p>

          <div
            className="analytics-chart"
            role="img"
            aria-label="Bar chart showing loaded events by fictional venue"
          >
            {venueData.length === 0 ? (
              <p className="analytics-empty">No venue records are available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={venueData}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 18,
                    bottom: 5,
                    left: 8,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="value"
                    name="Events"
                    fill="#42cf94"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Alert Severity">
          <p className="analytics-scope-note">
            {datasetLabel(
              filteredAlerts.length,
              queries.alerts.data?.totalElements,
            )}
          </p>

          <div
            className="analytics-chart"
            role="img"
            aria-label="Donut chart showing loaded alerts by severity"
          >
            {alertSeverityData.length === 0 ? (
              <p className="analytics-empty">No alert records are available.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertSeverityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={96}
                    paddingAngle={2}
                  >
                    {alertSeverityData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={palette[index % palette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Incident Status">
          <p className="analytics-scope-note">
            {datasetLabel(
              filteredIncidents.length,
              queries.incidents.data?.totalElements,
            )}
          </p>

          <div
            className="analytics-chart"
            role="img"
            aria-label="Donut chart showing loaded incidents by status"
          >
            {incidentStatusData.length === 0 ? (
              <p className="analytics-empty">
                No incident records are available.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incidentStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={96}
                    paddingAngle={2}
                  >
                    {incidentStatusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={palette[(index + 2) % palette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card title="Analytics Scope">
        <div className="analytics-scope">
          <article>
            <Activity size={19} aria-hidden="true" />
            <div>
              <strong>Event sample</strong>
              <span>
                Latest {events.length} of{" "}
                {queries.events.data?.totalElements ?? events.length}
              </span>
            </div>
          </article>

          <article>
            <AlertTriangle size={19} aria-hidden="true" />
            <div>
              <strong>Alert sample</strong>
              <span>
                Latest {alerts.length} of{" "}
                {queries.alerts.data?.totalElements ?? alerts.length}
              </span>
            </div>
          </article>

          <article>
            <Siren size={19} aria-hidden="true" />
            <div>
              <strong>Incident sample</strong>
              <span>
                Latest {incidents.length} of{" "}
                {queries.incidents.data?.totalElements ?? incidents.length}
              </span>
            </div>
          </article>

          <article>
            <Clock3 size={19} aria-hidden="true" />
            <div>
              <strong>Latency threshold</strong>
              <span>High latency is defined as 100 ms or more.</span>
            </div>
          </article>
        </div>
      </Card>
    </div>
  );
}
