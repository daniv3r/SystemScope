import { lazy, Suspense, useEffect, useReducer, useRef } from "react";
import { SimulationClient } from "./simulationClient";
import { initialSession, sessionReducer } from "./sessionReducer";
import type { Command, Predictions } from "../worker/protocol";
import { validateConfig, type Config } from "../simulation/config";
import { stages } from "../lesson/stages";
import Topology from "../components/Topology";
import Controls from "../components/Controls";
import Metrics from "../components/Metrics";
const Charts = lazy(() => import("../components/Charts"));
const LessonPanel = lazy(() => import("../components/LessonPanel"));
import ComparisonPanel from "../components/ComparisonPanel";
import Inspector from "../components/Inspector";
import AssumptionsPanel from "../components/AssumptionsPanel";
export default function App() {
  const [state, dispatch] = useReducer(sessionReducer, initialSession);
  const client = useRef<SimulationClient | null>(null);
  useEffect(() => {
    const c = new SimulationClient(
      (view) => dispatch({ type: "view", view }),
      (error, fatal) => dispatch({ type: "error", error, fatal }),
    );
    client.current = c;
    return () => c.dispose();
  }, []);
  const v = state.view;
  const chartsTrigger = useRef<HTMLButtonElement>(null);
  const lessonTrigger = useRef<HTMLButtonElement>(null);
  const previousMode = useRef(v?.mode);
  useEffect(() => {
    if (v && previousMode.current && previousMode.current !== v.mode) lessonTrigger.current?.focus();
    if (v) previousMode.current = v.mode;
  }, [v]);
  const canRun =
    !!v &&
    (v.stage === 1 ||
      v.mode === "sandbox" ||
      ["throughput", "latency", "queue"].every(
        (k) => state.predictions[k as keyof Predictions],
      ));
  function action(type: string, data: Record<string, unknown> = {}) {
    if (type === "EXPLORE_RUN" || type === "WATCH") {
      if (!v) return;
      if (type === "WATCH" && !state.draft && v.status === "paused" && v.executionStyle === "playback") {
        client.current?.send("RUN", { execution: "playback" });
        return;
      }
      data = { reason: "apply", config: state.draft ?? v.config, execution: type === "WATCH" ? "playback" : "fast" };
      type = "REPLACE";
    }
    if (type === "REPLACE" && data.reason === "replay" && v?.mode === "sandbox")
      data.execution = v.executionStyle;
    if (type === "REPLACE" && data.config) {
      try { validateConfig(data.config as Config); }
      catch (error) { dispatch({type:"error", error: String(error)}); return; }
    }
    if (type === "DISCARD") {
      dispatch({
        type: "patch",
        patch: {
          draft: null,
          error: "",
          notice: "Pending edits discarded. Applied settings are unchanged.",
        },
      });
      return;
    }
    if (type === "REPLACE")
      dispatch({
        type: "patch",
        patch: {
          predictions: {},
          draft: null,
          replacing: true,
          notice:
            data.reason === "apply"
              ? "Pending configuration applied to a fresh run. Previous work archived."
              : state.draft
                ? "Pending edits discarded on mode change/reset/restart; new run uses the displayed applied configuration."
                : "Fresh run created. Previous work is archived; queues do not carry over.",
        },
      });
    client.current?.send(type as Command["type"], {
      ...data,
      ...(type === "RUN" || type === "STEP"
        ? {
            predictions:
              canRun && v && v.mode === "guided" && v.stage > 1 ? state.predictions : undefined,
          }
        : {}),
    });
  }
  function edit(patch: Partial<Config>) {
    if (!v) return;
    if (v.status === "running" || v.status === "initializing")
      action(v.executionStyle === "fast" ? "CANCEL" : "PAUSE");
    dispatch({
      type: "patch",
      patch: { draft: { ...(state.draft ?? v.config), ...patch } },
    });
  }
  function next() {
    if (!v) return;
    dispatch({ type: "patch", patch: { predictions: {}, replacing: true } });
    action("ADVANCE_STAGE", { stage: v.stage + 1 });
  }
  return (
    <div
      className={
        state.motion
          ? "app min-h-screen antialiased paused-motion"
          : "app min-h-screen antialiased"
      }
    >
      <nav className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">
            S<span>↗</span>
          </span>
          SystemScope<span className="brand-divider">/</span>
          <small>THE LEARNING LAB</small>
        </a>
        <div className="nav-actions">
          <label className="motion-toggle">
            <input
              type="checkbox"
              checked={state.motion}
              onChange={(e) =>
                dispatch({ type: "patch", patch: { motion: e.target.checked } })
              }
            />
            Pause motion
          </label>
          <button
            className="text-button"
            onClick={() =>
              dispatch({ type: "patch", patch: { assumptions: true } })
            }
          >
            Assumptions <span>↗</span>
          </button>
        </div>
      </nav>
      <main>
        <header className="hero">
          <div>
            <div className="eyebrow hero-tag">
              <span className="tiny-square" />
              EXPERIMENT 001 <span>BACKEND SYSTEM DESIGN</span>
            </div>
            <h1>
              Your app just
              <br />
              <em>went viral.</em>
            </h1>
            <p>
              Ten times the traffic. The same infrastructure.
              <br />
              Change the inputs. Run the model. Compare the evidence.
            </p>
          </div>
          <div className="hero-note">
            <span>THE QUESTION</span>
            <p>
              Does 10× more traffic
              <br />
              mean 10× more throughput?
            </p>
            <small>Explore freely. Open charts or a guided lesson when you choose.</small>
          </div>
        </header>
        {v?.mode === "guided" ? <ol className="stage-track" aria-label="Guided lesson progress">
          {stages.map((s, i) => (
            <li
              key={s.name}
              className={
                v?.stage === i + 1
                  ? "active"
                  : v && v.stage > i + 1
                    ? "done"
                    : ""
              }
            >
              <span>{v && v.stage > i + 1 ? "✓" : `0${i + 1}`}</span>
              {s.name}
            </li>
          ))}
        </ol> : null}
        {state.error ? (
          <div role="alert" className="error-banner">
            {state.error}
            <button
              onClick={() => {
                client.current?.dispose();
                client.current = new SimulationClient(
                  (view) => dispatch({ type: "view", view }),
                  (error, fatal) => dispatch({ type: "error", error, fatal }),
                  state.chartsVisible,
                );
                dispatch({
                  type: "patch",
                  patch: { view: null, error: "", predictions: {}, draft: null, selected: null, replacing: false },
                });
              }}
            >
              Restart simulation
            </button>
          </div>
        ) : null}
        {state.notice ? (
          <p role="status" className="notice">
            {state.notice}
          </p>
        ) : null}
        {v ? <div className="optional-actions" aria-label="Optional learning views">
          <button ref={chartsTrigger} aria-expanded={state.chartsVisible} aria-controls="simulation-charts" onClick={() => {
            const enabled = !state.chartsVisible;
            dispatch({type:"patch", patch:{chartsVisible: enabled}});
            client.current?.send("SET_CHARTS", {enabled});
            if (!enabled) chartsTrigger.current?.focus();
          }}>{state.chartsVisible ? "Hide charts" : "Show charts"}</button>
          <button ref={lessonTrigger} disabled={state.replacing || v.status === "initializing" || v.status === "failed"} onClick={() => action("REPLACE", {reason: v.mode === "guided" ? "sandbox" : "guided"})}>
            {v.mode === "guided" ? "Return to Explore" : "Start guided lesson"}
          </button>
          <span>One model. Charts and the lesson are optional.</span>
        </div> : null}
        {!v || state.replacing ? (
          <div className="initializing" role="status">
            <span className="status-dot" />
            {state.error
              ? "Simulation stopped. Restart to compute a fresh baseline."
              : "Computing a fresh baseline…"}{" "}
            <small>
              No synthetic metrics. The worker is running the model.
            </small>
          </div>
        ) : (
          <>
            {v.status === "running" && v.executionStyle === "fast" ? <p role="status" className="notice">Calculating 60 simulated seconds… <button onClick={() => action("CANCEL")}>Cancel calculation</button></p> : null}
            <p className="sr-only" role="status">{v.status === "finished" ? "Experiment complete. Results ready." : v.status === "paused" ? "Simulation paused." : ""}</p>
            <div className="workspace">
              <div className="main-column">
                <Topology
                  view={v}
                  onSelect={(selected) =>
                    dispatch({ type: "patch", patch: { selected } })
                  }
                  motion={state.motion}
                />
                <Metrics view={v} />
                {v.mode === "guided" ? <Suspense fallback={<p role="status">Loading guided lesson…</p>}><LessonPanel
                  view={v}
                  predictions={state.predictions}
                  onPrediction={(key, value) =>
                    dispatch({
                      type: "patch",
                      patch: {
                        predictions: { ...state.predictions, [key]: value },
                      },
                    })
                  }
                  onNext={next}
                  onRemedy={() => {
                    dispatch({
                      type: "patch",
                      patch: { predictions: {}, replacing: true },
                    });
                    action("REPLACE", {
                      reason: "apply",
                      stage: 5,
                      config: {
                        ...v.config,
                        cache: !v.config.cache,
                        db: v.config.cache ? "fast" : "normal",
                      },
                    });
                  }}
                /></Suspense> : <section className="card explore-comparison" aria-label="Run comparison"><h2>Compare experiments</h2>{v.comparison ? <ComparisonPanel view={v} /> : <p>Change an input and Run to compare results.</p>}</section>}
                {state.chartsVisible ? <div id="simulation-charts"><Suspense
                  fallback={
                    <div className="card chart-loading">
                      Loading chart display…
                    </div>
                  }
                >
                  <Charts key={`${v.mode}-${v.stage}-${v.config.rps}-${v.config.seed}`} history={v.history ?? []} spike={v.config.spike} />
                </Suspense></div> : null}
              </div>
              <aside>
                <Controls
                  view={v}
                  draft={state.draft}
                  canRun={canRun}
                  onEdit={edit}
                  onAction={action}
                />
                <section className="insight">
                  <div className="eyebrow">
                    <i
                      className={`status-dot ${v.observation.bottleneck !== "None" ? "amber" : ""}`}
                    />
                    LIVE EXPLANATION
                  </div>
                  <h2>
                    {v.observation.bottleneck === "None"
                      ? "Room to breathe."
                      : `${v.observation.bottleneck} is the constraint.`}
                  </h2>
                  <p>{v.insight}</p>
                  <small>
                    Evidence: ({v.observation.windowStart.toFixed(1)},{" "}
                    {v.observation.time.toFixed(1)}] virtual seconds
                  </small>
                </section>
                {state.selected ? (
                  <Inspector
                    view={v}
                    selected={state.selected}
                    onClose={() =>
                      dispatch({ type: "patch", patch: { selected: null } })
                    }
                  />
                ) : null}
                <div className="model-note">
                  <span className="eyebrow">MODEL NOTES</span>
                  <p>Educational simulation, not a benchmark</p>
                  <small>
                    {v.config.modelVersion} · seed {v.config.seed}
                    <br />
                    Fixed schedules · no real traffic
                  </small>
                </div>
              </aside>
            </div>
            <footer>
              <span>
                SystemScope <b>→</b> Learn the system behind the screen.
              </span>
              <span>Pure model. Virtual time. Reproducible evidence.</span>
            </footer>
          </>
        )}
        <AssumptionsPanel
          open={state.assumptions}
          onClose={() =>
            dispatch({ type: "patch", patch: { assumptions: false } })
          }
        />
      </main>
    </div>
  );
}
