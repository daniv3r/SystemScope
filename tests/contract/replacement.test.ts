import { expect, test } from "vitest";
import { Controller } from "../../src/worker/controller";
import type { Reply, Command } from "../../src/worker/protocol";
test("mode replacements archive old work, preserve applied seed and compute fresh guided evidence", () => {
  const replies: Reply[] = [];
  const c = new Controller((r) => replies.push(r));
  let id = 0;
  const send = (type: Command["type"], data: Record<string, unknown> = {}) =>
    c.handle({
      protocolVersion: 2,
      workerGeneration: 1,
      commandId: ++id,
      runId: c.runId,
      type,
      ...data,
    });
  send("INITIALIZE", { seed: 7 });
  while (c.initializing) c.tick();
  send("REPLACE", { newRunId: 2, reason: "sandbox" });
  expect(c.mode).toBe("sandbox");
  expect(c.model!.now).toBe(0);
  expect(c.model!.config.duration).toBe(600000);
  send("RUN");
  for (let i = 0; i < 25; i++) c.tick();
  send("REPLACE", { newRunId: 3, reason: "guided" });
  expect(c.last?.partial).toBe(true);
  expect(replies.at(-1)?.view).toBeNull();
  while (c.initializing) c.tick();
  expect(c.model!.now).toBe(50000);
  expect(c.model!.config).toMatchObject({
    seed: 7,
    replicas: 1,
    cache: false,
    rps: 100,
  });
  expect(c.references.size).toBe(0);
  expect(c.mode).toBe("guided");
  const before = c.model!.now;
  c.handle({
    protocolVersion: 2,
    workerGeneration: 1,
    commandId: ++id,
    runId: 2,
    type: "STEP",
  });
  expect(c.model!.now).toBe(before);
});
test("duplicate IDs are idempotent, conflicting reuse rejected and old progress credit harmless", () => {
  const replies: Reply[] = [];
  const c = new Controller((r) => replies.push(r));
  c.handle({
    protocolVersion: 2,
    workerGeneration: 1,
    commandId: 1,
    runId: 1,
    type: "INITIALIZE",
    seed: 42,
  });
  while (c.initializing) c.tick();
  const step = {
    protocolVersion: 2,
    workerGeneration: 1,
    commandId: 2,
    runId: 1,
    type: "STEP",
  };
  c.handle(step);
  const now = c.model!.now;
  c.handle(step);
  expect(c.model!.now).toBe(now);
  c.handle({ ...step, type: "RUN" });
  expect(replies.at(-1)?.code).toBe("STALE_COMMAND");
  c.handle({
    protocolVersion: 2,
    workerGeneration: 1,
    commandId: 3,
    runId: 1,
    type: "PROGRESS_APPLIED",
    observationSeq: 0,
  });
  expect(c.model!.now).toBe(now);
});
