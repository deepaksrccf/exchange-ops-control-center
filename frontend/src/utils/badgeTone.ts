export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export function severityTone(severity: string): BadgeTone {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
      return "danger";
    case "HIGH":
      return "warning";
    case "MEDIUM":
      return "info";
    default:
      return "neutral";
  }
}

export function statusTone(status: string): BadgeTone {
  switch (status.toUpperCase()) {
    case "RESOLVED":
    case "CLOSED":
    case "OPEN":
      return status.toUpperCase() === "OPEN" ? "danger" : "success";
    case "ACKNOWLEDGED":
    case "INVESTIGATING":
    case "MONITORING":
    case "DEGRADED":
      return "warning";
    default:
      return "neutral";
  }
}
