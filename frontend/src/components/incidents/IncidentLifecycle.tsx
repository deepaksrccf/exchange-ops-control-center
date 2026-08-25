import { Check } from "lucide-react";

import type { IncidentStatus } from "../../types/incidents";

const stages: IncidentStatus[] = [
  "OPEN",
  "INVESTIGATING",
  "MITIGATED",
  "RESOLVED",
  "CLOSED",
];

interface IncidentLifecycleProps {
  status: IncidentStatus;
}

/** Visual lifecycle progression: OPEN -> INVESTIGATING -> MITIGATED -> RESOLVED -> CLOSED. */
export function IncidentLifecycle({ status }: IncidentLifecycleProps) {
  const currentIndex = stages.indexOf(status);

  return (
    <ol className="incident-lifecycle" aria-label="Incident lifecycle stage">
      {stages.map((stage, index) => {
        const state =
          index < currentIndex
            ? "complete"
            : index === currentIndex
              ? "current"
              : "upcoming";

        return (
          <li
            key={stage}
            className={`incident-lifecycle__stage incident-lifecycle__stage--${state}`}
            aria-current={state === "current" ? "step" : undefined}
          >
            <span className="incident-lifecycle__marker" aria-hidden="true">
              {state === "complete" ? <Check size={13} /> : index + 1}
            </span>
            <span>{stage}</span>
          </li>
        );
      })}
    </ol>
  );
}
