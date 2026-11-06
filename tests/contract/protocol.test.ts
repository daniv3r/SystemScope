import { expect, test } from "vitest";
import { Controller } from "../../src/worker/controller";
import { validateCommand } from "../../src/worker/validate";
import type { Reply, Command } from "../../src/worker/protocol";
function setup() {
  const replies: Reply[] = [];
  const c = new Controller((r) => replies.push(r));
  let id = 0;
  const send = (
    type: Command["type"],
    data: Record<string, unknown> = {},
    runId = c.runId,
  ) =>
    c.handle({
      protocolVersion: 2,
      workerGeneration: 1,
      commandId: ++id,
      runId,
      type,
      ...data,
    });
  send("INITIALIZE", { seed: 42 });
  while (c.initializing) c.tick();
  send("REPLACE", { newRunId: 2, reason: "guided" });
  while (c.initializing) c.tick();
  return { c, replies, send };
}
test("validates protocol, preserves state on invalid input, and pauses exactly", () => {
  expect(() => validateCommand({ type: "RUN" })).toThrow();
  const { c, send, replies } = setup();
  const before = c.model!.now;
  send("STEP");
  expect(c.model!.now).toBe(before + 100);
  send("RUN");
  c.tick();
  send("PAUSE");
  const frozen = c.model!.now;
  c.tick();
  expect(c.model!.now).toBe(frozen);
  send("RUN", {}, 999);
  expect(replies.at(-1)?.code).toBe("STALE_RUN");
  expect(c.model!.now).toBe(frozen);
});
test("replacement accepts before baseline readiness; stale results and credit cannot accumulate", () => {
  const { c, send, replies } = setup();
  send("RUN");
  for (let i = 0; i < 30; i++) c.tick();
  expect(replies.filter((r) => r.type === "PROGRESS")).toHaveLength(1);
  send("REPLACE", { newRunId: 3, reason: "reset" });
  expect(replies.at(-1)?.phase).toBe("accepted");
  expect(replies.at(-1)?.view).toBeNull();
  while (c.initializing) c.tick();
  expect(replies.at(-1)?.phase).toBe("settled");
  expect(c.runId).toBe(3);
  expect(c.model!.now).toBe(50000);
  expect(c.last?.partial).toBe(true);
});
test("guided predictions are required for Run and Step, terminal responses are reliable", () => {
  const { c, send, replies } = setup();
  send("REPLACE", {
    newRunId: 3,
    reason: "apply",
    stage: 2,
    config: { ...c.model!.config, spike: true },
  });
  send("STEP");
  expect(replies.at(-1)?.code).toBe("PREDICTION_REQUIRED");
  send("STEP", {
    predictions: {
      throughput: "increase",
      latency: "increase",
      queue: "increase",
    },
  });
  expect(c.model!.now).toBe(100);
  send("CANCEL");
  expect(c.status).toBe("cancelled");
});

test("Explore computes real completed baseline, fast/Watch equality, and optional chart history", () => {
  const replies: Reply[] = [];
  const c = new Controller(r => replies.push(r));
  let id = 0;
  const send = (type: string, data: Record<string, unknown> = {}) => c.handle({
    protocolVersion: 2, workerGeneration: 1, commandId: ++id, runId: c.runId, type, ...data,
  });
  send("INITIALIZE", {seed: 42});
  expect(replies.at(-1)?.phase).toBe("accepted");
  while (c.initializing) c.tick(false);
  expect(c.mode).toBe("sandbox");
  expect(c.status).toBe("finished");
  expect(c.model!.now).toBe(600000);
  expect(c.view()).not.toHaveProperty("history");
  expect(c.view().observation.completed).toBe(100);
  const baseline = c.summary("test");
  send("SET_CHARTS", {enabled: true});
  expect(c.view().history).toHaveLength(600);
  const time = c.model!.now;
  send("SET_CHARTS", {enabled: false});
  expect(c.model!.now).toBe(time);
  expect(c.view()).not.toHaveProperty("history");
  send("REPLACE", {newRunId: c.runId + 1, reason: "replay", execution: "playback"});
  expect(c.status).toBe("running");
  while (String(c.status) === "running") c.tick(false);
  expect(c.summary("test")).toEqual(baseline);
  send("REPLACE", {newRunId: c.runId + 1, reason: "apply", config: {...c.model!.config, rps: 1000}, execution: "fast"});
  for (let i = 0; i < 20; i++) c.tick(false);
  send("CANCEL");
  const frozen = c.model!.now;
  c.tick();
  expect(c.model!.now).toBe(frozen);
  expect(c.summary("cancel").partial).toBe(true);
  send("REPLACE", {newRunId: c.runId + 1, reason: "reset"});
  while (c.initializing) c.tick(false);
  expect(c.mode).toBe("sandbox");
  expect(c.model!.now).toBe(600000);
  expect(c.last?.partial).toBe(true);
  expect(replies.at(-1)?.type).toBe("FINISHED");
});

test("v2 validates execution and chart commands; invalid replacements are atomic", () => {
  const envelope = {protocolVersion: 2, workerGeneration: 1, commandId: 1, runId: 1};
  expect(() => validateCommand({...envelope, protocolVersion: 1, type: "RUN"})).toThrow("UNSUPPORTED_VERSION");
  expect(() => validateCommand({...envelope, type: "SET_CHARTS", enabled: "yes"})).toThrow();
  expect(() => validateCommand({...envelope, type: "RUN", execution: "skip"})).toThrow();
  const {c, send, replies} = setup();
  const before = c.model;
  const run = c.runId;
  send("REPLACE", {newRunId: run + 1, reason: "apply", config: {...c.model!.config, duration: 600000}, execution: "fast"});
  expect(replies.at(-1)?.type).toBe("ERROR");
  expect(c.runId).toBe(run);
  expect(c.model).toBe(before);
});

test("fast and playback retain identical core snapshots at overload and cache extremes", () => {
  for (const hit of [0, 1]) {
    const c = new Controller(() => {});
    let id = 0;
    const send = (type: string, data: Record<string, unknown> = {}) => c.handle({protocolVersion: 2, workerGeneration: 1, commandId: ++id, runId: c.runId, type, ...data});
    send("INITIALIZE", {seed: 42});
    send("REPLACE", {newRunId: 2, reason: "apply", config: {...c.model!.config, rps: 10000, replicas: 8, cache: true, hit}, execution: "fast"});
    while (String(c.status) === "running") c.tick(false);
    const fast = snapshot(c.model!);
    send("SET_CHARTS", {enabled: true});
    send("REPLACE", {newRunId: 3, reason: "replay", execution: "playback"});
    send("SET_SPEED", {speed: 4});
    for (let i = 0; i < 500; i++) c.tick(false);
    send("PAUSE");
    send("STEP");
    send("RUN", {execution: "playback"});
    while (String(c.status) === "running") c.tick(false);
    expect(snapshot(c.model!)).toEqual(fast);
    expect(c.view().history).toHaveLength(600);
    expect(c.references.size).toBe(0);
  }
});
import { snapshot } from "../../src/simulation/snapshot";

test("duplicate rejected commands replay their error rather than an older success", () => {
  const {c, replies} = setup();
  const command = {protocolVersion:2,workerGeneration:1,runId:c.runId,commandId:100,type:"REPLACE",newRunId:c.runId+1,reason:"apply",config:{...c.model!.config,duration:600000},execution:"fast"};
  const prior = c.model;
  c.handle(command);
  const rejected = replies.at(-1);
  expect(rejected?.type).toBe("ERROR");
  c.handle(command);
  expect(replies.at(-1)).toEqual(rejected);
  expect(c.model).toBe(prior);
  const step = {...command,commandId:101,type:"STEP",config:undefined,execution:undefined};
  c.handle(step);
  const accepted = replies.at(-1);
  expect(accepted?.type).toBe("ACK");
  c.handle({...step,type:"RUN"});
  expect(replies.at(-1)?.code).toBe("STALE_COMMAND");
  c.handle(step);
  expect(replies.at(-1)).toEqual(accepted);
});
