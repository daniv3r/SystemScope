import type { View } from "../worker/protocol";
import type { ComponentId } from "./componentGuide";

function Stop({ title, note, tone = "" }: { title: string; note: string; tone?: string }) {
  return <div className={`scheme-stop ${tone}`}><strong>{title}</strong><span>{note}</span></div>;
}
function Arrow({ label = "" }: { label?: string }) {
  return <div className="scheme-arrow"><span>{label}</span><b aria-hidden="true">→</b></div>;
}

export function RequestScheme({ view }: { view: View }) {
  return <figure className="system-scheme" aria-label="Request and response paths">
    <figcaption><strong>Two ways to get the same posts</strong><span>Follow the arrows from the application back to the person waiting.</span></figcaption>
    <div className={`scheme-route ${!view.config.cache ? "route-disabled" : ""}`}>
      <span className="route-label">{view.config.cache ? "CACHE HIT" : "CACHE HIT · OFF"}</span>
      <Stop title="API" note="Checks saved results" /><Arrow label="Found" />
      <Stop title="Cache" note="Returns saved posts" tone="saved" /><Arrow label="Via API" />
      <Stop title="Client" note="Sees the posts" />
    </div>
    <div className="scheme-route">
      <span className="route-label">{view.config.cache ? "CACHE MISS" : "CACHE OFF · ACTIVE"}</span>
      <Stop title="API" note={view.config.cache ? "No saved answer" : "Requests stored posts"} /><Arrow label="Read" />
      <Stop title="Database" note="Returns stored posts" tone="stored" /><Arrow label="Via API" />
      <Stop title="Client" note="Sees the posts" />
    </div>
    <p>{view.config.cache ? "Configured model: 80% of cacheable reads use saved results. A cache lookup still takes API processing time." : "The saved-results route is disabled. Enable cache in the inputs to try it."}</p>
  </figure>;
}

export function ResourceScheme({ view, selected }: { view: View; selected: ComponentId }) {
  if (selected === "cache") return <RequestScheme view={view} />;
  if (selected === "clients") return <figure className="system-scheme" aria-label="Traffic is requests, not people">
    <figcaption><strong>One person can send several requests</strong><span>Example journey, not a count from the simulation.</span></figcaption>
    <div className="fan-scheme"><Stop title="One person" note="Opens a feed" /><Arrow label="Asks for" /><div className="scheme-stack"><Stop title="Posts" note="A request for the feed" /><Stop title="Profile" note="A request for account data" /><Stop title="Notifications" note="Another request" /></div></div>
    <p>The traffic setting counts requests each second. It does not count people.</p>
  </figure>;
  return <figure className="system-scheme" aria-label="API copies share one database">
    <figcaption><strong>More API copies. The same shared database.</strong><span>Applied settings · active slots are filled and labeled “Busy.”</span></figcaption>
    <div className="fan-scheme">
      <div className="scheme-stack replica-rack">{view.observation.nodes.map((node, i) => <div className="replica-tile" key={i}><strong>API {i + 1}</strong><span>{node.workers}/32 requests held</span></div>)}</div>
      <Arrow label="Shared reads" />
      <div className="database-rack"><strong>One database</strong><div className="database-slots">{Array.from({length: 4}, (_, i) => <div key={i} className={`service-slot ${i < view.observation.dbBusy ? "busy" : ""}`}><b>{i + 1}</b><span>{i < view.observation.dbBusy ? "Busy" : "Free"}</span></div>)}</div><span>{{slow: 20, normal: 10, fast: 4}[view.config.db]} ms per read · 4 slots total</span></div>
    </div>
    <p>{selected === "api" ? "Each API copy can hold requests while they work or wait. Adding copies does not add database slots." : "A slot serves one read at a time. Faster reads free slots sooner; extra reads wait. These slots show activity at this instant."}</p>
  </figure>;
}

export function CapacityScheme({ view }: { view: View }) {
  const o = view.observation;
  return <figure className="system-scheme capacity-scheme" aria-label="Resource pressure and waiting requests">
    <figcaption><strong>Where work is building up</strong><span>Busy percentages cover the observation window. Waiting is the current count.</span></figcaption>
    <div className="pressure-flow">
      <div className="pressure-resources">{[["API processing", o.cpuUtil], ["API workers", o.workerUtil], ["Database", o.dbUtil]].map(([name, value]) => <div className="pressure-meter" key={name}><label>{name}<b>{Number(value).toFixed(0)}% busy</b><meter min={0} max={100} value={Number(value)} aria-label={`${name} utilization`} /></label></div>)}</div>
      <Arrow label="If work cannot keep up" />
      <Stop title={`${o.queue} waiting`} note="Queue: requests not yet working" tone={o.queue ? "waiting" : ""} />
    </div>
    <div className="outcome-notes"><span><b>Completed:</b> a successful response</span><span><b>Timed out:</b> the 1-second deadline passed</span><span><b>Rejected:</b> no room to accept the request</span></div>
    <p>Busy resources can make requests wait. Waiting uses part of the response deadline; a full system can reject new arrivals.</p>
  </figure>;
}
