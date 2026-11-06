import { expect, test } from "vitest";
import {
  advance,
  createModel,
  assertInvariants,
} from "../../src/simulation/model";
import { config } from "../../src/simulation/config";
test("maximum 60-second load preserves conservation and all finite limits at every step", () => {
  let s = createModel(config({ rps: 10000, replicas: 8, db: "slow" }));
  for (let i = 0; i < 6000; i++) {
    s = advance(s);
    assertInvariants(s);
  }
  expect(s.now).toBe(600000);
  expect(s.totals.arrivals).toBe(600000);
  expect(s.charts.length).toBe(600);
  expect(s.buckets.length).toBe(1000);
  expect(advance(s)).toBe(s);
  expect(s.requests.size).toBeGreaterThan(0);
  expect(s.events.items.length).toBeLessThan(4000);
});
