export type GeneratorState = "STOPPED" | "RUNNING" | "PAUSED";

export interface GeneratorStatus {
  state: GeneratorState;
  generatedCount: number;
  lastSequenceNumber: number;
  intervalMs: number;
  eventsPerCycle: number;
  syntheticDataOnly: boolean;
  timestamp: string;
}
