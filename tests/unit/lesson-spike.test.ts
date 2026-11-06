import { expect, test } from "vitest";
import { direction, compare } from "../../src/lesson/evaluate";
import { stages, stageConfig } from "../../src/lesson/stages";
import { config } from "../../src/simulation/config";
import { createModel, advance, observe } from "../../src/simulation/model";
test("direction uses exact unrounded ±5%, zero and missing samples", () => {
  expect(direction(100, 105)).toBe("same");
  expect(direction(100, 105.01)).toBe("increase");
  expect(direction(100, 94.9)).toBe("decrease");
  expect(direction(0, 0)).toBe("same");
  expect(direction(0, 1)).toBe("increase");
  expect(direction(null, 1)).toBeNull();
});
test("stage configs use one coherent model and comparisons cite observed evidence", () => {
  expect(stages).toHaveLength(5);
  expect(stageConfig(4, 42).replicas).toBe(8);
  let m = createModel(config());
  for (let i = 0; i < 20; i++) m = advance(m);
  const summary = {
    config: m.config,
    observation: observe(m),
    partial: true,
    reason: "test",
  };
  const c = compare(summary, summary, {
    throughput: "same",
    latency: "same",
    queue: "same",
  });
  expect(c?.rows[0].correct).toBe(true);
  expect(c?.explanation).toContain("RPS");
  expect(c?.explanation).toContain("CPU");
});
