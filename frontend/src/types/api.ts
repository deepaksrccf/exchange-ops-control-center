export type VenueStatus = "OPEN" | "CLOSED" | "DEGRADED" | "MAINTENANCE";

export type AlertSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export type IncidentStatus =
  "OPEN" | "INVESTIGATING" | "MONITORING" | "RESOLVED" | "CLOSED";

export interface Venue {
  id: string;
  code: string;
  name: string;
  status: VenueStatus;
}

export interface AlertSummary {
  id: string;
  title: string;
  severity: AlertSeverity;
  status: AlertStatus;
  detectedAt: string;
  assignedTo: string | null;
}

export interface IncidentSummary {
  id: string;
  incidentNumber: string;
  title: string;
  severity: AlertSeverity;
  status: IncidentStatus;
  owner: string | null;
  createdAt: string;
}

export interface MetricsSummary {
  activeAlerts: number;
  unacknowledgedCriticalAlerts: number;
  openIncidents: number;
  eventsProcessed: number;
  averageProcessingLatencyMs: number;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
