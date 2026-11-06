import { RequestScheme } from "./SystemSchemes";
import type { View } from "../worker/protocol";
import { componentGuide, type ComponentId } from "./componentGuide";
export default function Topology({ view, onSelect, selected, motion }: {
  view: View; onSelect: (s: ComponentId) => void; selected: ComponentId | null; motion: boolean;
}) {
  const o = view.observation;
  const readings: Record<ComponentId, string> = {
    clients: `${o.target.toLocaleString()} arriving / second`,
    api: `${view.config.replicas} ${view.config.replicas === 1 ? "copy" : "copies"} · ${o.cpuUtil.toFixed(0)}% CPU busy`,
    cache: view.config.cache ? "On · 80% configured hits" : "Off · reads go to database",
    db: `${view.config.db} · ${o.dbUtil.toFixed(0)}% busy`,
  };
  return <section className={`card topology ${motion ? "still" : ""}`} aria-labelledby="topology-title">
    <div className="section-heading"><h2 id="topology-title" tabIndex={-1}>01 <span>Understand the system</span></h2><span className="eyebrow">APPLIED SETTINGS</span></div>
    <p className="topology-hint">Follow a request for a list of posts. Select any component to learn how it works.</p>
    <div className="request-flow">
      {(["clients", "api", "cache", "db"] as const).map((id, i) => <div className="flow-step" key={id}>
        {i > 0 && <p className="flow-connector">{id === "cache" ? (view.config.cache ? "Check saved result →" : "Cache disabled →") : id === "db" ? (view.config.cache ? "Miss: read data →" : "Read data →") : "Send request →"}</p>}
        <button id={`topology-${id}`} aria-expanded={selected === id} aria-controls="component-explanation" className={`flow-node ${selected === id ? "selected" : ""} ${((id === "api" && o.bottleneck === "API") || (id === "db" && o.bottleneck === "Database")) ? "strained" : ""} ${id === "cache" && !view.config.cache ? "cache-off" : ""}`} onClick={() => onSelect(id)}>
          <span className="flow-number">0{i + 1}</span><strong>{componentGuide[id].name}</strong><span>{componentGuide[id].short}</span><small>{readings[id]}</small>
          {(id === "api" && o.bottleneck === "API") || (id === "db" && o.bottleneck === "Database") ? <b className="limit-label">Limiting completions</b> : null}
        </button>
      </div>)}
    </div>
    <RequestScheme view={view} />
    <div className="return-path"><strong>{view.config.cache ? "Cache hit? Skip the database." : "Cache is off: reads visit the database."}</strong> The API sends the result back to the client.</div>
    <div className="topology-footer"><span><i className={`status-dot ${o.queue ? "amber" : ""}`} />{o.queue ? `${o.queue} requests waiting · ${o.health}` : "No requests waiting"}</span><span>Diagram shows the model, not real network traffic.</span></div>
  </section>;
}
