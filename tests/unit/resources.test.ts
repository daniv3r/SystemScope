import { expect, test } from "vitest";
import { config } from "../../src/simulation/config";
import {
  advance,
  createModel,
  observe,
  assertInvariants,
} from "../../src/simulation/model";
test("cache extremes keep CPU overhead and bypass only DB", () => {
  for (const hit of [0, 1]) {
    let s = createModel(config({ cache: true, hit }));
    for (let i = 0; i < 1100; i++) s = advance(s);
    const o = observe(s);
    expect(o.cacheHits).toBe(hit);
    expect(o.cpuUtil).toBeCloseTo(35, 0);
    expect(o.dbUtil).toBe(hit === 1 ? 0 : 25);
    expect(o.p95).toBe(hit === 1 ? 7 : 17);
  }
});
test("bounded admission rejects without allocating in-flight and releases expired resources once", () => {
  let s = createModel(config({ rps: 10000, replicas: 8, db: "slow" }));
  for (let i = 0; i < 400; i++) {
    s = advance(s);
    assertInvariants(s);
  }
  expect(s.totals.rejected).toBeGreaterThan(0);
  expect(s.totals.timeouts).toBeGreaterThan(0);
  expect(s.requests.size).toBeLessThanOrEqual(384);
  expect(s.memory).toBeLessThanOrEqual(18874368);
  expect([...s.requests.values()].filter((q) => q.phase === "db")).toHaveLength(
    s.dbBusy,
  );
});
