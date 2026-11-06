export interface Counts {
  arrivals: number;
  admitted: number;
  success: number;
  timeouts: number;
  rejected: number;
  errors: number;
  hits: number;
  lookups: number;
}
export const counts = (): Counts => ({
  arrivals: 0,
  admitted: 0,
  success: 0,
  timeouts: 0,
  rejected: 0,
  errors: 0,
  hits: 0,
  lookups: 0,
});
export interface Bucket extends Counts {
  end: number;
  queueArea: number;
  cpuArea: number[];
  workerArea: number[];
  connectionArea: number[];
  dbArea: number;
  peakQueue: number;
  peakMemory: number;
  minQueue: number;
  minMemory: number;
}
export function bucket(end: number, n: number): Bucket {
  return {
    ...counts(),
    end,
    queueArea: 0,
    cpuArea: Array(n).fill(0),
    workerArea: Array(n).fill(0),
    connectionArea: Array(n).fill(0),
    dbArea: 0,
    peakQueue: 0,
    peakMemory: 0,
    minQueue: Infinity,
    minMemory: Infinity,
  };
}
export interface NodeState {
  workers: number;
  cpu: number;
  connections: number;
  ingress: number;
  cpuWait: number;
  connectionWait: number;
  dbWait: number;
  cpuUtil: number;
  workerUtil: number;
  connectionUtil: number;
  cpuNow: number;
  workerNow: number;
  connectionNow: number;
}
export interface Observation {
  time: number;
  windowStart: number;
  windowSeconds: number;
  target: number;
  incoming: number | null;
  admitted: number | null;
  completed: number | null;
  p50: number | null;
  p95: number | null;
  samples: number;
  queue: number;
  queueMean: number;
  queuePeak: number;
  inflight: number;
  memory: number;
  memoryPeak: number;
  timeouts: number;
  rejected: number;
  errors: number;
  timeoutRate: number | null;
  rejectionRate: number | null;
  cpuUtil: number;
  workerUtil: number;
  dbUtil: number;
  dbBusy: number;
  dbNow: number;
  dbWait: number;
  cacheHits: number | null;
  totals: Counts;
  nodes: NodeState[];
  intervalTimeouts: number;
  intervalRejections: number;
  queueMin: number;
  memoryMin: number;
  bottleneck: "API" | "Database" | "None";
  health: "healthy" | "busy" | "saturated" | "congested";
}
export function percentile(
  hist: readonly number[],
  n: number,
  p: number,
): number | null {
  if (n === 0) return null;
  const rank = Math.ceil(n * p);
  let total = 0;
  for (let i = 0; i < hist.length; i++) {
    total += hist[i];
    if (total >= rank) return i / 10;
  }
  throw Error("invalid latency histogram");
}

export type ChartPoint = Pick<
  Observation,
  | "time"
  | "incoming"
  | "admitted"
  | "completed"
  | "p50"
  | "p95"
  | "queue"
  | "queuePeak"
  | "memory"
  | "memoryPeak"
  | "intervalTimeouts"
  | "intervalRejections"
  | "queueMin"
  | "memoryMin"
>;
export function chartPoint(o: Observation): ChartPoint {
  const {
    time,
    incoming,
    admitted,
    completed,
    p50,
    p95,
    queue,
    queuePeak,
    memory,
    memoryPeak,
    intervalTimeouts,
    intervalRejections,
    queueMin,
    memoryMin,
  } = o;
  return {
    time,
    incoming,
    admitted,
    completed,
    p50,
    p95,
    queue,
    queuePeak,
    memory,
    memoryPeak,
    intervalTimeouts,
    intervalRejections,
    queueMin,
    memoryMin,
  };
}
