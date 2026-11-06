import { memo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { ChartPoint } from "../simulation/observations";
const plots = [
  {
    title: "Traffic in, work out",
    unit: "RPS",
    keys: ["incoming", "admitted", "completed"],
  },
  { title: "Response latency", unit: "ms · successes", keys: ["p50", "p95"] },
  { title: "Pending queue", unit: "requests", keys: ["queue", "queuePeak"] },
  {
    title: "Timeouts & rejections",
    unit: "requests / 100 ms",
    keys: ["intervalTimeouts", "intervalRejections"],
  },
  {
    title: "Estimated working memory",
    unit: "MiB · buffers only",
    keys: ["memory", "memoryPeak"],
  },
];
const colors = ["#7f8c9b", "#86a386", "#d45935"];
function Charts({ history, spike }: { history: ChartPoint[]; spike: boolean }) {
  const [page, setPage] = useState(0);
  return (
    <section className="charts" aria-label="Time series">
      {plots.map((p, idx) => (
        <article className={`card chart chart-${idx}`} key={p.title}>
          <div className="chart-title">
            <h3>{p.title}</h3>
            <span>{p.unit}</span>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid stroke="#e8e8e2" vertical={false} />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[0, "dataMax"]}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  unit="s"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={(n) =>
                    idx === 4
                      ? (n / 1048576).toFixed(2)
                      : n >= 1000
                        ? `${n / 1000}k`
                        : `${n}`
                  }
                />
                <Tooltip
                  formatter={(v) =>
                    idx === 4
                      ? `${(Number(v) / 1048576).toFixed(3)} MiB`
                      : Number(v).toFixed(1)
                  }
                  labelFormatter={(t) => `${Number(t).toFixed(1)} virtual s`}
                />
                {spike ? <ReferenceLine x={5} stroke="#b4b5ad" strokeDasharray="3 3" label="10× spike" /> : null}
                {p.keys.map((key, i) => (
                  <Line
                    key={key}
                    type="linear"
                    dataKey={key}
                    stroke={colors[i]}
                    strokeWidth={key === "completed" ? 2.5 : 1.8}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="chart-range">
            {p.keys
              .map((key) => {
                const values = history
                  .map((o) => o[key as keyof ChartPoint])
                  .filter((n): n is number => typeof n === "number");
                return `${key}: ${values.length ? Math.min(...values).toFixed(idx === 4 ? 0 : 1) : "N/A"}–${values.length ? Math.max(...values).toFixed(idx === 4 ? 0 : 1) : "N/A"}${idx === 4 ? " bytes" : ""}`;
              })
              .join(" · ")}{" "}
            (displayed sample range)
          </p>
          <div className="legend">
            {p.keys.map((key, i) => (
              <span key={key}>
                <i style={{ background: colors[i] }} />
                {key === "intervalTimeouts"
                  ? "Timeouts"
                  : key === "intervalRejections"
                    ? "Rejections"
                    : key.endsWith("Peak")
                      ? "10 s window peak"
                      : key}
              </span>
            ))}
          </div>
        </article>
      ))}
      <details className="chart-data">
        <summary>Read chart values as a table</summary>
        <p>
          Each row is one 100 ms virtual-time sample. Latencies use successful
          completions in the trailing 10 s. Failure counts are per 100 ms.
        </p>
        <div className="table-wrap">
          <table>
            <caption>Retained time-series values, page {page + 1}</caption>
            <thead>
              <tr>
                {[
                  "s",
                  "Offered RPS",
                  "Admitted RPS",
                  "Completed RPS",
                  "p50 ms",
                  "p95 ms",
                  "Queue",
                  "Timeouts",
                  "Rejected",
                  "MiB",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.slice(page * 50, page * 50 + 50).map((o) => (
                <tr key={o.time}>
                  {[
                    o.time.toFixed(1),
                    o.incoming?.toFixed(1),
                    o.admitted?.toFixed(1),
                    o.completed?.toFixed(1),
                    o.p50?.toFixed(1) ?? "N/A",
                    o.p95?.toFixed(1) ?? "N/A",
                    o.queue,
                    o.intervalTimeouts,
                    o.intervalRejections,
                    (o.memory / 1048576).toFixed(3),
                  ].map((x, i) => (
                    <td key={i}>{x}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-pager">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous values
          </button>
          <button
            disabled={(page + 1) * 50 >= history.length}
            onClick={() => setPage(page + 1)}
          >
            Next values
          </button>
        </div>
      </details>
    </section>
  );
}
export default memo(Charts);
