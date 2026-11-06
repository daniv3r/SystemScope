import type { View } from "../worker/protocol";
import { number } from "./Metrics";
const hints = {
  clients: {
    role: "Clients represent incoming requests, such as a page asking for data. Offered RPS means requests arriving per simulated second, not the number of people using the app.",
    effect: "Increasing traffic adds demand, not capacity. If arrivals exceed what the API or database can handle, requests may wait, time out, or be rejected when the queue is full.",
  },
  api: {
    role: "An API replica is one copy of the application handling requests. CPU slots do the processing; workers hold requests, including while they wait for the database.",
    effect: "More replicas add API processing capacity, workers, and bounded queue space. This can improve throughput until the shared database becomes the limit. Replicas do not add database service slots.",
  },
  db: {
    role: "The database serves reads that are not answered by the cache. All API replicas share its four service slots; extra requests wait for a connection or a free slot.",
    effect: "A faster database preset reduces the service time per read, so the same slots can finish more reads per second. It can reduce database waiting, but cannot remove an API processing limit.",
  },
  cache: {
    role: "The cache represents saved read results. A cache hit answers a cacheable read without visiting the database; a miss still needs the database.",
    effect: "With the configured hit rate, fewer reads reach the database. Each lookup still uses API CPU, so cache helps most when database work is the constraint. It does not multiply every resource’s capacity.",
  },
};
export default function Inspector({
  view,
  selected,
  onClose,
}: {
  view: View;
  selected: string;
  onClose: () => void;
}) {
  const o = view.observation;
  const hint = hints[selected as keyof typeof hints] ?? hints.clients;
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    panel.current?.focus();
  }, [selected]);
  function close() {
    onClose();
    const trigger = document.getElementById(`topology-${selected}`)
      ?? document.getElementById("topology-title");
    trigger?.focus();
  }
  return (
    <section ref={panel} tabIndex={-1} aria-labelledby="inspector-title" className="card inspector" data-testid="inspector">
      <div className="inspector-heading">
        <h3 id="inspector-title">
          {selected === "api"
            ? "API replicas"
            : selected === "db"
              ? "Database"
              : selected === "clients"
                ? "Clients"
                : "Cache"}{" "}
          · inspector
        </h3>
        <button aria-label="Close inspector" onClick={close}>
          ✕
        </button>
      </div>
      <h4>What it does</h4>
      <p>{hint.role}</p>
      <h4>How it affects results</h4>
      <p>{hint.effect}</p>
      {selected === "api" ? (
        <>
          {o.nodes.map((n, i) => (
            <div className="node-reading" key={i}>
              <h4>Replica {i + 1}</h4>
              <dl>
                <dt>CPU slots now</dt>
                <dd>
                  {n.cpu}/2 · {n.cpuNow}%
                </dd>
                <dt>Workers now</dt>
                <dd>
                  {n.workers}/32 · {n.workerNow.toFixed(1)}%
                </dd>
                <dt>DB connections now</dt>
                <dd>
                  {n.connections}/8 · {n.connectionNow.toFixed(1)}%
                </dd>
                <dt>Ingress / CPU wait</dt>
                <dd>
                  {n.ingress} / {n.cpuWait}
                </dd>
                <dt>Connection / DB wait</dt>
                <dd>
                  {n.connectionWait} / {n.dbWait}
                </dd>
                <dt>Window CPU / workers</dt>
                <dd>
                  {number(n.cpuUtil)}% / {number(n.workerUtil)}%
                </dd>
              </dl>
            </div>
          ))}
          <p>
            Per replica: 16 ingress positions, 32 workers, two CPU slots. API
            CPU cost: 5 ms before DB, 1 ms after; cache adds 1 ms lookup.
          </p>
        </>
      ) : selected === "db" ? (
        <>
          <dl>
            <dt>DB service slots now</dt>
            <dd>
              {o.dbBusy}/4 · {o.dbNow}%
            </dd>
            <dt>DB window utilization</dt>
            <dd>{number(o.dbUtil)}%</dd>
            <dt>Connection/service wait</dt>
            <dd>{o.dbWait}</dd>
            <dt>Service time per visit</dt>
            <dd>{{ slow: 20, normal: 10, fast: 4 }[view.config.db]} ms</dd>
          </dl>
          <p>
            Four shared DB service slots, regardless of API replica count. A
            connection stays occupied through DB wait and service.
          </p>
        </>
      ) : selected === "cache" ? (
        <>
          <dl>
            <dt>Configured hits</dt>
            <dd>{view.config.hit * 100}%</dd>
            <dt>Realized window hits</dt>
            <dd>
              {o.cacheHits === null ? "N/A" : number(o.cacheHits * 100) + "%"}
            </dd>
            <dt>Lookup CPU overhead</dt>
            <dd>1 ms / lookup</dd>
          </dl>
          <p>
            Cacheable reads only. Hits skip DB work, not API CPU. Fixed hit
            schedule; no warming, writes or invalidation.
          </p>
        </>
      ) : (
        <>
          <dl>
            <dt>Offered target now</dt>
            <dd>{o.target} RPS</dd>
            <dt>Observed arrivals</dt>
            <dd>{number(o.incoming)} RPS</dd>
            <dt>Admitted</dt>
            <dd>{number(o.admitted)} RPS</dd>
            <dt>Rejected in window</dt>
            <dd>{o.rejected}</dd>
          </dl>
          <p>
            Fixed-rate arrivals. RPS is not concurrent users. Admission is
            limited by finite queues and workers.
          </p>
        </>
      )}
      <p className="inspector-evidence">{view.insight}</p>
    </section>
  );
}
import { useEffect, useRef } from "react";
