import type { View } from "../worker/protocol";
export default function Topology({
  view,
  onSelect,
  motion,
}: {
  view: View;
  onSelect: (s: string) => void;
  motion: boolean;
}) {
  const o = view.observation;
  return (
    <section
      className={`card topology ${motion ? "still" : ""}`}
      aria-labelledby="topology-title"
    >
      <div className="section-heading">
        <h2 id="topology-title" tabIndex={-1}>
          01 <span>Topology</span>
        </h2>
        <span className="eyebrow">AGGREGATE REQUEST FLOW</span>
      </div>
      <p className="topology-hint">
        Select a component to learn what it does, what limits it, and which
        changes can help.
      </p>
      <div className="topology-map">
        <svg
          className="wires"
          viewBox="0 0 800 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id="arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0 0L6 3L0 6" fill="none" stroke="currentColor" />
            </marker>
          </defs>
          <path d="M170 100H320 M490 100H630" markerEnd="url(#arrow)" />
          <path
            className={view.status === "running" ? "flow-line" : ""}
            d="M170 100H320 M490 100H630"
          />
        </svg>
        <button id="topology-clients" className="node" onClick={() => onSelect("clients")}>
          <span className="node-icon">↗</span>
          <strong>Clients</strong>
          <span>{o.target.toLocaleString()} arriving/s</span>
          <small>Offered demand</small>
        </button>
        <button
          id="topology-api"
          className={`node api ${o.bottleneck === "API" ? "strained" : ""}`}
          onClick={() => onSelect("api")}
        >
          <span className="node-icon">▤</span>
          <strong>
            API replicas <b>×{view.config.replicas}</b>
          </strong>
          <span>
            {o.cpuUtil.toFixed(0)}% CPU · {o.inflight} in flight
          </span>
          <small>
            {o.bottleneck === "API"
              ? "Capacity constraint"
              : "Bounded workers & queues"}
          </small>
        </button>
        <button
          id="topology-db"
          className={`node db ${o.bottleneck === "Database" ? "strained" : ""}`}
          onClick={() => onSelect("db")}
        >
          <span className="node-icon">◉</span>
          <strong>Database</strong>
          <span>
            {o.dbUtil.toFixed(0)}% busy · {o.dbBusy}/4 slots
          </span>
          <small>
            {o.bottleneck === "Database"
              ? "Capacity constraint"
              : `${view.config.db} service`}
          </small>
        </button>
        {view.config.cache ? (
          <button id="topology-cache" className="cache-node" onClick={() => onSelect("cache")}>
            ↳ Cache · 80% configured hits
          </button>
        ) : null}
      </div>
      <div className="topology-footer">
        <span>
          <i className={`status-dot ${o.queue ? "amber" : ""}`} />
          {o.queue
            ? `${o.queue} waiting · ${o.health}`
            : "Healthy flow · no waiting"}
        </span>
        <span>Moving marks are aggregates, not individual requests.</span>
      </div>
    </section>
  );
}
