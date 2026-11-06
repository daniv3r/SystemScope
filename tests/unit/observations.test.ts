import { expect, test } from "vitest";
import { createModel, advance, observe } from "../../src/simulation/model";
import { percentile } from "../../src/simulation/observations";
test("empty sample is N/A, failed requests never fake successful latency", () => {
  const s = createModel();
  expect(observe(s).p95).toBeNull();
  expect(observe(s).completed).toBeNull();
  expect(observe(advance(s)).completed).toBe(0);
  expect(observe(advance(s)).p50).toBeNull();
});
test("nearest rank histogram is exact and uses successful sample count", () => {
  const hist = Array(10001).fill(0);
  hist[10] = 19;
  hist[900] = 1;
  expect(percentile(hist, 20, 0.5)).toBe(1);
  expect(percentile(hist, 20, 0.95)).toBe(1);
  expect(percentile(hist, 20, 1)).toBe(90);
  expect(percentile(hist, 0, 0.95)).toBeNull();
});
test("baseline gives end-to-end 16 ms, real counts and separate resource occupancy", () => {
  let s = createModel();
  for (let i = 0; i < 1100; i++) s = advance(s);
  const o = observe(s);
  expect(o.windowStart).toBe(1);
  expect(o.windowSeconds).toBe(10);
  expect(o.incoming).toBe(100);
  expect(o.completed).toBe(100);
  expect(o.p95).toBe(16);
  expect(o.cpuUtil).toBeCloseTo(30);
  expect(o.dbUtil).toBeCloseTo(25);
  expect(o.totals.arrivals).toBe(1100);
  expect(o.bottleneck).toBe("None");
  expect(o.queuePeak).toBe(0);
});
