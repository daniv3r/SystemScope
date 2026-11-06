import { expect, test } from "vitest";
import { config } from "../../src/simulation/config";
import {
  createModel,
  advance,
  observe,
  assertInvariants,
} from "../../src/simulation/model";
function run(
  replicas = 1,
  cache = false,
  db: "normal" | "fast" = "normal",
  spike = true,
) {
  let s = createModel(config({ replicas, cache, db, spike, duration: 250000 }));
  while (s.now < s.config.duration) s = advance(s);
  assertInvariants(s);
  return observe(s);
}
test("D1: baseline vs tenfold demand", () => {
  const a = run(1, false, "normal", false),
    b = run();
  expect(a.completed).toBeGreaterThanOrEqual(95);
  expect(a.completed).toBeLessThanOrEqual(105);
  expect(a.timeouts + a.rejected).toBe(0);
  expect(b.completed).toBeLessThan(400);
  expect(b.queueMean).toBeGreaterThan(0);
  expect(b.timeouts + b.rejected).toBeGreaterThan(0);
  expect(b.p95!).toBeGreaterThan(a.p95!);
  console.log("D1", a.completed, b.completed, b.p95);
});
test("D2: scale then DB plateau", () => {
  const a = run(),
    b = run(4),
    c = run(8);
  console.log("D2", a.completed, b.completed, c.completed, b.dbUtil, c.dbUtil);
  expect(b.completed).toBeGreaterThanOrEqual(a.completed! * 1.1);
  for (const x of [b, c]) {
    expect(x.completed).toBeGreaterThanOrEqual(350);
    expect(x.completed).toBeLessThanOrEqual(420);
    expect(x.dbUtil).toBeGreaterThanOrEqual(90);
  }
  expect(
    Math.abs(c.completed! - b.completed!) / b.completed!,
  ).toBeLessThanOrEqual(0.05);
});
test("D3: cache and faster DB independently relieve capacity", () => {
  const a = run(8);
  for (const b of [run(8, true), run(8, false, "fast")]) {
    console.log("D3", b.completed, b.timeouts, b.rejected);
    expect(b.completed).toBeGreaterThanOrEqual(850);
    expect(b.timeouts + b.rejected).toBeLessThanOrEqual(
      (a.timeouts + a.rejected) / 2,
    );
  }
});
