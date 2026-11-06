# Implementation Plan: SystemScope MVP — Your App Just Went Viral

**Branch**: Actual checkout `master`; setup reported feature identifier `001-viral-traffic-mvp`.
No branch was created or switched by planning.
**Date**: 2026-11-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-viral-traffic-mvp/spec.md`.

## Summary

Deliver one single-screen input → result experience for a mobile/frontend engineer. Default
to Explore with editable inputs, headline metrics, comparisons, topology, and short causal
explanations. Charts and the guided Predict → Run → Explain lesson are separate opt-in
features. The lesson retains its five stages and prediction checks only while selected.
Explore traffic, API scaling, DB limits, and cache/DB relief without completing the lesson. Keep actual modeled arrivals,
admissions, successes, waits, latency, and memory accounting distinct and explain the evidence.

Use the constitution's static React/TypeScript/Vite application and one dedicated Web Worker.
The pure core advances a deterministic discrete-event model; the worker owns computation,
metrics, comparison evaluation, and bounded histories. React handles learner interactions,
formatting, Recharts, and fixed SVG/CSS topology. Publish static assets to GitHub Pages first;
keep root builds compatible with Cloudflare Pages. No backend, external runtime calls,
Docker dependency, persistence dependency, second engine, or additional learning scenario.

## Technical Context

**Language/Version**: TypeScript strict mode, ES modules; Node 24 LTS and bundled npm for
build/test only. Select mutually compatible stable tool releases at scaffolding, record the
exact Node patch, and commit package-lock.json; do not use floating versions in CI.

**Primary Dependencies**: React/React DOM, Vite/React plugin, Recharts, Tailwind CSS/Vite
plugin. Dev tooling: TypeScript, Vitest, Playwright Test, ESLint/TypeScript/React rules.
No router, Zustand, React Flow, RPC, backend framework, or generic simulation library.

**Storage**: Session memory only. Optional localStorage preferences/progress are deliberately
not needed in the first implementation; no simulation/history persistence.

**Testing**: Vitest pure-core, invariant/determinism, lesson-evaluation, and protocol tests;
Playwright real-worker production-build lesson and accessibility/routing flows. GitHub
Actions installs browsers directly. Core tests run in Node without browser globals.

**Target Platform**: Modern desktop and mobile browsers with module-worker support. Required
CI browser is Chromium; release smoke checks include current Firefox and WebKit. Validate
360 px and 1,280 px, keyboard and reduced motion. Document tested versions, not universal support.

**Project Type**: One static web application with an internal pure simulation module.

**Performance Goals**: Up to 10,000 modeled arrivals/s, eight replicas, 60 virtual seconds;
acknowledge pause/reset/cancel within 250 ms on the specified reference environment; at least
two visible metric updates per wall-clock second while running; normal progress output at
100 ms virtual boundaries, with progress sends capped at ten per wall-clock second and coalesced. Playback may lag with an explicit indicator but never
skip authoritative events. Validate 1x/4x; no throughput benchmark claims about real services.

**Constraints**: Exact preset timing in 100-microsecond integer quanta; 10 ms step boundaries;
384 admitted requests, 18 MiB modeled buffers, 4,000 scheduled events, 100,384 successful
samples, 10,001 histogram bins, 1,000 rolling statistics buckets, 600 chart points/series,
one prior summary, five lesson summaries, one continuation snapshot; optional logs capped
at 1,000. One unacknowledged progress message and bounded commands. See data model for units.

**Scale/Scope**: One screen, default Explore controls and five optional guided stages over the same core;
25 s/stage, 60 s maximum sandbox. Five traffic presets, fixed resource assumptions and two
stage-5 remedies. Optional arbitrary slider and saved progress deferred; all core stories remain.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The pre-research review found no conflict with constitution v2.0.0. Phase 1 recheck below
confirms design compliance, not executed implementation or release evidence.

| Gate / principles | Before research | After design / required implementation evidence |
| --- | --- | --- |
| Scope and learning (I, IV) | Pass: one persona and one viral scenario | Pass: story/lesson mapping, single-screen UI contract, no new scenario or editor |
| Honest model and contracts (II, III, VI) | Pass: fixed assumptions and separate metrics | Pass: exact time, resource lifecycle, successful-only latency, typed worker protocol, immutable config; D1–D3 retain existing fixtures; amended fast/optional flows require new equality and UI evidence |
| Automated verification (V, VII) | Pass: required checks identified | Pass design: Vitest core/protocol, Playwright real worker, clean install/typecheck/lint/build/CI; executable results required before merge |
| Accessibility (VIII) | Pass: required mobile/keyboard/motion behavior | Pass design: text charts, focus rules, 360/1,280 px and reduced-motion test matrix; no accessibility claim from screenshots alone |
| Performance and safety (IX, X) | Pass: finite core, worker, no real traffic | Pass design: exact budgets, cooperative cancellation, credit/backpressure, stale rejection; reference-device load/cancel measurements required |
| Static deployment | Pass: root and repository base required | Pass design: base-aware worker/assets, no pathname router/server rewrite, two-base production smoke test and actual-host gate |

All ten principles apply; no exceptions or waivers. Optional guided learning retains Predict →
Run → Explain and its release test; Explore keeps causal explanations without mandatory
prediction forms. No constitution amendment is needed. Setup/CI/static-host work exists solely
to deliver and verify this scenario. Simulated API/DB resources never become app infrastructure.
The npm install gate is retained explicitly; CI may use npm ci for the main reproducible job
in addition to a clean npm install smoke check against the committed lockfile.

## Project Structure

### Documentation (this feature)

```text
specs/001-viral-traffic-mvp/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── worker-protocol.md
    └── ui-contract.md
```

`tasks.md` retains completed baseline work and appends unchecked amendment tasks. This
planning revision changes no implementation or constitution; earlier validation evidence
describes the previous UI and does not prove the new default flow.

### Source Code (repository root)

Implemented layout; see validation.md for executed checks and remaining release gates:

```text
src/
├── main.tsx
├── app/
│   ├── App.tsx
│   ├── sessionReducer.ts
│   └── simulationClient.ts
├── simulation/
│   ├── config.ts
│   ├── model.ts
│   ├── scheduler.ts
│   ├── resources.ts
│   ├── observations.ts
│   └── snapshot.ts
├── lesson/
│   ├── stages.ts
│   └── evaluate.ts
├── worker/
│   ├── protocol.ts
│   ├── validate.ts
│   ├── controller.ts
│   └── simulation.worker.ts
├── components/
│   ├── Topology.tsx
│   ├── Controls.tsx
│   ├── Metrics.tsx
│   ├── Charts.tsx
│   ├── Inspector.tsx
│   ├── LessonPanel.tsx
│   └── AssumptionsPanel.tsx
└── styles.css
tests/
├── unit/
├── contract/
├── fixtures/
└── e2e/
scripts/
├── serve-static.mjs
└── check-routing.mjs
.github/workflows/
├── ci.yml
└── pages.yml
index.html
package.json
package-lock.json
tsconfig*.json
vite.config.ts
vitest.config.ts
playwright.config.ts
eslint.config.js
README.md
LICENSE
```

**Structure Decision**: One npm project, no workspaces/packages or backend folder. Simulation
imports only simulation modules/plain contracts; it never imports React, lesson UI, worker
scheduler, clock, or browser globals. Lesson evaluation is pure domain logic callable by the
worker/tests. Worker owns current/previous/reference summaries. React receives read-only
observations and worker-calculated comparisons; its reducer owns drafts, selection, dialog,
mode, and presentation preferences. Dev static-serving scripts are test tools only.

## Phase 0 — Research Decisions

Completed design research is recorded in [research.md](research.md):

- R1: compatible Node/npm/tooling policy and minimal dependencies.
- R2: initial static host, configurable base, emitted module worker, no pathname router.
- R3–R4: exact finite-time scheduler, resource events, bounded exact histogram/windows.
- R5: cooperative pacing/cancellation and message credit; no whole-run synchronous loop.
- R6: reducer/context presentation, no extra state library or mandatory persistence.
- R7: numerical targets validated first by engine fixtures, then actual browser/static builds.

No blocking unknown remains. The 2026-11-06 revision reuses inspected source and established
stack; no new dependency or technology research is needed. Sources and alternatives are documented there. Exact package
patch selection happens with the lockfile during implementation, not an unverified install here.

## Phase 1 — Design and Contracts

Generated [data-model.md](data-model.md), [worker protocol](contracts/worker-protocol.md),
[UI/static contract](contracts/ui-contract.md), and [quickstart.md](quickstart.md).

### Deterministic model

Use integer event time and canonical tie ordering; preserve the exact v1.1 routing, cache hit
schedule, CPU/worker/connection/DB lifecycle, and deadline cancellation from the spec. One
10 ms transition consumes explicit state and produces a distinct next state/effects with
no external side effects. Use bounded copy-on-write storage to avoid cloning entire retained
histories per event; tests must prove input state does not mutate. No arbitrary capacity
formulas replace event results. Seed remains explicit even though v1.1 schedules do not vary.

Use an indexed heap to remove cancelled events; resource FIFO queues remain worker-bounded.
Integrate queue/busy-time across actual events. Exact 100-microsecond successful latencies
permit a 10,001-bin histogram; exact 10 ms window buckets support every visible step.
Reset initialization runs the same core to the mode-specific baseline endpoint, never prewritten values.

### Worker coordination and view protocol

Explore initialization/reset computes a full 60-second baseline, then presents final results.
Run combines draft validation, replacement/archive, and unpaced execution in one user action.
Watch performs the same replacement but starts paced playback. Replay uses the selected
execution style; guided Run/Step and prediction gates remain unchanged. Keep the existing
10 ms pure step and exact event semantics. Add shell execution style fast/playback, never a
second model. Fast execution processes bounded cooperative batches and yields between them
for control messages; begin with at most 10 core steps per batch, reduce if measurements miss
250 ms cancellation. Core work never reads a clock. Fast runs remove playback delays, not
model events; final observations and summaries must exactly match Watch at the same endpoint.
Add an atomic REPLACE execution intent paused/fast/playback to avoid separate Apply then Run
and races. Invalid drafts leave existing applied results intact. Edits pause/cancel active
execution before staging. Preserve truthful complete/partial comparisons. The unchanged
60-second constant-traffic Explore model reports the final trailing window (50,60] s.
Validate baseline/1,000-RPS fast runs within SC-011's 5-second reference-device budget and
maximum-load cancellation separately. Busy state, completion, and cancelled partial results
must be explicit; hard termination is recovery, never an ordinary fast-mode success.

One worker hosts one active model. Playback schedules one 10 ms step per yielding turn;
fast execution uses the bounded batches above. All real pacing stays outside the core. Every run/replacement has identity; every view
has sequence. Main thread rejects old generations/runs and earlier same-run observations.
One progress credit prevents posted-message accumulation; final/ack/error replies are not
silently dropped. Cancellation preserves in-flight in partial summaries; it is not a modeled
failure. Hard worker termination is explicit recovery, with unavailable summary if needed.

### UI and explanations

Default to Explore (the existing sandbox mode internally); do not create a second engine.
Keep charts closed on every fresh session. Dynamically import/mount Charts and its Recharts
chunk only after Show Charts; unmount on close. Preserve existing bounded engine chart
sampling (at most 600 points/series), but serialize/send history only while subscribed.
Add a validated chart subscription to the worker protocol; enabling returns the complete
retained current-run history, then missing samples under existing progress credit. Disabling
stops history serialization, not model execution or headline observations. Keep subscription
and visibility synchronized across replacement/recovery and discard stale history by run ID.
Neither selection changes virtual time, model inputs, summaries, or comparison results.
Spike markers derive from the actual schedule; constant-traffic Explore has no spike marker.

Lazy-load/mount the lesson interface only after Start Guided Lesson. Do not display its
track, predictions, or stage locks in Explore. Opening charts never starts a lesson; starting
a lesson never opens charts. The constitution's Predict → Run → Explain experience remains
fully available in the selected lesson; causal explanations remain in default Explore.

Use SVG/CSS topology, Recharts series, native labeled controls, and a reducer/scoped context.
The same worker model powers guided stages and sandbox; switching modes replaces the run,
never mutates its config or endpoint. Enter sandbox at zero paused for 60 s with applied
resources/seed/cache and constant offered target resolved at cancellation. Guided reentry
recomputes default baseline to 5 s paused. Archive Last run, clear lesson evidence/drafts
with notice, and preserve speed/motion as specified. Keep animation counts fixed,
expose text/table chart evidence, and respect reduced motion separately from simulation pause.
Prediction directions and evidence are evaluated by pure domain functions in the worker;
React formats those authoritative results. Never announce every animation tick to screen readers.

### Validation order and implementation slices

For the amendment, retain completed baseline tasks T001–T069 and their evidence. Execute
new tasks T072 onward before closing T070/T071 release gates: protocol v2/fast execution and
subscription tests → Explore default and opt-in UI → scaling comparisons → replay/cancel →
a11y/static and performance revalidation. Completed historical tasks do not prove revised
acceptance criteria. No model constants, numerical targets, dependencies, or architecture
change. The original implementation sequence below is retained as baseline history.

This sequencing informs `$speckit-tasks`; it is not a task checklist or implemented work.

1. Scaffold toolchain and import boundaries; implement model/default validators, scheduler,
   resource transitions, snapshots, observation calculations, and engine tests.
2. Execute D1–D3 and invariant/replay/cache-boundary fixtures. Investigate deviations before
   building UI around unsupported claims. Keep thresholds/assumptions unchanged without an
   explicit specification correction supported by evidence.
3. Implement typed worker shell and client, credit/cancellation/stale protection, generic
   replacement/reset accepted/settled handling, and structural prediction-required checks.
   Every foundation protocol/client case written in T021 must pass at T026 alongside the
   real-worker startup test; no subset or skipped failure is implicit. Lesson scoring/stage
   integration and adversarial UI regressions are added and gated in their story phases.
   Verify reset computes a genuine baseline before proceeding to story UI.
4. Implement the single-screen experiment, lesson/evidence, comparisons, aggregate topology,
   charts, inspectors, accessibility, and essential interaction tests.
5. Complete CI, clean-clone guide, root/subpath routing checks, actual-host smoke evidence,
   maximum-load cancellation measurements, and the under-five-minute reviewer demo.

### Traceability and evidence

| Specification | Design location | Planned verification |
| --- | --- | --- |
| FR-001–FR-004 | UI contract; Explore default and opt-in lesson transitions | Fresh-session unlocked controls, optional lesson gating, independent charts, pending edits/replay |
| FR-005–FR-009 | Observation model; UI contract; chart subscription | Exact rates/percentiles/counts, real retained chart evidence, hidden-chart transport, comparison windows |
| FR-010 | Core/event/window design | D1–D3, invariants, frozen inputs, same-seed/continuation equality |
| FR-011 | Worker protocol and finite budgets | Maximum-load pause/reset, stale replies, bounded heap/history/transport |
| FR-012–FR-013 | Ledger/glossary UI and chart text | Model caveats, numeric evidence, keyboard/mobile/motion flows |
| FR-014–FR-015 | Static worker architecture; session-only choice | Import restrictions, production network allowlist, no storage dependency |
| FR-016–FR-017 | Quickstart and root/subpath/static-host gate | Clean install/typecheck/unit/build/E2E/CI, asset/routing smoke tests |
| SC-001–SC-012 | Spec and quickstart validation matrix | Numeric fixtures, 1x manual timing, performance/accessibility/deployment evidence |

### Risks and safeguards

- Numerical stage targets are plausible from capacity bounds but not proved by arithmetic.
  Engine fixtures are the first blocking implementation check; never fake expected charts.
- Browser scheduling can throttle in background tabs. Show playback lag, preserve model
  ordering, and measure normal cancellation on the documented reference device/browser.
- Pure snapshots can cause copying pressure if implemented naively. Bound/page histories,
  measure maximum load, and keep external pure-transition semantics under mutation tests.
- Base misconfiguration often affects worker/CSS loading. Test built artifacts under a real
  repository prefix without SPA fallback and smoke-test the deployed URL.
- Reset/replacement can race with progress. Sequence/identity rejection and credit tests
  cover both cross-run and same-run stale messages.

Post-design constitution review: all design gates pass without exceptions. Unit/build/E2E,
performance, accessibility, and deployed routing gates are deliberately pending executable
implementation and release evidence; planning does not claim those checks passed.

## Complexity Tracking

No constitution violations or added architectural layers require justification. Indexed
cancellation, exact histogram, and bounded worker messaging are limited mechanisms needed
for deterministic finite-resource simulation and cancellation; no speculative extension
framework, editor, backend, or persistence layer is planned.
