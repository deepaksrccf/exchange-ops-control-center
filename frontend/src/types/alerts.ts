export type AlertSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AlertStatus =
  "OPEN" | "ACKNOWLEDGED" | "ESCALATED" | "RESOLVED" | "SUPPRESSED";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  ruleType: string;
  eventId: string;
  venueId: string;
  venueCode: string;
  symbolId: string;
  symbolTicker: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  explanation: string;
  assignedTo?: string;
  incidentId?: string;
  detectedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface AlertPage {
  content: Alert[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface AlertQueryParameters {
  page: number;
  size: number;
  sort: string;
  status?: AlertStatus;
  severity?: AlertSeverity;
  venueId?: string;
  symbolId?: string;
  ruleId?: string;
  assignedTo?: string;
}

export interface AcknowledgeAlertRequest {
  operator: string;
}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  severity: IncidentSeverity;
  owner?: string;
  createdBy: string;
}

export interface CreatedIncident {
  id: string;
  incidentNumber?: string;
  alertId?: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  status: string;
  owner?: string;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
}
