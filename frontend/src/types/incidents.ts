// Incident Status - represents the lifecycle state
export type IncidentStatus =
  "OPEN" | "INVESTIGATING" | "MITIGATED" | "RESOLVED" | "CLOSED";

// Incident Severity - operational impact level
export type IncidentSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";

// Timeline event types
export type IncidentEventType =
  | "CREATED"
  | "STATUS_CHANGED"
  | "SEVERITY_CHANGED"
  | "OWNER_ASSIGNED"
  | "NOTE_ADDED"
  | "RESOLVED";

/**
 * Core incident data structure
 * Immutable fields: id, incidentNumber, alertId, createdAt
 */
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

/**
 * Immutable note attached to an incident
 */
export interface IncidentNote {
  id: string;
  incidentId: string;
  author: string;
  content: string;
  createdAt: string;
}

/**
 * Immutable timeline entry documenting incident state changes
 */
export interface IncidentEvent {
  id: string;
  incidentId: string;
  eventType: IncidentEventType;
  actor: string;
  description: string;
  createdAt: string;
}

/**
 * Paginated response for incident list queries
 */
export interface IncidentPage {
  content: Incident[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/**
 * Query parameters for listing and filtering incidents
 * All filter parameters are optional; omitted = include all
 */
export interface IncidentQueryParameters {
  page: number;
  size: number;
  sort: string; // e.g., "createdAt,desc"
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  owner?: string;
  search?: string; // text search on title/description
}

/**
 * Partial update request for incident properties
 * Null/omitted fields are left unchanged
 * actor is required (who is making the change)
 */
export interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  owner?: string;
  resolutionSummary?: string;
  actor: string; // Required; operator identifier (e.g., "ops.deepak")
}

/**
 * Request to append a note to an incident
 */
export interface CreateIncidentNoteRequest {
  author: string; // Required; operator identifier (e.g., "ops.deepak")
  content: string; // Required; note text (max 4000 chars)
}
