import { expect, test } from "vitest";
import {
  config,
  validateConfig,
  PRESETS,
  offered,
} from "../../src/simulation/config";
test("validates all presets, finite ranges and immutable config", () => {
  const original = { seed: 42, rps: 100 };
  const c = config(original);
  expect(original).toEqual({ seed: 42, rps: 100 });
  for (const rps of PRESETS) expect(config({ rps }).rps).toBe(rps);
  for (const bad of [NaN, Infinity, 0, 333])
    expect(() => validateConfig({ ...c, rps: bad })).toThrow();
  for (const seed of [-1, 1.5, 4294967296])
    expect(() => config({ seed })).toThrow();
  expect(config({ seed: 4294967295, replicas: 8 }).db).toBe("normal");
  for (const replicas of [0, 9, 1.5])
    expect(() => config({ replicas })).toThrow();
  expect(offered(config({ spike: true }), 49999)).toBe(100);
  expect(offered(config({ spike: true }), 50000)).toBe(1000);
});
