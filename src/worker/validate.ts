import type { Command, Predictions } from "./protocol";
import { validateConfig } from "../simulation/config";
const types = [
  "INITIALIZE",
  "RUN",
  "PAUSE",
  "STEP",
  "SET_CHARTS",
  "SET_SPEED",
  "REPLACE",
  "ADVANCE_STAGE",
  "COMPARE",
  "CANCEL",
  "PROGRESS_APPLIED",
];
export function validPredictions(v: unknown): v is Predictions {
  if (!v || typeof v !== "object") return false;
  const p = v as Predictions;
  if (Object.keys(p).length !== 3) return false;
  return [p.throughput, p.latency, p.queue].every((x) =>
    ["increase", "same", "decrease"].includes(x),
  );
}
export function validateCommand(v: unknown): Command {
  if (!v || typeof v !== "object")
    throw Error("INVALID_MESSAGE: expected command");
  const c = v as Command;
  const allowed = new Set([
    "protocolVersion",
    "workerGeneration",
    "commandId",
    "runId",
    "type",
    "seed",
    "speed",
    "enabled",
    "execution",
    "newRunId",
    "reason",
    "config",
    "stage",
    "remedy",
    "predictions",
    "observationSeq",
  ]);
  if (Array.isArray(v) || Object.keys(v).some((k) => !allowed.has(k)))
    throw Error("INVALID_MESSAGE: unknown fields");
  if (c.protocolVersion !== 2)
    throw Error("UNSUPPORTED_VERSION: protocol must be 2");
  if (
    ![c.workerGeneration, c.commandId, c.runId].every(
      (x) => Number.isSafeInteger(x) && x >= 0,
    ) ||
    !types.includes(c.type)
  )
    throw Error("INVALID_MESSAGE: invalid identity or command");
  if (c.execution !== undefined && !["paused", "fast", "playback"].includes(c.execution))
    throw Error("INVALID_MESSAGE: invalid execution style");
  if (c.type === "RUN" && c.execution === "paused")
    throw Error("INVALID_MESSAGE: Run needs fast or playback style");
  if (c.type === "SET_CHARTS" && typeof c.enabled !== "boolean")
    throw Error("INVALID_MESSAGE: chart selection must be boolean");
  if (c.type === "SET_SPEED" && c.speed !== 1 && c.speed !== 4)
    throw Error("INVALID_MESSAGE: speed must be 1 or 4");
  if (
    c.type === "INITIALIZE" &&
    (!Number.isInteger(c.seed) || c.seed! < 0 || c.seed! > 4294967295)
  )
    throw Error("INVALID_CONFIG: invalid seed");
  if (
    ["REPLACE", "ADVANCE_STAGE"].includes(c.type) &&
    (!Number.isSafeInteger(c.newRunId) || c.newRunId! <= c.runId)
  )
    throw Error("INVALID_MESSAGE: replacement needs a new increasing run ID");
  if (
    c.type === "REPLACE" &&
    !["reset", "replay", "apply", "sandbox", "guided"].includes(c.reason!)
  )
    throw Error("INVALID_MESSAGE: invalid replacement intent");
  if (c.type === "REPLACE" && c.reason === "apply" && !c.config)
    throw Error("INVALID_MESSAGE: apply requires a configuration");
  if (c.config) validateConfig(c.config);
  if (
    c.stage !== undefined &&
    (!Number.isInteger(c.stage) || c.stage < 1 || c.stage > 5)
  )
    throw Error("INVALID_MESSAGE: stage must be 1–5");
  if (c.predictions !== undefined && !validPredictions(c.predictions))
    throw Error("INVALID_MESSAGE: invalid prediction choices");
  if (
    c.type === "PROGRESS_APPLIED" &&
    (!Number.isSafeInteger(c.observationSeq) || c.observationSeq! < 0)
  )
    throw Error("INVALID_MESSAGE: invalid progress sequence");
  if (
    c.type === "ADVANCE_STAGE" &&
    c.stage === 5 &&
    c.remedy !== undefined &&
    !["cache", "fast"].includes(c.remedy)
  )
    throw Error("INVALID_MESSAGE: invalid remedy");
  return c;
}
