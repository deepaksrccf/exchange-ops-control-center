import {
  CirclePause,
  CirclePlay,
  RefreshCw,
  RotateCcw,
  Square,
} from "lucide-react";
import { useState } from "react";

import { getApiErrorMessage } from "../../api/errors";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import {
  useGeneratorAction,
  useGeneratorStatus,
} from "../../hooks/useGenerator";
import type { GeneratorState } from "../../types/generator";

const numberFormatter = new Intl.NumberFormat("en-US");

function stateTone(state: GeneratorState): "success" | "warning" | "neutral" {
  switch (state) {
    case "RUNNING":
      return "success";
    case "PAUSED":
      return "warning";
    default:
      return "neutral";
  }
}

function messageFrom(error: unknown): string {
  return getApiErrorMessage(
    error,
    "The generator action could not be completed.",
  );
}

export function GeneratorControlPanel() {
  const statusQuery = useGeneratorStatus();
  const actionMutation = useGeneratorAction();
  const [feedback, setFeedback] = useState("");

  if (statusQuery.isPending) {
    return (
      <Card title="Synthetic Event Generator">
        <div className="generator-loading" role="status">
          <RefreshCw className="icon-spinning" size={18} aria-hidden="true" />
          Loading generator status
        </div>
      </Card>
    );
  }

  if (statusQuery.isError || !statusQuery.data) {
    return (
      <Card title="Synthetic Event Generator">
        <div className="generator-error" role="alert">
          <p>{messageFrom(statusQuery.error)}</p>

          <button
            type="button"
            className="event-action-button"
            onClick={() => void statusQuery.refetch()}
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  const status = statusQuery.data;

  const perform = (action: "start" | "pause" | "resume" | "stop") => {
    setFeedback("");

    actionMutation.mutate(action, {
      onSuccess: (updated) => {
        setFeedback(`Generator is now ${updated.state.toLowerCase()}.`);
      },
      onError: (error) => {
        setFeedback(messageFrom(error));
      },
    });
  };

  return (
    <Card title="Synthetic Event Generator">
      <div className="generator-panel">
        <div className="generator-panel__status">
          <div>
            <p className="page__eyebrow">Phase 2 Live Simulation</p>

            <div className="generator-panel__heading">
              <h3>Generator Status</h3>

              <Badge tone={stateTone(status.state)}>{status.state}</Badge>
            </div>

            <p>
              Generates fictional market events, persists them to PostgreSQL,
              and broadcasts them through STOMP.
            </p>
          </div>

          <div className="generator-panel__actions">
            {status.state === "STOPPED" && (
              <button
                type="button"
                className="primary-action-button"
                disabled={actionMutation.isPending}
                onClick={() => perform("start")}
              >
                <CirclePlay size={17} aria-hidden="true" />
                Start
              </button>
            )}

            {status.state === "RUNNING" && (
              <button
                type="button"
                className="event-action-button"
                disabled={actionMutation.isPending}
                onClick={() => perform("pause")}
              >
                <CirclePause size={17} aria-hidden="true" />
                Pause
              </button>
            )}

            {status.state === "PAUSED" && (
              <button
                type="button"
                className="primary-action-button"
                disabled={actionMutation.isPending}
                onClick={() => perform("resume")}
              >
                <RotateCcw size={17} aria-hidden="true" />
                Resume
              </button>
            )}

            {status.state !== "STOPPED" && (
              <button
                type="button"
                className="event-action-button"
                disabled={actionMutation.isPending}
                onClick={() => perform("stop")}
              >
                <Square size={16} aria-hidden="true" />
                Stop
              </button>
            )}
          </div>
        </div>

        <dl className="generator-stat-grid">
          <div>
            <dt>Generated this run</dt>
            <dd>{numberFormatter.format(status.generatedCount)}</dd>
          </div>

          <div>
            <dt>Last sequence</dt>
            <dd>{numberFormatter.format(status.lastSequenceNumber)}</dd>
          </div>

          <div>
            <dt>Interval</dt>
            <dd>{numberFormatter.format(status.intervalMs)} ms</dd>
          </div>

          <div>
            <dt>Events per cycle</dt>
            <dd>{status.eventsPerCycle}</dd>
          </div>

          <div>
            <dt>Data classification</dt>
            <dd>{status.syntheticDataOnly ? "Synthetic only" : "Unknown"}</dd>
          </div>
        </dl>

        {feedback && (
          <p className="operation-feedback" role="status">
            {feedback}
          </p>
        )}
      </div>
    </Card>
  );
}
