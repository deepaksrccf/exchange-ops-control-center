import { AlertTriangle, ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "../ui/Badge";
import { useRealtimeStore } from "../../store/realtimeStore";
import type { AlertSeverity } from "../../types/alerts";

function severityTone(
  severity: AlertSeverity,
): "danger" | "warning" | "info" | "neutral" {
  switch (severity) {
    case "CRITICAL":
    case "HIGH":
      return "danger";
    case "MEDIUM":
      return "warning";
    case "LOW":
      return "info";
    default:
      return "neutral";
  }
}

export function LiveAlertNotifications() {
  const notifications = useRealtimeStore((state) => state.notifications);
  const dismissNotification = useRealtimeStore(
    (state) => state.dismissNotification,
  );

  if (notifications.length === 0) {
    return null;
  }

  return (
    <aside
      className="live-alert-stack"
      aria-label="Live alert notifications"
      aria-live="polite"
    >
      {notifications.map((notification) => {
        const alert = notification.alert;

        return (
          <article
            key={notification.notificationId}
            className="live-alert-notification"
          >
            <header>
              <div className="live-alert-notification__title">
                <AlertTriangle size={18} aria-hidden="true" />

                <span>Live synthetic alert</span>
              </div>

              <button
                type="button"
                className="live-alert-dismiss"
                aria-label={`Dismiss alert ${alert.title}`}
                onClick={() => dismissNotification(notification.notificationId)}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </header>

            <div className="live-alert-notification__badges">
              <Badge tone={severityTone(alert.severity)}>
                {alert.severity}
              </Badge>

              <span>{alert.venueCode}</span>
              <span>{alert.symbolTicker}</span>
            </div>

            <h2>{alert.title}</h2>
            <p>{alert.explanation}</p>

            <Link
              to={`/alerts/${alert.id}`}
              onClick={() => dismissNotification(notification.notificationId)}
            >
              View alert
              <ExternalLink size={14} aria-hidden="true" />
            </Link>
          </article>
        );
      })}
    </aside>
  );
}
