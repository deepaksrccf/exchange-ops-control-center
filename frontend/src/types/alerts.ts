export type AlertSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AlertStatus =
  "OPEN" | "ACKNOWLEDGED" | "ESCALATED" | "RESOLVED" | "SUPPRESSED";

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
  assignedTo?: string;
}

export interface AcknowledgeAlertRequest {
  operator: string;
}
