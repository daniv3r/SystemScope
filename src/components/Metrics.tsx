import type { View } from "../worker/protocol";
export const number = (n: number | null, digits = 1) =>
  n === null
    ? "N/A"
    : n.toLocaleString("en-US", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      });
export default function Metrics({ view }: { view: View }) {
  const o = view.observation;
  const hints = [
    "Offered means arrivals. Admitted means accepted into the system’s finite queues and workers. Rejected arrivals never enter; accepted requests can still time out.",
    "Requests that finished successfully each simulated second. More arrivals cannot keep increasing completions once a resource is full.",
    "95% of successful requests finished within this time, including queue and database waits. Failed requests are excluded, so read this alongside timeouts and rejections. N/A means no successful samples.",
    "Requests waiting for a worker, CPU, database connection, or database service. In flight includes both waiting and active work. Waiting can raise latency and estimated buffer memory; queues cannot grow forever.",
  ];
  const cards = [
    [
      "Offered / admitted",
      `${number(o.incoming)} / ${number(o.admitted)}`,
      "RPS · observed arrivals / accepted",
    ],
    ["Completed throughput", number(o.completed), "RPS · successful requests"],
    ["p95 response latency", number(o.p95), "ms · successful requests only"],
    ["Pending queue", number(o.queue, 0), `${o.inflight} requests in flight`],
  ];
  return (
    <section aria-label="Live metrics" className="metric-grid">
      {cards.map(([name, value, unit], i) => (
        <article
          className={`metric-card ${i === 1 ? "accent" : ""}`}
          key={name}
        >
          <h3>{name}</h3>
          <strong
            data-testid={
              i === 1 ? "completed-value" : i === 2 ? "p95-value" : undefined
            }
            data-value={i === 1 ? o.completed : undefined}
          >
            {value}
          </strong>
          <small>{unit}</small>
          <details className="metric-hint">
            <summary aria-label={`Explain ${name}`}>What does this mean?</summary>
            <p>{hints[i]}</p>
          </details>
        </article>
      ))}
      <div className="metrics-detail">
        <span>
          p50 <b>{number(o.p50)} ms</b>
        </span>
        <span>{o.samples.toLocaleString()} successes sampled</span>
        <span>
          Timeouts <b>{o.timeouts.toLocaleString()}</b> ({number(o.timeoutRate)}{" "}
          RPS)
        </span>
        <span>
          Rejected <b>{o.rejected.toLocaleString()}</b> (
          {number(o.rejectionRate)} RPS)
        </span>
        <span>
          Other errors <b>{o.errors}</b> · not modeled
        </span>
        <span>
          API CPU <b>{number(o.cpuUtil)}%</b> · workers{" "}
          <b>{number(o.workerUtil)}%</b> · DB <b>{number(o.dbUtil)}%</b>
        </span>
        <span>
          Est. buffers <b>{number(o.memory / 1048576, 2)} MiB</b>
        </span>
      </div>
      <div className="window-label">
        Observation window ({number(o.windowStart)}, {number(o.time)}] virtual s
        · configured target {o.target.toLocaleString()} RPS
      </div>
      <p className="window-label">
        CPU and estimated buffer memory describe the simulated system, not
        your device’s actual CPU or RAM usage.
      </p>
    </section>
  );
}
