import { expect, test } from "vitest";
import { Scheduler } from "../../src/simulation/scheduler";
test("orders service/deadline/arrival ties and eagerly removes cancelled events", () => {
  const q = new Scheduler();
  q.add({ key: 1, at: 20, kind: "deadline", request: 1 });
  q.add({ key: 2, at: 20, kind: "finish", request: 1 });
  q.add({ key: 3, at: 20, kind: "arrival", request: 0 });
  q.add({ key: 4, at: 10, kind: "finish", request: 2 });
  q.remove(4);
  expect(q.pop()?.kind).toBe("finish");
  expect(q.pop()?.kind).toBe("deadline");
  expect(q.pop()?.kind).toBe("arrival");
  expect(q.positions.size).toBe(0);
});
test("heap remains indexed across mixed removals", () => {
  const q = new Scheduler();
  for (let i = 0; i < 1000; i++)
    q.add({ key: i, at: (i * 37) % 101, kind: "deadline", request: i });
  for (let i = 0; i < 1000; i += 3) q.remove(i);
  let last = -1;
  while (q.peek()) {
    const e = q.pop()!;
    expect(e.at).toBeGreaterThanOrEqual(last);
    last = e.at;
  }
  expect(q.positions.size).toBe(0);
});
