import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { LoadingState } from "../components/ui/LoadingState";
import { useApiHealth, useVenues } from "../hooks/useOperationsQueries";
import { statusTone } from "../utils/badgeTone";
import { GeneratorControlPanel } from "../components/realtime/GeneratorControlPanel";

export function SystemPage() {
  const healthQuery = useApiHealth();
  const venuesQuery = useVenues();

  if (healthQuery.isPending || venuesQuery.isPending) {
    return <LoadingState message="Checking system status..." />;
  }

  const apiHealthy = healthQuery.data === true;
  const venues = venuesQuery.data ?? [];

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">System Administration</p>
          <h1>System Status</h1>
          <p>Review backend connectivity and synthetic venue status.</p>
        </div>
      </header>

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

      <GeneratorControlPanel />

      <Card title="Environment">
        <dl className="definition-list">
          <div>
            <dt>Data classification</dt>
            <dd>Synthetic portfolio data</dd>
          </div>
          <div>
            <dt>Live exchange connectivity</dt>
            <dd>Not connected</dd>
          </div>
          <div>
            <dt>Market-event streaming</dt>
            <dd>Planned for Phase 2</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
