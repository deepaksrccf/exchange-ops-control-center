export type IncidentStatus =
  "OPEN" | "INVESTIGATING" | "MITIGATED" | "RESOLVED" | "CLOSED";

export type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";

export type IncidentEventType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "SEVERITY_CHANGED"
  | "OWNER_ASSIGNED"
  | "NOTE_ADDED"
  | "RESOLVED";

export interface Incident {
  id: string;
  incidentNumber: string;
  alertId?: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  owner?: string;
  resolutionSummary?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface IncidentPage {
  content: Incident[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface IncidentQueryParameters {
  page: number;
  size: number;
  sort: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  owner?: string;
  search?: string;
}

export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  owner?: string;
  resolutionSummary?: string;
  actor: string;
}

export interface CreateIncidentNoteRequest {
  author: string;
  content: string;
}

export interface IncidentNote {
  id: string;
  incidentId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface IncidentEvent {
  id: string;
  incidentId: string;
  eventType: IncidentEventType;
  actor: string;
  description: string;
  createdAt: string;
}

/**
 * Compatibility alias for existing timeline consumers.
 */
export type IncidentTimelineEvent = IncidentEvent;
