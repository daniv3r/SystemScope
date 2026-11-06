import type { View } from "../worker/protocol";
import type { Config } from "../simulation/config";
import { PRESETS } from "../simulation/config";
interface Props {
  view: View;
  draft: Config | null;
  canRun: boolean;
  onEdit: (patch: Partial<Config>) => void;
  onAction: (type: string, data?: Record<string, unknown>) => void;
}
export default function Controls({
  view,
  draft,
  canRun,
  onEdit,
  onAction,
}: Props) {
  const c = draft ?? view.config;
  const failed = view.status === "failed";
  return (
    <section className="card controls">
      <div className="section-heading">
        <h2>
          02 <span>Change the inputs</span>
        </h2>
        <span className="eyebrow">{view.mode === "sandbox" ? "EXPLORE" : "GUIDED"}</span>
      </div>
      <label>
        Offered traffic <span>requests / second</span>
        <select
          aria-label="Offered traffic, requests per second"
          aria-describedby="traffic-hint"
          value={view.mode === "sandbox" ? c.rps : view.observation.target}
          disabled={view.mode !== "sandbox" || failed}
          onChange={(e) => onEdit({ rps: Number(e.target.value) })}
        >
          {PRESETS.map((n) => (
            <option key={n} value={n}>
              {n.toLocaleString()} RPS
            </option>
          ))}
        </select>
        <small id="traffic-hint">
          Requests arriving each second. More demand can add waiting and
          failures when capacity is full; it does not guarantee more completions.
        </small>
      </label>
      <label>
        API replicas{" "}
        <select
          aria-label="API replicas"
          aria-describedby="replicas-hint"
          value={c.replicas}
          disabled={view.mode !== "sandbox" || failed}
          onChange={(e) => onEdit({ replicas: Number(e.target.value) })}
        >
          {Array.from({ length: 8 }, (_, i) => (
            <option key={i} value={i + 1}>
              {i + 1} {i ? "replicas" : "replica"}
            </option>
          ))}
        </select>
        <small id="replicas-hint">
          A replica is a copy of the API application sharing the work. More copies can help
          until the database becomes the limit.
        </small>
      </label>
      <label>
        Database service{" "}
        <select
          aria-label="Database service"
          aria-describedby="database-hint"
          value={c.db}
          disabled={view.mode !== "sandbox" || failed}
          onChange={(e) => onEdit({ db: e.target.value as Config["db"] })}
        >
          <option value="slow">Slow · 20 ms / visit</option>
          <option value="normal">Normal · 10 ms / visit</option>
          <option value="fast">Fast · 4 ms / visit</option>
        </select>
        <small id="database-hint">
          Time needed for each database read. Faster reads free the same
          four shared slots sooner; they do not add API capacity.
        </small>
      </label>
      <label className="check-control">
        <input
          type="checkbox"
          aria-label="Enable cache"
          aria-describedby="cache-hint"
          checked={c.cache}
          disabled={view.mode !== "sandbox" || failed}
          onChange={(e) => onEdit({ cache: e.target.checked })}
        />
        <span>
          Enable cache<small id="cache-hint">80% fixed hits for cacheable reads skip the database.
          Lookups still use API CPU.</small>
        </span>
      </label>
      {view.stage === 5 && view.mode === "guided" ? (
        <label>
          Choose the remedy
          <select
            aria-label="Database remedy"
            aria-describedby="remedy-hint"
            value={view.config.cache ? "cache" : "fast"}
            disabled={view.status === "running"}
            onChange={(e) =>
              onAction("REPLACE", {
                reason: "apply",
                stage: 5,
                config: {
                  ...view.config,
                  cache: e.target.value === "cache",
                  db: e.target.value === "cache" ? "normal" : "fast",
                },
              })
            }
          >
            <option value="cache">Cache · avoid 80% of DB visits</option>
            <option value="fast">Fast DB · 4 ms per visit</option>
          </select>
          <small id="remedy-hint">
            Cache avoids some database visits; a faster database shortens
            each visit. Compare one remedy at a time with the same workload.
          </small>
        </label>
      ) : null}
      <details className="advanced-settings"><summary>Advanced: simulation seed</summary>
      <label>
        Simulation seed
        <input
          disabled={failed}
          aria-label="Simulation seed"
          type="number"
          min="0"
          max="4294967295"
          step="1"
          value={Number.isFinite(c.seed) ? c.seed : ""}
          onChange={(e) => onEdit({ seed: e.target.valueAsNumber })}
        />
        <small>
          Recorded for replay. Fixed schedules do not vary with seed.
        </small>
      </label>
      </details>
      {draft ? (
        <div className="pending-edits" role="status">
          <strong>Changes pending · results still use applied inputs</strong>
          {view.mode === "guided" ?
          <button
            disabled={view.status === "running"}
            onClick={() =>
              onAction("REPLACE", { reason: "apply", config: draft })
            }
          >
            Apply &amp; restart
          </button> : <small>Run or Watch applies all changes to a fresh experiment.</small>}
          <button onClick={() => onAction("DISCARD")}>Discard edits</button>
        </div>
      ) : null}
      <div className="control-rule" />
      <div className="playback-row">
        {view.mode === "guided" || view.executionStyle === "playback" ?
        <label>
          Playback
          <select
            disabled={failed}
            aria-label="Playback speed"
            aria-describedby="playback-hint"
            value={view.speed}
            onChange={(e) =>
              onAction("SET_SPEED", { speed: Number(e.target.value) })
            }
          >
            <option value="1">1×</option>
            <option value="4">4×</option>
          </select>
          <small id="playback-hint">Changes how fast you watch, not the result.</small>
        </label>
        : null}
        <div className="virtual-clock">
          <span>VIRTUAL TIME</span>
          <b data-testid="virtual-time">{view.observation.time.toFixed(2)} s</b>
        </div>
      </div>
      <div className="run-buttons">
        <button
          className="primary"
          onClick={() => onAction(view.mode === "sandbox" ? "EXPLORE_RUN" : "RUN")}
          disabled={failed || !canRun || (view.mode === "guided" && (view.status !== "paused" || !!draft))}
          aria-label="Run experiment"
        >
          ▶ Run experiment
        </button>
        {view.mode === "sandbox" ? <button disabled={failed} onClick={() => onAction("WATCH")}>{view.status === "paused" && view.executionStyle === "playback" && !draft ? "Resume playback" : "Watch simulation"}</button> : null}
        {view.mode === "guided" || view.executionStyle === "playback" || view.status === "paused" ? <><button
          disabled={view.status !== "running"}
          onClick={() => onAction("PAUSE")}
        >
          Pause
        </button>
        <button
          disabled={!canRun || view.status !== "paused" || !!draft}
          onClick={() => onAction("STEP")}
        >
          Step 10 ms
        </button></> : null}
      </div>
      <div className="reset-actions">
        <button
          disabled={failed}
          onClick={() => onAction("REPLACE", { reason: "reset" })}
        >
          Reset baseline
        </button>
        <button
          disabled={failed}
          onClick={() => onAction("REPLACE", { reason: "replay" })}
        >
          Replay same inputs
        </button>
      </div>
      <p className="control-help">
        {!canRun
          ? "Choose all three predictions to run or step."
          : view.mode === "sandbox" ? "Run computes 60 virtual seconds quickly. Watch plays the same model over time." : "Playback changes wall time only. Model results stay the same."}
      </p>
      <p className="control-help">
        Runs on your device; no real traffic is generated. Calculating uses
        your browser’s CPU and memory. Finished experiments stop advancing.
        The displayed CPU and memory metrics describe the simulated system,
        not your device.
      </p>
      <details className="control-help">
        <summary>Virtual time &amp; device usage</summary>
        <p>
          In Explore, Run computes 60 simulated seconds without waiting 60 real
          seconds. Watch and the guided lesson play the same model over time;
          Pause freezes simulated time. Higher traffic settings can take longer
          to calculate. Charts load only when selected.
        </p>
        <p>
          This demo does not measure your device’s CPU or RAM usage. A finished
          or paused experiment keeps its results in memory, so it does not mean
          the browser uses zero resources.
        </p>
      </details>
      <div className="status-line">
        State <b data-testid="run-status">{view.status}</b>
        {view.lagging ? <span>Playback lag · events preserved</span> : null}
      </div>
    </section>
  );
}
