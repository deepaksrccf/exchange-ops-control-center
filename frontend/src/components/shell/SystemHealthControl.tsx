import { useEffect, useRef, useState } from "react";
import { Radio, RadioTower, ServerCog, Unplug } from "lucide-react";

import { useApiHealth } from "../../hooks/useOperationsQueries";
import { useGeneratorStatus } from "../../hooks/useGenerator";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useRealtimeStore } from "../../store/realtimeStore";
import { formatTimestamp } from "../../utils/formatters";
import { Badge } from "../ui/Badge";
import type { BadgeTone } from "../../utils/badgeTone";
import type { RealtimeConnectionState } from "../../realtime/types";

function realtimeLabel(state: RealtimeConnectionState): string {
  switch (state) {
    case "CONNECTED":
      return "Live connected";
    case "CONNECTING":
      return "Live connecting";
    case "RECONNECTING":
      return "Live reconnecting";
    case "ERROR":
      return "Live connection error";
    default:
      return "Live disconnected";
  }
}

function realtimeTone(state: RealtimeConnectionState): BadgeTone {
  switch (state) {
    case "CONNECTED":
      return "success";
    case "CONNECTING":
    case "RECONNECTING":
      return "warning";
    case "ERROR":
      return "danger";
    default:
      return "neutral";
  }
}

/**
 * Unified system-health control: combines API, STOMP, generator, and live
 * counters into a single trigger with an accessible details popover, so the
 * same status is never rendered in more than one place.
 */
export function SystemHealthControl() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const healthQuery = useApiHealth();
  const generatorQuery = useGeneratorStatus();
  const realtime = useRealtimeStore();

  useFocusTrap(popoverRef, open);

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
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
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

  const apiHealthy = healthQuery.data === true;
  const apiPending = healthQuery.isPending;
  const generatorState = generatorQuery.data?.state;

  let overallTone: BadgeTone = "success";
  let overallLabel = "All systems normal";

  if (apiPending) {
    overallTone = "neutral";
    overallLabel = "Checking systems";
  } else if (!apiHealthy) {
    overallTone = "danger";
    overallLabel = "API unavailable";
  } else if (realtime.state === "ERROR") {
    overallTone = "danger";
    overallLabel = "Live connection error";
  } else if (
    realtime.state === "CONNECTING" ||
    realtime.state === "RECONNECTING"
  ) {
    overallTone = "warning";
    overallLabel = realtimeLabel(realtime.state);
  } else if (generatorState === "PAUSED") {
    overallTone = "warning";
    overallLabel = "Generator paused";
  }

  const statusDotClass =
    overallTone === "success"
      ? "status-dot status-dot--healthy"
      : overallTone === "danger"
        ? "status-dot status-dot--unhealthy"
        : "status-dot status-dot--warning";

  return (
    <div className="system-health">
      <button
        ref={buttonRef}
        type="button"
        className="system-health__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        role="status"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={statusDotClass} aria-hidden="true" />
        <span>{overallLabel}</span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="system-health__popover"
          role="dialog"
          aria-modal="true"
          aria-label="System health details"
        >
          <header className="system-health__popover-header">
            <ServerCog size={16} aria-hidden="true" />
            <h2>System Health</h2>
          </header>

          <dl className="system-health__list">
            <div>
              <dt>API</dt>
              <dd>
                <Badge tone={apiHealthy ? "success" : "danger"}>
                  {apiPending
                    ? "Checking"
                    : apiHealthy
                      ? "Connected"
                      : "Unavailable"}
                </Badge>
              </dd>
            </div>

            <div>
              <dt>Realtime feed</dt>
              <dd className="system-health__realtime">
                {realtime.state === "CONNECTED" ? (
                  <RadioTower size={14} aria-hidden="true" />
                ) : realtime.state === "CONNECTING" ||
                  realtime.state === "RECONNECTING" ? (
                  <Radio
                    size={14}
                    aria-hidden="true"
                    className="icon-pulsing"
                  />
                ) : (
                  <Unplug size={14} aria-hidden="true" />
                )}
                <Badge tone={realtimeTone(realtime.state)}>
                  {realtimeLabel(realtime.state)}
                </Badge>
              </dd>
            </div>

            <div>
              <dt>Generator</dt>
              <dd>
                {generatorQuery.data ? (
                  <Badge
                    tone={
                      generatorQuery.data.state === "RUNNING"
                        ? "success"
                        : generatorQuery.data.state === "PAUSED"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {generatorQuery.data.state}
                  </Badge>
                ) : (
                  <Badge tone="neutral">Unknown</Badge>
                )}
              </dd>
            </div>

            <div>
              <dt>Last live update</dt>
              <dd>
                {realtime.lastMessageAt
                  ? formatTimestamp(realtime.lastMessageAt)
                  : "No live updates yet"}
              </dd>
            </div>

            <div>
              <dt>Events received</dt>
              <dd>{realtime.receivedEventCount}</dd>
            </div>

            <div>
              <dt>Alerts received</dt>
              <dd>{realtime.receivedAlertCount}</dd>
            </div>

            <div>
              <dt>Metrics updates received</dt>
              <dd>{realtime.receivedMetricsCount}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
