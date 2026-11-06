export interface Event {
  key: number;
  at: number;
  kind: "arrival" | "finish" | "deadline";
  request: number;
}
function before(a: Event, b: Event) {
  return (
    a.at - b.at ||
    { finish: 0, deadline: 1, arrival: 2 }[a.kind] -
      { finish: 0, deadline: 1, arrival: 2 }[b.kind] ||
    a.request - b.request
  );
}
/** Indexed heap: cancelled events are removed, never left as accumulating tombstones. */
export class Scheduler {
  items: Event[];
  positions: Map<number, number>;
  constructor(other?: Scheduler) {
    this.items = other ? other.items.slice() : [];
    this.positions = other ? new Map(other.positions) : new Map();
  }
  peek() {
    return this.items[0];
  }
  private swap(a: number, b: number) {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
    this.positions.set(this.items[a].key, a);
    this.positions.set(this.items[b].key, b);
  }
  private up(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (before(this.items[p], this.items[i]) <= 0) break;
      this.swap(i, p);
      i = p;
    }
  }
  private down(i: number) {
    for (;;) {
      let j = i;
      const a = i * 2 + 1,
        b = a + 1;
      if (a < this.items.length && before(this.items[a], this.items[j]) < 0)
        j = a;
      if (b < this.items.length && before(this.items[b], this.items[j]) < 0)
        j = b;
      if (j === i) break;
      this.swap(i, j);
      i = j;
    }
  }
  add(e: Event) {
    if (this.positions.has(e.key)) throw Error("duplicate event");
    if (this.items.length >= 4000) throw Error("MODEL_LIMIT: event heap");
    this.positions.set(e.key, this.items.length);
    this.items.push(e);
    this.up(this.items.length - 1);
  }
  remove(key: number) {
    const i = this.positions.get(key);
    if (i === undefined) return;
    this.positions.delete(key);
    const last = this.items.pop()!;
    if (i < this.items.length) {
      this.items[i] = last;
      this.positions.set(last.key, i);
      this.up(i);
      this.down(this.positions.get(last.key)!);
    }
  }
  pop() {
    const e = this.peek();
    if (e) this.remove(e.key);
    return e;
  }
}
