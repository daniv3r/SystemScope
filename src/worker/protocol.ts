import type { Config } from "../simulation/config";
import type { Observation, ChartPoint } from "../simulation/observations";
export type Direction = "increase" | "same" | "decrease";
export interface Predictions {
  throughput: Direction;
  latency: Direction;
  queue: Direction;
}
export interface Summary {
  config: Config;
  observation: Observation;
  partial: boolean;
  reason: string;
}
export interface Comparison {
  title: string;
  rows: {
    name: string;
    unit: string;
    before: number | null;
    after: number | null;
    direction: Direction | null;
    prediction?: Direction;
    correct: boolean | null;
  }[];
  explanation: string;
}
export interface View {
  config: Config;
  observation: Observation;
  history?: ChartPoint[];
  chartsEnabled: boolean;
  executionStyle: "fast" | "playback";
  status: Status;
  stage: number;
  mode: "guided" | "sandbox";
  speed: 1 | 4;
  last: Summary | null;
  reference: Summary | null;
  comparison: Comparison | null;
  lagging: boolean;
  insight: string;
}
export type Status =
  "initializing" | "paused" | "running" | "finished" | "cancelled" | "failed";
export type CommandType =
  | "INITIALIZE"
  | "RUN"
  | "PAUSE"
  | "STEP"
  | "SET_CHARTS"
  | "SET_SPEED"
  | "REPLACE"
  | "ADVANCE_STAGE"
  | "COMPARE"
  | "CANCEL"
  | "PROGRESS_APPLIED";
export interface Command {
  protocolVersion: 2;
  workerGeneration: number;
  commandId: number;
  runId: number;
  type: CommandType;
  seed?: number;
  enabled?: boolean;
  execution?: "paused" | "fast" | "playback";
  speed?: 1 | 4;
  newRunId?: number;
  reason?: "reset" | "replay" | "apply" | "sandbox" | "guided";
  config?: Config;
  stage?: number;
  remedy?: "cache" | "fast";
  predictions?: Predictions;
  observationSeq?: number;
}
export interface Reply {
  protocolVersion: 2;
  workerGeneration: number;
  commandId?: number;
  runId: number;
  observationSeq: number;
  acceptedTimeQ: number;
  type: "ACK" | "PROGRESS" | "FINISHED" | "COMPARISON" | "ERROR";
  phase?: "accepted" | "settled";
  view: View | null;
  code?: string;
  message?: string;
}
