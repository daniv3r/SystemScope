import { expect, test } from "vitest";
import {
  createModel,
  advance,
  observe,
  assertInvariants,
} from "../../src/simulation/model";
import { snapshot, restore } from "../../src/simulation/snapshot";
import { config } from "../../src/simulation/config";
test("pure transitions preserve old input; continuation and replay are exact", () => {
  let a = createModel(config({ spike: true }));
  for (let i = 0; i < 520; i++) a = advance(a);
  const before = snapshot(a);
  const next = advance(a);
  expect(snapshot(a)).toEqual(before);
  let resumed = restore(before),
    original = a;
  for (let i = 0; i < 30; i++) {
    resumed = advance(resumed);
    original = advance(original);
    assertInvariants(original);
  }
  expect(observe(resumed)).toEqual(observe(original));
  expect(next.now - a.now).toBe(100);
});
