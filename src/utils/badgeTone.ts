export type BadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

export function severityTone(severity: string): BadgeTone {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 'danger'
    case 'HIGH':
      return 'warning'
    case 'MEDIUM':
      return 'info'
    default:
      return 'neutral'
  }
}

export function statusTone(status: string): BadgeTone {
  switch (status.toUpperCase()) {
    case 'RESOLVED':
    case 'CLOSED':
      return 'success'
    case 'OPEN':
      return 'danger'
    case 'ACKNOWLEDGED':
    case 'INVESTIGATING':
    case 'MONITORING':
      return 'warning'
    default:
      return 'neutral'
  }
}
