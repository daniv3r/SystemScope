import type { Comparison, View } from "../worker/protocol";
import { number } from "./Metrics";

function ComparisonRow({ row }: { row: Comparison["rows"][number] }) {
  return (
    <div>
      <span>{row.name}</span>
      <b>{number(row.before)} → {number(row.after)} <small>{row.unit}</small></b>
      {row.prediction ? (
        <small>
          Your prediction: {row.prediction} · {row.correct === null
            ? "Insufficient samples"
            : row.correct ? "Matches the data" : "Different from observation"}
        </small>
      ) : null}
    </div>
  );
}

export default function ComparisonPanel({ view }: { view: View }) {
  if (!view.comparison) return null;
  return (
    <div data-testid="comparison" className="comparison">
      <h4>{view.comparison.title}</h4>
      <p>Last run → Current run. Compare completed requests, response time, and waiting below.</p>
      <details className="comparison-evidence"><summary>Run settings and measurement evidence</summary>
      {view.reference ? (
        <p data-testid="reference-config">
          Reference: {view.reference.config.replicas} API · {view.reference.config.db} DB · cache{" "}
          {view.reference.config.cache ? "on" : "off"} · seed {view.reference.config.seed} ·{" "}
          {view.reference.partial ? "partial" : "complete"} · traffic{" "}
          {view.reference.config.spike ? "100 → 1,000" : view.reference.config.rps.toLocaleString()} RPS ·{" "}
          ({view.reference.observation.windowStart.toFixed(1)}, {view.reference.observation.time.toFixed(1)}] s ·{" "}
          {view.reference.observation.samples.toLocaleString()} successful samples · {view.reference.config.modelVersion}
        </p>
      ) : null}
      <p>
        Current: {view.config.replicas} API · {view.config.db} DB · cache{" "}
        {view.config.cache ? "on" : "off"} · seed {view.config.seed} ·{" "}
        {view.status === "finished" ? "complete" : "partial"} · traffic{" "}
        {view.config.spike ? "100 → 1,000" : view.config.rps.toLocaleString()} RPS ·{" "}
        ({view.observation.windowStart.toFixed(1)}, {view.observation.time.toFixed(1)}] s ·{" "}
        {view.observation.samples.toLocaleString()} successful samples · {view.config.modelVersion}
      </p>
      </details>
      {view.comparison.rows.slice(0, 3).map(row => <ComparisonRow key={row.name} row={row} />)}
      <details>
        <summary>All comparison metrics</summary>
        {view.comparison.rows.slice(3).map(row => <ComparisonRow key={row.name} row={row} />)}
      </details>
      <p>{view.comparison.explanation}</p>
    </div>
  );
}
