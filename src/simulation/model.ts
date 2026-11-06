import { config, dbTime, offered, validateConfig } from "./config";
import type { Config } from "./config";
import { Scheduler } from "./scheduler";
import { replicas, cpuActive, waiting } from "./resources";
import type { Request, Replica } from "./resources";
import { bucket, counts, percentile, chartPoint } from "./observations";
import type { Bucket, Counts, Observation, ChartPoint } from "./observations";
export interface Model {
  config: Config;
  now: number;
  nextId: number;
  cacheOrdinal: number;
  requests: Map<number, Request>;
  replicas: Replica[];
  dbBusy: number;
  dbQueue: number[];
  events: Scheduler;
  totals: Counts;
  buckets: Bucket[];
  current: Bucket;
  samples: { at: number; latency: number }[];
  hist: number[];
  charts: ChartPoint[];
  queued: number;
  memory: number;
}
export function createModel(c: Config = config()): Model {
  validateConfig(c);
  const s: Model = {
    config: { ...c },
    now: 0,
    nextId: 1,
    cacheOrdinal: 0,
    requests: new Map(),
    replicas: replicas(c.replicas),
    dbBusy: 0,
    dbQueue: [],
    events: new Scheduler(),
    totals: counts(),
    buckets: [],
    current: bucket(100, c.replicas),
    samples: [],
    hist: Array(10001).fill(0),
    charts: [],
    queued: 0,
    memory: 0,
  };
  s.events.add({
    key: 0,
    at: 10000 / offered(c, 0),
    kind: "arrival",
    request: 0,
  });
  return s;
}
function copy(s: Model): Model {
  return {
    ...s,
    requests: new Map(s.requests),
    replicas: s.replicas.map((r) => ({
      ...r,
      ingress: r.ingress.slice(),
      cpuQueue: r.cpuQueue.slice(),
      connectionQueue: r.connectionQueue.slice(),
    })),
    dbQueue: s.dbQueue.slice(),
    events: new Scheduler(s.events),
    totals: { ...s.totals },
    current: {
      ...s.current,
      cpuArea: s.current.cpuArea.slice(),
      workerArea: s.current.workerArea.slice(),
      connectionArea: s.current.connectionArea.slice(),
    },
    buckets: s.buckets.slice(),
    samples: s.samples.slice(),
    hist: s.hist.slice(),
    charts: s.charts.slice(),
  };
}
// Request records use copy-on-write; previous states/snapshots never share mutable records.
function edit(s: Model, id: number) {
  const q = { ...s.requests.get(id)! };
  s.requests.set(id, q);
  return q;
}
function increment(s: Model, k: keyof Counts) {
  s.totals[k]++;
  s.current[k]++;
}
function extremum(s: Model) {
  const b = s.current;
  b.peakQueue = Math.max(b.peakQueue, s.queued);
  b.peakMemory = Math.max(b.peakMemory, s.memory);
  b.minQueue = Math.min(b.minQueue, s.queued);
  b.minMemory = Math.min(b.minMemory, s.memory);
}
function integrate(s: Model, to: number) {
  const dt = to - s.now,
    b = s.current;
  b.queueArea += s.queued * dt;
  b.dbArea += s.dbBusy * dt;
  for (let i = 0; i < s.replicas.length; i++) {
    const r = s.replicas[i];
    b.cpuArea[i] += r.cpu * dt;
    b.workerArea[i] += r.workers * dt;
    b.connectionArea[i] += r.connections * dt;
  }
  s.now = to;
}
function cpuReady(
  s: Model,
  q: Request,
  phase: "preWait" | "lookupWait" | "postWait",
) {
  q.phase = phase;
  q.ready = s.now;
  s.queued++;
  s.replicas[q.replica].cpuQueue.push(q.id);
}
function end(s: Model, q: Request, success: boolean) {
  const r = s.replicas[q.replica];
  s.events.remove(q.id * 2);
  s.events.remove(q.id * 2 + 1);
  if (waiting(q.phase)) s.queued--;
  if (q.phase === "ingress") {
    r.ingress = r.ingress.filter((x) => x !== q.id);
    s.memory -= 16384;
  } else {
    r.workers--;
    s.memory -= 65536;
    if (cpuActive(q.phase)) r.cpu--;
    if (q.phase === "db") s.dbBusy--;
    if (q.connection) r.connections--;
    r.cpuQueue = r.cpuQueue.filter((x) => x !== q.id);
    r.connectionQueue = r.connectionQueue.filter((x) => x !== q.id);
    s.dbQueue = s.dbQueue.filter((x) => x !== q.id);
  }
  s.requests.delete(q.id);
  increment(s, success ? "success" : "timeouts");
  if (success) {
    const latency = s.now - q.arrival;
    s.samples.push({ at: s.now, latency });
    s.hist[latency]++;
  }
}
function finish(s: Model, id: number) {
  if (!s.requests.has(id)) return;
  const q = edit(s, id),
    r = s.replicas[q.replica];
  if (q.phase === "db") {
    s.dbBusy--;
    r.connections--;
    q.connection = false;
    cpuReady(s, q, "postWait");
  } else {
    r.cpu--;
    if (q.phase === "post") {
      // end() must not release the already freed CPU a second time.
      q.phase = "postWait";
      s.queued++;
      end(s, q, true);
    } else if (q.phase === "pre" && s.config.cache) {
      cpuReady(s, q, "lookupWait");
    } else {
      let hit = false;
      if (q.phase === "lookup") {
        s.cacheOrdinal++;
        increment(s, "lookups");
        const numerator = s.config.hit === 1 ? 5 : s.config.hit === 0 ? 0 : 4;
        hit =
          Math.floor((s.cacheOrdinal * numerator) / 5) >
          Math.floor(((s.cacheOrdinal - 1) * numerator) / 5);
        if (hit) increment(s, "hits");
      }
      if (hit) cpuReady(s, q, "postWait");
      else {
        q.phase = "connectionWait";
        q.ready = s.now;
        s.queued++;
        r.connectionQueue.push(id);
      }
    }
  }
}
function sortQueue(s: Model, a: number[]) {
  a.sort(
    (a, b) => s.requests.get(a)!.ready - s.requests.get(b)!.ready || a - b,
  );
}
function dispatch(s: Model) {
  for (const r of s.replicas) {
    while (r.workers < 32 && r.ingress.length) {
      const q = edit(s, r.ingress.shift()!);
      s.queued--;
      r.workers++;
      s.memory += 65536 - 16384;
      cpuReady(s, q, "preWait");
    }
    sortQueue(s, r.connectionQueue);
    while (r.connections < 8 && r.connectionQueue.length) {
      const q = edit(s, r.connectionQueue.shift()!);
      r.connections++;
      q.connection = true;
      q.phase = "dbWait";
      q.ready = s.now;
      s.dbQueue.push(q.id);
    }
    sortQueue(s, r.cpuQueue);
    while (r.cpu < 2 && r.cpuQueue.length) {
      const q = edit(s, r.cpuQueue.shift()!);
      s.queued--;
      r.cpu++;
      const service = q.phase === "preWait" ? 50 : 10;
      q.phase =
        q.phase === "preWait"
          ? "pre"
          : q.phase === "lookupWait"
            ? "lookup"
            : "post";
      s.events.add({
        key: q.id * 2 + 1,
        at: s.now + service,
        kind: "finish",
        request: q.id,
      });
    }
  }
  sortQueue(s, s.dbQueue);
  while (s.dbBusy < 4 && s.dbQueue.length) {
    const q = edit(s, s.dbQueue.shift()!);
    s.queued--;
    s.dbBusy++;
    q.phase = "db";
    s.events.add({
      key: q.id * 2 + 1,
      at: s.now + dbTime(s.config),
      kind: "finish",
      request: q.id,
    });
  }
  extremum(s);
}
function arrival(s: Model) {
  increment(s, "arrivals");
  const id = s.nextId++;
  let ri = -1,
    min = Infinity;
  for (let i = 0; i < s.replicas.length; i++) {
    const r = s.replicas[i],
      n = r.workers + r.ingress.length;
    if (n < 48 && n < min) {
      ri = i;
      min = n;
    }
  }
  if (ri < 0) increment(s, "rejected");
  else {
    increment(s, "admitted");
    const q: Request = {
      id,
      replica: ri,
      arrival: s.now,
      deadline: s.now + 10000,
      phase: "ingress",
      ready: s.now,
      connection: false,
    };
    s.requests.set(id, q);
    s.replicas[ri].ingress.push(id);
    s.queued++;
    s.memory += 16384;
    s.events.add({
      key: id * 2,
      at: q.deadline,
      kind: "deadline",
      request: id,
    });
    // Admission and immediate dispatch form one event; do not count a zero-wait
    // staging entry as a real queue peak. dispatch() records the settled resource state.
  }
  const next = s.now + 10000 / offered(s.config, s.now);
  if (next <= s.config.duration)
    s.events.add({ key: 0, at: next, kind: "arrival", request: 0 });
}
/** Pure 10 ms transition. Exact events, not playback frames, determine all outcomes. */
export function advance(previous: Model): Model {
  if (previous.now >= previous.config.duration) return previous;
  const s = copy(previous),
    to = Math.min(s.now + 100, s.config.duration);
  while (s.events.peek() && s.events.peek().at <= to) {
    const at = s.events.peek().at;
    integrate(s, at);
    while (s.events.peek()?.at === at && s.events.peek().kind === "finish")
      finish(s, s.events.pop()!.request);
    while (s.events.peek()?.at === at && s.events.peek().kind === "deadline") {
      const e = s.events.pop()!;
      const q = s.requests.get(e.request);
      if (q) end(s, q, false);
    }
    dispatch(s);
    while (s.events.peek()?.at === at && s.events.peek().kind === "arrival") {
      s.events.pop();
      arrival(s);
    }
    dispatch(s);
  }
  integrate(s, to);
  extremum(s);
  s.buckets.push(s.current);
  s.buckets = s.buckets.filter((b) => b.end > s.now - 100000);
  let expired = 0;
  while (
    expired < s.samples.length &&
    s.samples[expired].at <= s.now - 100000
  ) {
    s.hist[s.samples[expired].latency]--;
    expired++;
  }
  if (expired) s.samples = s.samples.slice(expired);
  s.current = bucket(s.now + 100, s.config.replicas);
  extremum(s);
  if (s.now % 1000 === 0) {
    s.charts.push(chartPoint(observe(s)));
    if (s.charts.length > 600) s.charts.shift();
  }
  return s;
}
export function observe(s: Model): Observation {
  const n = s.config.replicas,
    duration = Math.min(s.now, 100000),
    seconds = duration / 10000,
    bs = s.buckets;
  const sum = (k: keyof Counts) => bs.reduce((a, b) => a + b[k], 0);
  const nodes = s.replicas.map((r, i) => ({
    workers: r.workers,
    cpu: r.cpu,
    connections: r.connections,
    cpuNow: (r.cpu / 2) * 100,
    workerNow: (r.workers / 32) * 100,
    connectionNow: (r.connections / 8) * 100,
    ingress: r.ingress.length,
    cpuWait: r.cpuQueue.length,
    connectionWait: r.connectionQueue.length,
    dbWait: s.dbQueue.filter((id) => s.requests.get(id)!.replica === i).length,
    cpuUtil: duration
      ? (bs.reduce((a, b) => a + b.cpuArea[i], 0) / (duration * 2)) * 100
      : 0,
    workerUtil: duration
      ? (bs.reduce((a, b) => a + b.workerArea[i], 0) / (duration * 32)) * 100
      : 0,
    connectionUtil: duration
      ? (bs.reduce((a, b) => a + b.connectionArea[i], 0) / (duration * 8)) * 100
      : 0,
  }));
  const cpuUtil = nodes.reduce((a, r) => a + r.cpuUtil, 0) / n,
    workerUtil = nodes.reduce((a, r) => a + r.workerUtil, 0) / n,
    dbUtil = duration
      ? (bs.reduce((a, b) => a + b.dbArea, 0) / (duration * 4)) * 100
      : 0,
    apiWait = nodes.reduce((a, r) => a + r.ingress + r.cpuWait, 0),
    dbWait = s.dbQueue.length + nodes.reduce((a, r) => a + r.connectionWait, 0);
  const bottleneck =
    dbUtil >= 90 && dbWait > 0
      ? "Database"
      : (cpuUtil >= 90 || workerUtil >= 90) && apiWait > 0
        ? "API"
        : "None";
  const latest = bs.slice(-10);
  return {
    time: s.now / 10000,
    windowStart: Math.max(0, s.now - 100000) / 10000,
    windowSeconds: seconds,
    target: offered(s.config, s.now),
    incoming: seconds ? sum("arrivals") / seconds : null,
    admitted: seconds ? sum("admitted") / seconds : null,
    completed: seconds ? sum("success") / seconds : null,
    p50: percentile(s.hist, s.samples.length, 0.5),
    p95: percentile(s.hist, s.samples.length, 0.95),
    samples: s.samples.length,
    queue: s.queued,
    queueMean: duration
      ? bs.reduce((a, b) => a + b.queueArea, 0) / duration
      : 0,
    queuePeak: bs.reduce((a, b) => Math.max(a, b.peakQueue), 0),
    inflight: s.requests.size,
    memory: s.memory,
    memoryPeak: bs.reduce((a, b) => Math.max(a, b.peakMemory), 0),
    timeouts: sum("timeouts"),
    rejected: sum("rejected"),
    errors: sum("errors"),
    timeoutRate: seconds ? sum("timeouts") / seconds : null,
    rejectionRate: seconds ? sum("rejected") / seconds : null,
    cpuUtil,
    workerUtil,
    dbUtil,
    dbBusy: s.dbBusy,
    dbNow: (s.dbBusy / 4) * 100,
    dbWait,
    cacheHits: sum("lookups") ? sum("hits") / sum("lookups") : null,
    totals: { ...s.totals },
    nodes,
    intervalTimeouts: latest.reduce((a, b) => a + b.timeouts, 0),
    intervalRejections: latest.reduce((a, b) => a + b.rejected, 0),
    queueMin: latest.reduce((a, b) => Math.min(a, b.minQueue), s.queued),
    memoryMin: latest.reduce((a, b) => Math.min(a, b.minMemory), s.memory),
    bottleneck,
    health: s.queued
      ? "congested"
      : Math.max(cpuUtil, dbUtil) >= 90
        ? "saturated"
        : Math.max(cpuUtil, dbUtil) >= 70
          ? "busy"
          : "healthy",
  };
}
export function assertInvariants(s: Model) {
  if (
    s.totals.arrivals !== s.totals.admitted + s.totals.rejected ||
    s.totals.admitted !==
      s.totals.success + s.totals.timeouts + s.totals.errors + s.requests.size
  )
    throw Error("request conservation");
  if (
    s.requests.size > 384 ||
    s.queued < 0 ||
    s.queued > s.requests.size ||
    s.memory > 18874368 ||
    s.events.items.length > 4000 ||
    s.samples.length > 100384 ||
    s.charts.length > 600 ||
    s.buckets.length > 1000
  )
    throw Error("MODEL_LIMIT");
  for (const r of s.replicas)
    if (
      r.workers < 0 ||
      r.workers > 32 ||
      r.cpu < 0 ||
      r.cpu > 2 ||
      r.connections < 0 ||
      r.connections > 8 ||
      r.ingress.length > 16
    )
      throw Error("resource bounds");
  if (s.dbBusy < 0 || s.dbBusy > 4) throw Error("DB bounds");
}
