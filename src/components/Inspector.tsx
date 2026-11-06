import { ResourceScheme } from "./SystemSchemes";
import type { View } from "../worker/protocol";
import { number } from "./Metrics";
import { componentGuide, type ComponentId } from "./componentGuide";
export default function Inspector({
  view,
  selected,
  onClose,
}: {
  view: View;
  selected: ComponentId;
  onClose: () => void;
}) {
  const o = view.observation;
  const hint = componentGuide[selected];
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
    <section ref={panel} tabIndex={-1} id="component-explanation" aria-labelledby="inspector-title" className="card inspector" data-testid="inspector">
      <div className="inspector-heading">
        <h3 id="inspector-title">
          {hint.name}
        </h3>
        <button aria-label="Close inspector" onClick={close}>
          ✕
        </button>
      </div>
      <ResourceScheme view={view} selected={selected} />
      <h4>What it does</h4>
      <p>{hint.role}</p>
      <h4>What you can change</h4>
      <p>{hint.change}</p>
      <h4>How that can affect results</h4>
      <p>{hint.effect}</p>
      <details className="resource-details"><summary>Technical details and resource readings</summary>
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
      </details>
    </section>
  );
}
import { useEffect, useRef } from "react";
