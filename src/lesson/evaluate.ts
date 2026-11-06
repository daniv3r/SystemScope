import type {
  Comparison,
  Direction,
  Predictions,
  Summary,
} from "../worker/protocol";
export function direction(
  before: number | null,
  after: number | null,
): Direction | null {
  if (before === null || after === null) return null;
  if (before === 0)
    return after === 0 ? "same" : after > 0 ? "increase" : "decrease";
  return after > before * 1.05
    ? "increase"
    : after < before * 0.95
      ? "decrease"
      : "same";
}
export function explain(s: Summary) {
  const o = s.observation;
  const base = `${o.completed?.toFixed(1) ?? "N/A"} completed RPS from ${o.incoming?.toFixed(1) ?? "N/A"} arriving RPS over ${o.windowSeconds.toFixed(1)} virtual seconds.`;
  if (o.bottleneck === "Database")
    return `${base} Database utilization is ${o.dbUtil.toFixed(1)}%; ${o.dbWait} requests are waiting for a DB connection or service. Adding API replicas does not add DB service slots. Try cache or a faster DB.`;
  if (o.bottleneck === "API")
    return `${base} API CPU is ${o.cpuUtil.toFixed(1)}% utilized; ${o.queue} requests are queued. Like a counter with too few servers, arrivals can outpace service. Add API replicas to test the next constraint.`;
  return `${base} API CPU is ${o.cpuUtil.toFixed(1)}%; DB utilization is ${o.dbUtil.toFixed(1)}%. No saturated bottleneck observed. ${s.config.cache ? `Cache serves only cacheable reads: configured ${(s.config.hit * 100).toFixed(0)}% hits avoid DB visits (observed ${o.cacheHits === null ? "N/A" : (o.cacheHits * 100).toFixed(1) + "%"}), but API and lookup CPU work remain.` : "Try increasing demand to expose a capacity limit."}`;
}
export function compare(
  current: Summary,
  reference: Summary | null,
  pred?: Predictions,
): Comparison | null {
  if (!reference) return null;
  const a = reference.observation,
    b = current.observation;
  const fields: [
    string,
    string,
    number | null,
    number | null,
    keyof Predictions | undefined,
  ][] = [
    ["Completed throughput", "RPS", a.completed, b.completed, "throughput"],
    ["p95 response latency", "ms", a.p95, b.p95, "latency"],
    ["Mean queued requests", "requests", a.queueMean, b.queueMean, "queue"],
    ["p50 response latency", "ms", a.p50, b.p50, undefined],
    ["Timeouts", "requests", a.timeouts, b.timeouts, undefined],
    ["Rejections", "requests", a.rejected, b.rejected, undefined],
    ["Offered arrivals", "RPS", a.incoming, b.incoming, undefined],
    ["Admitted arrivals", "RPS", a.admitted, b.admitted, undefined],
    ["Timeout rate", "RPS", a.timeoutRate, b.timeoutRate, undefined],
    ["Rejection rate", "RPS", a.rejectionRate, b.rejectionRate, undefined],
    ["Other errors (not modeled)", "requests", a.errors, b.errors, undefined],
    ["Peak queue", "requests", a.queuePeak, b.queuePeak, undefined],
    ["API CPU utilization", "%", a.cpuUtil, b.cpuUtil, undefined],
    ["API worker utilization", "%", a.workerUtil, b.workerUtil, undefined],
    ["Database utilization", "%", a.dbUtil, b.dbUtil, undefined],
    [
      "Peak estimated memory",
      "MiB",
      a.memoryPeak / 1048576,
      b.memoryPeak / 1048576,
      undefined,
    ],
  ];
  return {
    title: pred ? "Prediction vs. observation" : "Last run vs. current run",
    rows: fields.map(([name, unit, before, after, key]) => {
      const result = direction(before, after),
        prediction = key ? pred?.[key] : undefined;
      return {
        name,
        unit,
        before,
        after,
        direction: result,
        prediction,
        correct: prediction && result ? prediction === result : null,
      };
    }),
    explanation:
      explain(current) +
      (b.timeouts
        ? " Latency samples include successes only; many timeouts can hide behind a low successful p95."
        : ""),
  };
}
