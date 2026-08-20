import { Radio, RadioTower, Unplug } from "lucide-react";

import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";

function label(state: string): string {
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

export function RealtimeIndicator() {
  const realtime = useRealtimeEvents();
  const connected = realtime.state === "CONNECTED";

  return (
    <div
      className={[
        "realtime-indicator",
        connected
          ? "realtime-indicator--connected"
          : "realtime-indicator--disconnected",
      ].join(" ")}
      role="status"
      aria-live="polite"
      title={realtime.errorMessage}
    >
      {connected ? (
        <RadioTower size={15} aria-hidden="true" />
      ) : realtime.state === "CONNECTING" ||
        realtime.state === "RECONNECTING" ? (
        <Radio size={15} aria-hidden="true" className="icon-pulsing" />
      ) : (
        <Unplug size={15} aria-hidden="true" />
      )}

      <span>{label(realtime.state)}</span>

      <span className="realtime-count" title="Live events received">
        E {realtime.receivedEventCount}
      </span>

      <span
        className="realtime-count realtime-count--alert"
        title="Live alerts received"
      >
        A {realtime.receivedAlertCount}
      </span>

      <span
        className="realtime-count realtime-count--metrics"
        title="Live metrics updates received"
      >
        M {realtime.receivedMetricsCount}
      </span>
    </div>
  );
}
