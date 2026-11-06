import { compare, explain } from "../lesson/evaluate";
import { stageConfig } from "../lesson/stages";
import { config, offered } from "../simulation/config";
import {
  createModel,
  advance,
  observe,
  assertInvariants,
} from "../simulation/model";
import type { Model } from "../simulation/model";
import { validateCommand, validPredictions } from "./validate";
import type {
  Command,
  Reply,
  Status,
  Summary,
  View,
  Predictions,
  Comparison,
} from "./protocol";
export class Controller {
  model: Model | null = null;
  runId = 1;
  generation = 1;
  stage = 1;
  mode: "guided" | "sandbox" = "sandbox";
  status: Status = "initializing";
  speed: 1 | 4 = 1;
  executionStyle: "fast" | "playback" = "fast";
  chartsEnabled = false;
  seq = 0;
  last: Summary | null = null;
  references = new Map<number, Summary>();
  predictions: Predictions | undefined;
  comparison: Comparison | null = null;
  outstanding: number | null = null;
  lastCommand = -1;
  cached: Reply | null = null;
  lastPayload = "";
  initialCommand: number | undefined;
  lagging = false;
  constructor(private send: (r: Reply) => void) {}
  get initializing() {
    return this.status === "initializing";
  }
  view(): View {
    const current = this.summary(this.status);
    return {
      config: this.model!.config,
      observation: current.observation,
      ...(this.chartsEnabled ? { history: this.model!.charts } : {}),
      chartsEnabled: this.chartsEnabled,
      executionStyle: this.executionStyle,
      status: this.status,
      stage: this.stage,
      mode: this.mode,
      speed: this.speed,
      last: this.last,
      reference:
        this.mode === "guided"
          ? (this.references.get(this.stage - 1) ?? this.last)
          : this.last,
      comparison: compare(
        current,
        this.mode === "guided"
          ? (this.references.get(this.stage - 1) ?? this.last)
          : this.last,
        this.predictions,
      ),
      lagging: this.lagging,
      insight: explain(current),
    };
  }
  private emit(
    type: Reply["type"],
    commandId?: number,
    phase: Reply["phase"] = "settled",
    include = true,
    code?: string,
    message?: string,
  ) {
    const r: Reply = {
      protocolVersion: 2,
      workerGeneration: this.generation,
      runId: this.runId,
      observationSeq: ++this.seq,
      acceptedTimeQ: this.model?.now ?? 0,
      type,
      phase,
      commandId,
      view: include && this.model ? this.view() : null,
      code,
      message,
    };
    if (type === "PROGRESS") this.outstanding = r.observationSeq;
    else if (type !== "ERROR") {
      this.outstanding = null;
    }
    if (commandId !== undefined && commandId === this.lastCommand &&
        code !== "STALE_COMMAND" && code !== "STALE_RUN")
      this.cached = r;
    this.send(r);
  }
  summary(reason: string): Summary {
    return {
      config: { ...this.model!.config },
      observation: observe(this.model!),
      partial: this.model!.now < this.model!.config.duration,
      reason,
    };
  }
  handle(raw: unknown) {
    let c: Command;
    try {
      c = validateCommand(raw);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.emit(
        "ERROR",
        undefined,
        "settled",
        false,
        message.split(":")[0],
        message,
      );
      return;
    }
    if (c.type === "INITIALIZE" && !this.model) {
      this.generation = c.workerGeneration;
      this.runId = c.runId;
      this.lastCommand = c.commandId;
      this.lastPayload = JSON.stringify(c);
      this.model = createModel(config({ seed: c.seed }));
      this.initialCommand = c.commandId;
      this.emit("ACK", c.commandId, "accepted", false);
      return;
    }
    if (c.workerGeneration !== this.generation || c.runId !== this.runId) {
      this.emit(
        "ERROR",
        c.commandId,
        "settled",
        false,
        "STALE_RUN",
        "This run is no longer active.",
      );
      return;
    }
    if (c.type === "PROGRESS_APPLIED") {
      if (c.observationSeq === this.outstanding) this.outstanding = null;
      return;
    }
    if (
      c.commandId === this.lastCommand &&
      JSON.stringify(c) === this.lastPayload
    ) {
      if (this.cached) this.send(this.cached);
      return;
    }
    if (c.commandId <= this.lastCommand) {
      this.emit(
        "ERROR",
        c.commandId,
        "settled",
        false,
        "STALE_COMMAND",
        "Command has already been superseded.",
      );
      return;
    }
    try {
      this.lastCommand = c.commandId;
      this.lastPayload = JSON.stringify(c);
      if (!this.model) throw Error("INVALID_TRANSITION: no initialized model");
      if (c.type === "REPLACE") {
        const old = this.model;
        let cfg = old.config;
        let init = false;
        let mode = this.mode;
        let stage = this.stage;
        let clearReferences = false;
        let execution = c.execution ?? "paused";
        if (c.reason === "guided" || (c.reason === "reset" && mode === "guided")) {
          cfg = config({ seed: old.config.seed, duration: 250000 });
          stage = 1;
          mode = "guided";
          clearReferences = true;
          init = true;
          execution = "paused";
        } else if (c.reason === "reset") {
          cfg = config({ seed: old.config.seed });
          clearReferences = true;
          init = true;
          execution = "fast";
        } else if (c.reason === "sandbox") {
          cfg = config({ ...old.config, rps: offered(old.config, old.now), spike: false, duration: 600000 });
          mode = "sandbox";
          clearReferences = true;
          execution = "paused";
        } else if (c.reason === "apply") {
          cfg = config(c.config);
          stage = c.stage ?? stage;
          if (cfg.duration !== (mode === "sandbox" ? 600000 : 250000) || (mode === "sandbox" && cfg.spike))
            throw Error("INVALID_CONFIG: endpoint/schedule must match mode");
          if (mode === "guided" && cfg.seed !== old.config.seed) {
            cfg = config({ seed: cfg.seed, duration: 250000 });
            stage = 1;
            clearReferences = true;
            init = true;
          }
        }
        if (mode === "guided" && execution !== "paused")
          throw Error("INVALID_TRANSITION: guided replacement must await predictions");
        // Validate and construct before committing a replacement identity.
        const replacement = createModel(cfg);
        this.last = this.summary(c.reason!);
        this.runId = c.newRunId!;
        this.seq = 0;
        this.outstanding = null;
        this.predictions = undefined;
        this.comparison = null;
        this.mode = mode;
        this.stage = stage;
        if (clearReferences) this.references.clear();
        this.executionStyle = execution === "paused"
          ? (mode === "guided" ? "playback" : this.executionStyle)
          : execution;
        this.lagging = false;
        this.status = init ? "initializing" : execution === "paused" ? "paused" : "running";
        this.emit("ACK", c.commandId, "accepted", false);
        this.model = replacement;
        this.initialCommand = init ? c.commandId : undefined;
        if (!init) this.emit("ACK", c.commandId);
        return;
      }
      if (c.type === "ADVANCE_STAGE") {
        if (
          this.mode !== "guided" ||
          this.status !== "finished" ||
          c.stage !== this.stage + 1 ||
          c.stage! > 5
        )
          throw Error("INVALID_TRANSITION: finish the current stage first");
        this.last = this.summary("next stage");
        this.stage = c.stage!;
        this.runId = c.newRunId!;
        this.seq = 0;
        this.model = createModel(
          stageConfig(this.stage, this.model.config.seed, c.remedy),
        );
        this.status = "paused";
        this.executionStyle = "playback";
        this.predictions = undefined;
        this.outstanding = null;
        this.emit("ACK", c.commandId);
        return;
      }
      if (c.type === "COMPARE") {
        this.emit("COMPARISON", c.commandId);
        return;
      }
      if (c.type === "SET_CHARTS") {
        this.chartsEnabled = c.enabled!;
        this.emit("ACK", c.commandId);
        return;
      }
      if (c.type === "SET_SPEED") {
        this.speed = c.speed!;
        this.emit("ACK", c.commandId);
        return;
      }
      if (c.type === "PAUSE" || c.type === "CANCEL") {
        if (this.initializing && c.type === "PAUSE")
          throw Error("INVALID_TRANSITION: baseline is initializing");
        this.status =
          c.type === "CANCEL"
            ? "cancelled"
            : this.status === "finished"
              ? "finished"
              : "paused";
        this.initialCommand = undefined;
        this.emit("ACK", c.commandId);
        return;
      }
      if (c.type === "RUN" || c.type === "STEP") {
        if (!["paused"].includes(this.status))
          throw Error("INVALID_TRANSITION: pause or replay before executing");
        if (
          this.mode === "guided" &&
          this.stage > 1 &&
          !validPredictions(c.predictions ?? this.predictions)
        )
          throw Error("PREDICTION_REQUIRED: choose all three predictions");
        if (this.mode === "guided" && c.execution === "fast")
          throw Error("INVALID_TRANSITION: guided Run uses playback");
        this.predictions = c.predictions ?? this.predictions;
        if (c.type === "RUN") {
          this.executionStyle = c.execution === "fast" ? "fast" : "playback";
          this.status = "running";
          this.emit("ACK", c.commandId);
        } else {
          this.model = advance(this.model);
          assertInvariants(this.model);
          if (this.model.now === this.model.config.duration) {
            this.status = "finished";
            if (this.mode === "guided") this.references.set(this.stage, this.summary("finished"));
            this.emit("FINISHED", c.commandId);
          } else this.emit("ACK", c.commandId);
        }
        return;
      }
      throw Error("INVALID_TRANSITION: command unavailable in this state");
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      const code = message.split(":")[0];
      this.emit("ERROR", c.commandId, "settled", false, code, message);
    }
  }
  tick(publish = true) {
    if (!this.model || !["running", "initializing"].includes(this.status))
      return;
    try {
      this.model = advance(this.model);
      assertInvariants(this.model);
      if (this.initializing) {
        const target = this.mode === "guided" ? 50000 : this.model.config.duration;
        if (this.model.now >= target) {
          this.status = this.mode === "guided" ? "paused" : "finished";
          this.emit("ACK", this.initialCommand);
          if (this.status === "finished") this.emit("FINISHED", this.initialCommand);
          this.initialCommand = undefined;
        }
        return;
      }
      if (this.model.now >= this.model.config.duration) {
        this.status = "finished";
        if (this.mode === "guided") this.references.set(this.stage, this.summary("finished"));
        this.emit("FINISHED");
      } else if (publish && this.outstanding === null) this.emit("PROGRESS");
    } catch (e) {
      this.status = "failed";
      this.emit(
        "ERROR",
        undefined,
        "settled",
        false,
        "WORKER_FAILED",
        String(e),
      );
    }
  }
}
