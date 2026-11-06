import { expect, test } from "vitest";
import { explain, compare } from "../../src/lesson/evaluate";
import { stageConfig } from "../../src/lesson/stages";
import { createModel, observe } from "../../src/simulation/model";
test("scaling preserves shared DB while remedies alter only the intended constraint", () => {
  expect(stageConfig(3, 42).replicas).toBe(4);
  expect(stageConfig(4, 42).replicas).toBe(8);
  expect(stageConfig(5, 42, "cache")).toMatchObject({
    replicas: 8,
    cache: true,
    db: "normal",
    hit: 0.8,
  });
  expect(stageConfig(5, 42, "fast")).toMatchObject({
    replicas: 8,
    cache: false,
    db: "fast",
  });
});
test("explanation uses actual DB evidence and comparison handles missing latency", () => {
  const m = createModel();
  const summary = {
    config: m.config,
    partial: true,
    reason: "fixture",
    observation: {
      ...observe(m),
      incoming: 1000,
      completed: 400,
      windowSeconds: 10,
      dbUtil: 98,
      dbWait: 37,
      bottleneck: "Database" as const,
    },
  };
  expect(explain(summary)).toContain("98.0%");
  expect(explain(summary)).toContain("37 requests");
  expect(explain(summary)).toContain("400.0 completed RPS");
  expect(compare(summary, summary)?.rows[1].direction).toBeNull();
});
