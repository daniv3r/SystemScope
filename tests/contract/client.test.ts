import { expect, test } from "vitest";
import { acceptView } from "../../src/app/simulationClient";
test("rejects old generations, runs, and same-run observations", () => {
  const active = { generation: 2, runId: 7, seq: 30 };
  expect(
    acceptView(active, { workerGeneration: 1, runId: 7, observationSeq: 40 }),
  ).toBe(false);
  expect(
    acceptView(active, { workerGeneration: 2, runId: 6, observationSeq: 40 }),
  ).toBe(false);
  expect(
    acceptView(active, { workerGeneration: 2, runId: 7, observationSeq: 29 }),
  ).toBe(false);
  expect(
    acceptView(active, { workerGeneration: 2, runId: 7, observationSeq: 31 }),
  ).toBe(true);
});

import { vi, afterEach } from "vitest";
import { SimulationClient } from "../../src/app/simulationClient";
import type { Reply } from "../../src/worker/protocol";
afterEach(() => vi.unstubAllGlobals());
test("rejected replacement restores the active identity and allows later commands", () => {
  class FakeWorker {
    static latest: FakeWorker;
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: (() => void) | null = null;
    messages: unknown[] = [];
    constructor() {
      FakeWorker.latest = this;
    }
    postMessage(m: unknown) {
      this.messages.push(m);
    }
    terminate() {}
    emit(r: Reply) {
      this.onmessage?.({ data: r } as MessageEvent);
    }
  }
  vi.stubGlobal("Worker", FakeWorker);
  const error = vi.fn();
  const c = new SimulationClient(() => {}, error);
  const w = FakeWorker.latest;
  const base: Reply = {
    protocolVersion: 2,
    workerGeneration: 1,
    commandId: 1,
    runId: 1,
    observationSeq: 1,
    acceptedTimeQ: 50000,
    type: "ACK",
    phase: "settled",
    view: null,
  };
  w.emit(base);
  c.send("ADVANCE_STAGE", { stage: 3 });
  w.emit({
    ...base,
    type: "ERROR",
    commandId: 2,
    observationSeq: 2,
    code: "INVALID_TRANSITION",
    message: "Finish current stage",
  });
  expect(error).toHaveBeenCalledWith("Finish current stage");
  c.send("STEP");
  expect(w.messages.at(-1)).toMatchObject({ type: "STEP", runId: 1 });
  c.dispose();
});

test("chart intents coalesce while busy and stale replies cannot restore hidden history", () => {
  class FakeWorker {
    static latest: FakeWorker;
    onmessage: ((e: MessageEvent) => void) | null = null;
    messages: Record<string, unknown>[] = [];
    constructor() { FakeWorker.latest = this; }
    postMessage(m: Record<string, unknown>) { this.messages.push(m); }
    terminate() {}
  }
  vi.stubGlobal("Worker", FakeWorker);
  const receive = vi.fn();
  const client = new SimulationClient(receive, vi.fn(), true);
  const worker = FakeWorker.latest;
  client.send("SET_CHARTS", {enabled:false});
  const reply: Reply = {protocolVersion:2, workerGeneration:1,runId:1,observationSeq:1,acceptedTimeQ:600000,commandId:1,type:"ACK",phase:"settled",view:null};
  worker.onmessage?.({data:reply} as MessageEvent);
  expect(worker.messages.at(-1)).toMatchObject({type:"SET_CHARTS",enabled:false,protocolVersion:2});
  client.send("SET_SPEED", {speed:4});
  worker.onmessage?.({data:{...reply,type:"FINISHED",observationSeq:2}} as MessageEvent);
  expect(worker.messages.at(-1)?.type).toBe("SET_CHARTS");
  worker.onmessage?.({data:{...reply,commandId:2,observationSeq:3}} as MessageEvent);
  expect(worker.messages.at(-1)).toMatchObject({type:"SET_SPEED",speed:4});
  worker.onmessage?.({data:{...reply,runId:0,observationSeq:99}} as MessageEvent);
  expect(receive).not.toHaveBeenCalled();
  client.dispose();
});
