export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export function severityTone(severity: string): BadgeTone {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
    case "SEV1":
      return "danger";
    case "HIGH":
    case "SEV2":
      return "warning";
    case "MEDIUM":
    case "SEV3":
      return "info";
    case "SEV4":
    case "LOW":
    case "INFO":
      return "neutral";
    default:
      return "neutral";
  }
}

export function statusTone(status: string): BadgeTone {
  switch (status.toUpperCase()) {
    case "RESOLVED":
    case "CLOSED":
      return "success";
    case "OPEN":
      return "danger";
    case "ACKNOWLEDGED":
    case "INVESTIGATING":
    case "MONITORING":
    case "MITIGATED":
    case "DEGRADED":
      return "warning";
    default:
      return "neutral";
  }
}
