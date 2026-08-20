import { Radio } from "lucide-react";

import { useRealtimeStore } from "../../store/realtimeStore";

const labels = {
  CONNECTING: "Live connecting",
  CONNECTED: "Live connected",
  RECONNECTING: "Live reconnecting",
  DISCONNECTED: "Live disconnected",
  ERROR: "Live connection error",
} as const;

export function RealtimeIndicator() {
  const connectionState = useRealtimeStore((state) => state.connectionState);
  const receivedEventCount = useRealtimeStore(
    (state) => state.receivedEventCount,
  );

  return (
    <div className="realtime-indicator" role="status" aria-live="polite">
      <Radio size={15} aria-hidden="true" />
      <span>{labels[connectionState]}</span>
      <span aria-label={`${receivedEventCount} events received`}>
        {receivedEventCount}
      </span>
    </div>
  );
}
