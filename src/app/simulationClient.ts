import { validateConfig } from "../simulation/config";
import type { Command, Reply, View } from "../worker/protocol";
export function acceptView(
  active: { generation: number; runId: number; seq: number },
  r: Pick<Reply, "workerGeneration" | "runId" | "observationSeq">,
) {
  return (
    r.workerGeneration === active.generation &&
    r.runId === active.runId &&
    r.observationSeq >= active.seq
  );
}
export class SimulationClient {
  private worker: Worker;
  private command = 0;
  private active = { generation: 1, runId: 1, seq: 0 };
  private pending = false;
  private pendingCommand: number | undefined;
  private superseding = false;
  private queuedCharts: boolean | undefined;
  private queuedSpeed: 1 | 4 | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;
  private crashed = false;
  private replacement:
    | {
        commandId: number;
        prior: { generation: number; runId: number; seq: number };
      }
    | undefined;
  constructor(
    private receive: (v: View) => void,
    private failure: (s: string, fatal?: boolean) => void,
    chartsEnabled = false,
  ) {
    this.worker = this.spawn();
    this.send("INITIALIZE", { seed: 42 });
    if (chartsEnabled) this.send("SET_CHARTS", { enabled: true });
  }
  private spawn() {
    const worker = new Worker(
      new URL("../worker/simulation.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.onmessage = (e) => this.onReply(e.data as Reply);
    worker.onerror = () => {
      if (this.disposed) return;
      this.crashed = true;
      worker.terminate();
      clearTimeout(this.timer);
      this.pending = false;
      this.failure(
        "Simulation worker stopped. Restart to compute a fresh baseline; previous summary may be unavailable.",
        true,
      );
    };
    return worker;
  }
  private onReply(r: Reply) {
    if (this.disposed || this.crashed || r.protocolVersion !== 2) return;
    if (
      r.type === "ERROR" &&
      this.replacement &&
      r.commandId === this.replacement.commandId &&
      r.runId === this.replacement.prior.runId &&
      r.workerGeneration === this.active.generation
    ) {
      this.active = { ...this.replacement.prior, seq: r.observationSeq };
      this.replacement = undefined;
      this.pending = false;
      this.superseding = false;
      clearTimeout(this.timer);
      this.failure(
        r.message || "Replacement rejected; previous run preserved.",
      );
      return;
    }
    if (!acceptView(this.active, r)) return;
    this.active.seq = r.observationSeq;
    if (r.type === "ERROR") {
      if (r.code === "WORKER_FAILED" || r.code === "MODEL_LIMIT") {
        this.crashed = true;
        this.worker.terminate();
      }
      this.pending = false;
      this.superseding = false;
      clearTimeout(this.timer);
      this.failure(
        r.message || "Worker error",
        r.code === "WORKER_FAILED" || r.code === "MODEL_LIMIT",
      );
      return;
    }
    if ((r.type === "ACK" || r.type === "FINISHED") && r.commandId === this.pendingCommand) {
      if (r.phase === "settled") {
        this.pending = false;
        this.superseding = false;
        this.replacement = undefined;
        clearTimeout(this.timer);
      } else clearTimeout(this.timer);
    }
    if (r.view) this.receive(r.view);
    if (!this.pending && this.queuedCharts !== undefined) {
      const enabled = this.queuedCharts;
      this.queuedCharts = undefined;
      this.send("SET_CHARTS", { enabled });
    }
    if (!this.pending && this.queuedSpeed !== undefined) {
      const speed = this.queuedSpeed;
      this.queuedSpeed = undefined;
      this.send("SET_SPEED", { speed });
    }
    if (r.type === "PROGRESS")
      this.worker.postMessage({
        protocolVersion: 2,
        workerGeneration: this.active.generation,
        commandId: ++this.command,
        runId: this.active.runId,
        type: "PROGRESS_APPLIED",
        observationSeq: r.observationSeq,
      });
  }
  send(type: Command["type"], payload: Record<string, unknown> = {}) {
    if (this.crashed || this.disposed) return;
    if (type === "REPLACE" && payload.config) {
      try {
        validateConfig(payload.config as View["config"]);
      } catch (e) {
        this.failure(String(e));
        return;
      }
    }
    if (this.pending) {
      if (type === "SET_CHARTS") {
        this.queuedCharts = payload.enabled as boolean;
        return;
      }
      if (type === "SET_SPEED") {
        this.queuedSpeed = payload.speed as 1 | 4;
        return;
      }
      if (!["REPLACE", "CANCEL"].includes(type) || this.superseding) return;
      this.superseding = true;
    }
    const old = this.active.runId;
    const prior = { ...this.active };
    const commandId = ++this.command;
    this.pendingCommand = commandId;
    if (type === "REPLACE" || type === "ADVANCE_STAGE") {
      this.replacement = { commandId, prior };
      this.active.runId = old + 1;
      this.active.seq = 0;
      payload = { ...payload, newRunId: this.active.runId };
    }
    this.pending = true;
    clearTimeout(this.timer);
    this.worker.postMessage({
      protocolVersion: 2,
      workerGeneration: this.active.generation,
      commandId,
      runId: old,
      type,
      ...payload,
    });
    if (["PAUSE", "CANCEL", "REPLACE"].includes(type))
      this.timer = setTimeout(() => {
        this.failure(
          "Worker did not acknowledge within 250 ms. Restart is available; old results are discarded.",
          true,
        );
        this.crashed = true;
        this.worker.terminate();
        this.pending = false;
      }, 250);
  }
  dispose() {
    this.disposed = true;
    clearTimeout(this.timer);
    this.worker.terminate();
  }
}
