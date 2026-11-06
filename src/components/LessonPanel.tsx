import { stages } from "../lesson/stages";
import type { View, Predictions, Direction } from "../worker/protocol";
import ComparisonPanel from "./ComparisonPanel";
export default function LessonPanel({
  view,
  predictions,
  onPrediction,
  onNext,
  onRemedy,
}: {
  view: View;
  predictions: Partial<Predictions>;
  onPrediction: (key: keyof Predictions, value: Direction) => void;
  onNext: () => void;
  onRemedy?: () => void;
}) {
  const stage = stages[view.stage - 1];
  return (
    <section className="card lesson-panel">
      <div className="section-heading">
        <h2>
          03 <span>Predict → Run → Explain</span>
        </h2>
        <span className="eyebrow">STEP {view.stage} OF 5</span>
      </div>
      <h3>
        {view.mode === "sandbox"
          ? "Your system. Your experiment."
          : stage.title}
      </h3>
      <p>
        {view.mode === "sandbox"
          ? "Adjust one control, apply a fresh run, and compare with Last run. The same deterministic model powers the lesson and sandbox."
          : stage.hint}
      </p>
      {view.mode === "guided" &&
      view.stage > 1 &&
      view.status !== "finished" ? (
        <div className="predictions">
          {(
            [
              ["throughput", "Completed throughput"],
              ["latency", "p95 response latency"],
              ["queue", "Mean queued requests"],
            ] as const
          ).map(([key, label]) => (
            <fieldset key={key} disabled={view.status === "running"}>
              <legend>{label}</legend>
              <div>
                {(["increase", "same", "decrease"] as const).map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name={key}
                      data-testid={`prediction-${key}-${value}`}
                      checked={predictions[key] === value}
                      value={value}
                      onChange={() => onPrediction(key, value)}
                    />
                    <span>
                      {value === "same"
                        ? "≈ Same"
                        : value === "increase"
                          ? "↑ Increase"
                          : "↓ Decrease"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          <small>
            Compare final 10-second windows. Approximately same means within
            ±5%.
          </small>
        </div>
      ) : null}
      <ComparisonPanel view={view} />
      {view.mode === "guided" &&
      view.status === "finished" &&
      view.stage < 5 ? (
        <button
          className="primary next"
          onClick={onNext}
          aria-label="Next stage"
        >
          Next stage →
        </button>
      ) : null}
      {view.mode === "guided" &&
      view.stage === 5 &&
      view.status === "finished" ? (
        <button className="next" onClick={onRemedy}>
          Try the other remedy
        </button>
      ) : null}
    </section>
  );
}
