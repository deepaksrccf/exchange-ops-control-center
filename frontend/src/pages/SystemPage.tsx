import { RadioTower, RefreshCw, Unplug } from "lucide-react";
import { useState } from "react";

import { apiBaseUrl } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { LoadingState } from "../components/ui/LoadingState";
import { Tabs } from "../components/ui/Tabs";
import { GeneratorControlPanel } from "../components/realtime/GeneratorControlPanel";
import { useApiHealth, useVenues } from "../hooks/useOperationsQueries";
import { useRealtimeStore } from "../store/realtimeStore";
import { useThemeStore } from "../store/themeStore";
import { statusTone } from "../utils/badgeTone";
import { formatTimestamp } from "../utils/formatters";

export function SystemPage() {
  const healthQuery = useApiHealth();
  const venuesQuery = useVenues();
  const realtime = useRealtimeStore();
  const theme = useThemeStore((state) => state.theme);
  const [diagnosticFeedback, setDiagnosticFeedback] = useState("");

  if (healthQuery.isPending || venuesQuery.isPending) {
    return <LoadingState message="Checking system status..." />;
  }

  const apiHealthy = healthQuery.data === true;
  const venues = venuesQuery.data ?? [];

  const copyDiagnosticSummary = async () => {
    const summary = [
      "Exchange Operations Control Center diagnostics",
      `Generated: ${new Date().toISOString()}`,
      `Data classification: Synthetic portfolio data only`,
      `API base path: ${apiBaseUrl}`,
      `API status: ${apiHealthy ? "AVAILABLE" : "UNAVAILABLE"}`,
      `Realtime feed: ${realtime.state}`,
      `Last live update: ${realtime.lastMessageAt ?? "none"}`,
      `Theme: ${theme}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setDiagnosticFeedback("Diagnostic summary copied to clipboard.");
    } catch {
      setDiagnosticFeedback("Unable to copy to clipboard in this browser.");
    }
  };

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">System Administration</p>
          <h1>System Status</h1>
          <p>Review backend connectivity, simulation, and diagnostics.</p>
        </div>
      </header>

      <Tabs
        label="System status sections"
        tabs={[
          {
            id: "environment",
            label: "Environment",
            content: (
              <Card title="Environment">
                <dl className="definition-list">
                  <div>
                    <dt>Data classification</dt>
                    <dd>Synthetic portfolio data only</dd>
                  </div>
                  <div>
                    <dt>Live exchange connectivity</dt>
                    <dd>Not connected; no real market data is used</dd>
                  </div>
                  <div>
                    <dt>Frontend build mode</dt>
                    <dd>{import.meta.env.MODE}</dd>
                  </div>
                  <div>
                    <dt>API base path</dt>
                    <dd>{apiBaseUrl}</dd>
                  </div>
                  <div>
                    <dt>Current theme</dt>
                    <dd>{theme}</dd>
                  </div>
                </dl>
              </Card>
            ),
          },
          {
            id: "connections",
            label: "Connections",
            content: (
              <>
                <Card title="API Connectivity">
                  <div className="system-status-row">
                    <div>
                      <strong>Spring Boot API</strong>
                      <p>
                        {apiHealthy
                          ? "The frontend can reach the backend."
                          : "The frontend cannot reach the backend."}
                      </p>
                    </div>

                    <Badge tone={apiHealthy ? "success" : "danger"}>
                      {apiHealthy ? "AVAILABLE" : "UNAVAILABLE"}
                    </Badge>
                  </div>
                </Card>

                <Card
                  title="Realtime Feed"
                  action={
                    <button
                      type="button"
                      className="event-action-button"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw size={16} aria-hidden="true" />
                      Reload connection
                    </button>
                  }
                >
                  <div className="system-status-row">
                    <div>
                      <strong>STOMP over WebSocket</strong>
                      <p>
                        Endpoint <code>/ws</code>. Subscribed to{" "}
                        <code>/topic/events</code>, <code>/topic/alerts</code>,
                        and <code>/topic/metrics</code>.
                      </p>
                      <p>
                        Last message:{" "}
                        {realtime.lastMessageAt
                          ? formatTimestamp(realtime.lastMessageAt)
                          : "No messages received yet"}
                      </p>
                    </div>

                    <Badge
                      tone={
                        realtime.state === "CONNECTED" ? "success" : "warning"
                      }
                    >
                      {realtime.state === "CONNECTED" ? (
                        <RadioTower size={13} aria-hidden="true" />
                      ) : (
                        <Unplug size={13} aria-hidden="true" />
                      )}{" "}
                      {realtime.state}
                    </Badge>
                  </div>
                </Card>

                <Card title="Venue Status">
                  <div className="venue-grid">
                    {venues.map((venue) => (
                      <article key={venue.id} className="venue-card">
                        <div>
                          <strong>{venue.code}</strong>
                          <span>{venue.name}</span>
                        </div>

                        <Badge tone={statusTone(venue.status)}>
                          {venue.status}
                        </Badge>
                      </article>
                    ))}
                  </div>
                </Card>
              </>
            ),
          },
          {
            id: "simulation",
            label: "Simulation",
            content: <GeneratorControlPanel />,
          },
          {
            id: "diagnostics",
            label: "Diagnostics",
            content: (
              <Card title="Diagnostics">
                <div className="alert-header-actions">
                  <button
                    type="button"
                    className="event-action-button"
                    onClick={() => void healthQuery.refetch()}
                  >
                    <RefreshCw size={16} aria-hidden="true" />
                    Refresh health
                  </button>

                  <button
                    type="button"
                    className="event-action-button"
                    onClick={() => void copyDiagnosticSummary()}
                  >
                    Copy safe diagnostic summary
                  </button>
                </div>

                <p className="supporting-message">
                  The diagnostic summary contains only synthetic-environment
                  status fields. It never includes secrets, credentials, or a
                  raw environment dump.
                </p>

                {diagnosticFeedback && (
                  <p className="operation-feedback" role="status">
                    {diagnosticFeedback}
                  </p>
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
