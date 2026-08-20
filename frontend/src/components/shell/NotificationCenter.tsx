import { useEffect, useRef, useState } from "react";
import { Bell, ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";

import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useRealtimeStore } from "../../store/realtimeStore";
import type { AlertSeverity } from "../../types/alerts";
import { severityTone } from "../../utils/badgeTone";
import { formatTimestamp } from "../../utils/formatters";
import { Badge } from "../ui/Badge";

type SeverityGroup = "Critical" | "Warning" | "Info";

function severityGroup(severity: AlertSeverity): SeverityGroup {
  if (severity === "CRITICAL" || severity === "HIGH") {
    return "Critical";
  }

  if (severity === "MEDIUM") {
    return "Warning";
  }

  return "Info";
}

const groupOrder: SeverityGroup[] = ["Critical", "Warning", "Info"];

/**
 * Notification center: replaces the previous unlimited toast stack with a
 * bounded, dismissible panel (max five, enforced by the realtime store) that
 * never covers primary navigation.
 */
export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const notifications = useRealtimeStore((state) => state.notifications);
  const dismissNotification = useRealtimeStore(
    (state) => state.dismissNotification,
  );
  const clearNotifications = useRealtimeStore(
    (state) => state.clearNotifications,
  );

  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  const grouped = new Map<SeverityGroup, typeof notifications>();

  for (const notification of notifications) {
    const group = severityGroup(notification.alert.severity);
    const existing = grouped.get(group) ?? [];
    existing.push(notification);
    grouped.set(group, existing);
  }

  const viewAlert = (notificationId: string) => {
    dismissNotification(notificationId);
    setOpen(false);
  };

  return (
    <div className="notification-center">
      <button
        ref={buttonRef}
        type="button"
        className="icon-button notification-center__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Live alert notifications (${notifications.length} unread)`}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={18} aria-hidden="true" />

        {notifications.length > 0 && (
          <span className="notification-center__badge" aria-hidden="true">
            {notifications.length}
          </span>
        )}
      </button>

      <span className="sr-only" role="status" aria-live="polite">
        {notifications.length > 0
          ? `${notifications.length} live alert notification${
              notifications.length === 1 ? "" : "s"
            } unread`
          : "No live alert notifications"}
      </span>

      {open && (
        <div
          ref={panelRef}
          className="notification-center__panel"
          role="dialog"
          aria-modal="true"
          aria-label="Live alert notifications"
        >
          <header className="notification-center__panel-header">
            <h2>Live Alerts</h2>

            {notifications.length > 0 && (
              <button
                type="button"
                className="event-action-button"
                onClick={clearNotifications}
              >
                Dismiss all
              </button>
            )}
          </header>

          {notifications.length === 0 ? (
            <p className="notification-center__empty">
              No live alert notifications.
            </p>
          ) : (
            groupOrder
              .filter((group) => (grouped.get(group)?.length ?? 0) > 0)
              .map((group) => (
                <section
                  key={group}
                  className="notification-center__group"
                  aria-label={`${group} alerts`}
                >
                  <h3>{group}</h3>

                  <ul>
                    {grouped.get(group)!.map((notification) => {
                      const alert = notification.alert;

                      return (
                        <li
                          key={notification.notificationId}
                          className="notification-center__item"
                        >
                          <div className="notification-center__item-header">
                            <Badge tone={severityTone(alert.severity)}>
                              {alert.severity}
                            </Badge>

                            <button
                              type="button"
                              className="notification-center__dismiss"
                              aria-label={`Dismiss alert ${alert.title}`}
                              onClick={() =>
                                dismissNotification(notification.notificationId)
                              }
                            >
                              <X size={14} aria-hidden="true" />
                            </button>
                          </div>

                          <p className="notification-center__title">
                            {alert.title}
                          </p>

                          <p className="notification-center__meta">
                            {alert.venueCode} · {alert.symbolTicker} ·{" "}
                            {formatTimestamp(notification.receivedAt)}
                          </p>

                          <Link
                            to={`/alerts/${alert.id}`}
                            onClick={() =>
                              viewAlert(notification.notificationId)
                            }
                          >
                            View alert
                            <ExternalLink size={13} aria-hidden="true" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
          )}
        </div>
      )}
    </div>
  );
}
