---
description: "Dependency-ordered implementation tasks for the SystemScope viral-traffic MVP"
---

# Tasks: SystemScope MVP — Your App Just Went Viral

**Input**: Design documents in `specs/001-viral-traffic-mvp/`.
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [worker protocol](contracts/worker-protocol.md),
[UI/static contract](contracts/ui-contract.md), and [quickstart.md](quickstart.md).
**Governance**: Constitution v2.0.0; single static app and dedicated browser worker only.
**Tests**: Required by specification and constitution. Write behavioral tests first, observe
meaningful failures, then implement and make them pass. No application code is created by
this task-generation phase. Checkboxes now track executed implementation; validation.md records actual results and
remaining release gates.

**Organization**: Shared engine/protocol foundations precede independently verifiable story
increments. P0/P1 match the spec; all four stories are mandatory for the first release.

## Format: `[ID] [P?] [Story] Description`

- `[P]` permits concurrent work only after the named prerequisites are complete, on separate
  files. It does not waive dependencies or authorize automatic agent delegation.
- `[US1]`–`[US4]` map exactly to the four specification stories; shared phases have no story tag.
- Every task includes concrete repository-relative paths. Do not expand tasks into backend,
  persistence, generic editor, second engine, or optional slider work.
- `specs/001-viral-traffic-mvp/validation.md` is the implementation evidence record created
  by T020 and extended at later checkpoints. Record actual results, failures, and pending
  release gates; do not write assumed passing results.

## Path Conventions

One npm project at repository root: `src/`, `tests/`, `scripts/`, `.github/workflows/`.
`src/simulation/` is pure and independent of browser/UI/clock/storage/network globals;
`src/worker/` hosts/paces it; `src/app/` coordinates presentation only. All references to
API replicas, DB, connections, and simulated workers are model resources, not app services.

## Amendment execution note (2026-11-06)

T001–T069 retain their completed baseline history; their original descriptions below are
historical, not instructions to restore guided-first behavior. T070/T071 remain unchecked
release gates and now depend on the amendment T072–T088. Execute the amendment phases below
first. The revised spec/contracts take precedence wherever baseline wording differs. No code
was changed or task newly completed by this clarification/planning pass.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the exact planned toolchain and executable checks without a server.

- [X] T001 Scaffold the static React/TypeScript/Vite project in `package.json`, `package-lock.json`, `index.html`, `src/main.tsx`, `src/app/App.tsx`, `src/styles.css`, `.nvmrc`, and `.gitignore`; pin a supported Node 24 LTS patch and mutually compatible stable dependencies from plan.md, install locally bundled Recharts/Tailwind, and define dev/typecheck/lint/test:unit/build/test:e2e/test:routing scripts without placeholder-success checks or runtime CDN assets.
- [X] T002 Configure strict app/core/worker/tooling TypeScript projects in `tsconfig.json`, `tsconfig.app.json`, `tsconfig.core.json`, `tsconfig.worker.json`, and `tsconfig.node.json`, plus `eslint.config.js` and `vite.config.ts`; isolate browser/worker globals, forbid React/clock/timer/random/network/storage imports in core, compile Tailwind statically, and accept configurable Vite base with build-argument passthrough.
- [X] T003 [P] Configure Node-only Vitest suites in `vitest.config.ts` and `tests/fixtures/testConfig.ts` with unit/contract discovery, deterministic fixtures, mutation checks, and failure when required suites contain no tests; no browser environment for the pure core.
- [X] T004 [P] Configure real-browser production-build testing in `playwright.config.ts` and `scripts/serve-static.mjs`; mount static files under an explicit prefix, return genuine missing-file 404s without SPA fallback, and support desktop/narrow/reduced-motion projects without Docker or a production application server.
- [X] T005 [P] Establish `.github/workflows/ci.yml` using the pinned Node, reproducible npm ci, browser installation, typecheck/lint/unit/build/E2E stages, and a clean npm install smoke check that rejects lockfile drift; required suites may not be bypassed as the feature grows (full routing/release wiring follows T066).

**Checkpoint**: Tooling/scripts are defined and production output can include a local worker;
no mocked model data is presented as a working experiment.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement and verify the shared coherent model before relying on UI explanations.
No story UI work begins until T026 passes. Test batches may start only after their shared
schemas/fixtures are stable; expected failures precede implementing missing behavior.

- [X] T006 Write configuration/time/default validation tests in `tests/unit/config.test.ts`, covering all presets, schedule boundaries, seed limits, finite numbers, immutable inputs, and rejection of unsupported model values rather than coercion or silent clamping.
- [X] T007 Implement `src/simulation/config.ts` with the data-model constraints “Literal `viral-v1.1`”, `Unsigned 32-bit integer`, `Integer 1–8`, `slow / normal / fast`, `Boolean`, `Rational numerator/denominator`, `250,000 guided; 600,000 sandbox`, and `32 workers, 2 CPU slots, 16 ingress positions, 8 connections per replica; 4 shared DB slots; service/deadline/memory weights from A-04–A-10`; support exactly 100/500/1,000/5,000/10,000 RPS, learner cache 4/5 and core fixtures 0/1 or 1/1, contiguous schedules, no arrival at zero, old endpoint arrival before new segment's first interval, and seed `0–4,294,967,295`.
- [X] T008 Define domain state/types in `src/simulation/model.ts`, `src/simulation/resources.ts`, and `src/simulation/observations.ts`: quote/enforce `nowQ` range `0–600,000`, `100-quanta (10 ms) boundaries`, `All numeric inputs must be finite`, `Null represents unavailable metrics`, `Percentages range 0–100`, and `Domain data is structured-cloneable`; include request identity/replica/arrival/deadline/phase-ready/completion/held-resource/cache fields, canonical phase enum from data-model.md, immutable run config, slot ownership, counters, snapshot metadata, and nullable observation fields without executable UI dependencies; run status is `initializing/ready/running/paused/finished/cancelled/failed`, lesson stage is `1–5` with `predicting/running/explaining`, and cloneable data contains no functions/DOM/class behavior.
- [X] T009 Create deterministic baseline/spike/scaling/cache/DB and boundary fixtures in `tests/fixtures/viralCases.ts`, using config.ts factories rather than a second model; define stage windows `(15,25]`, cache extremes, no-completion samples, full queues, ties/deadlines, and maximum-load configurations.
- [X] T010 [P] Write indexed-scheduler tests in `tests/unit/scheduler.test.ts` for canonical ordering, equal timestamps, eager event cancellation, smallest free slot tie rules, exact 100-microsecond timing, and the `4,000` event cap; prerequisites T007–T009.
- [X] T011 [P] Write resource/lifecycle tests in `tests/unit/resources.test.ts` for least-outstanding routing, FIFO ready-time/request-identity ties, 16 ingress positions/32 workers/2 CPU slots/8 connections per replica, four global DB slots, cache hit/miss CPU cost, held connections/workers, deadline cleanup, rejection, and exactly-once outcomes; prerequisites T007–T009.
- [X] T012 [P] Write observation tests in `tests/unit/observations.test.ts` for `(max(0,t−10),t]`, null empty p50/p95, nearest-rank successful-only percentiles, exact counts/rates/slot-time/queue integrals, left-boundary expiry, memory-weight replacement, interval failure charts versus run totals, and the successful-latency sampling caveat; prerequisites T007–T009.
- [X] T013 [P] Write purity/invariant/snapshot tests in `tests/unit/invariants.test.ts` and `tests/unit/snapshot.test.ts`, preserving old input snapshots, request conservation, disjoint active/wait sets, finite history, identical replay/continuation, and unfinished in-flight at the run endpoint; prerequisites T007–T009.
- [X] T014 [P] Write the three numerical demonstrations in `tests/unit/demonstrations.test.ts`: D1 baseline 95–105 completed RPS with zero failures versus spike below 400 with higher p95/queue/failures; D2 four replicas improve ≥10%, four/eight achieve 350–420 RPS within 5% with DB ≥90% and wait; D3 each remedy achieves ≥850 RPS and ≥50% fewer timeouts+rejections, all in matching `(15,25]` windows; prerequisites T009.
- [X] T015 Implement the bounded indexed event heap in `src/simulation/scheduler.ts`, exact integer-time ordering and cancellation handles, at most one next-arrival and schedule-boundary entry, immediate removal of terminal counterparts, and a hard `4,000` cap; satisfy T010 without lazy cancelled-entry accumulation.
- [X] T016 Implement resource transitions in `src/simulation/resources.ts`, preserving the worker/CPU distinction, fixed pre/post CPU/lookup and DB durations, FIFO queues, exact rational cache schedule, connection holds, success-at-deadline priority, ingress promotion, and complete timeout cleanup; satisfy T011 without modifying DB capacity when replicas scale.
- [X] T017 Implement exact aggregates in `src/simulation/observations.ts`: `1,000 closed 10 ms buckets plus current accumulator`, `100,384` successful samples, `10,001` histogram bins, `600` chart points per series emitted each 100 ms, event-time integrals/peaks, separate outcome/cache counters, current and cumulative metrics, instantaneous versus averaged resource utilization, and bounded peak-preserving history; satisfy T012 and data-model.md window rules.
- [X] T018 Implement pure state transitions in `src/simulation/model.ts`, coordinating config/scheduler/resources/observations with 10 ms exposed steps, all exact intervening events and canonical tie phases, no external side effects, no mutation of prior state, bounded copy-on-write storage, at most `600,000` arrivals/`6,000` steps/`384` in-flight/`18,874,368 bytes (18 MiB)` modeled memory, zero unmodeled random errors, and optional diagnostic logs disabled by default/capped at `1,000`.
- [X] T019 Implement canonical snapshot/restore in `src/simulation/snapshot.ts` including config/model version/seed, virtual time, event ordering/handles, request/resource state, schedule/cache ordinals, counters/windows/history, and one continuation snapshot; satisfy T013 using the same pure core and exclude wall-clock/transport identities from determinism comparisons.
- [X] T020 Execute T006/T010–T014 against T015–T019 and create `specs/001-viral-traffic-mvp/validation.md` with real D1–D3 results and invariant/replay/boundary outcomes; fix implementation defects before proceeding, and explicitly document/escalate any genuine spec conflict instead of silently changing thresholds, assumptions, or metrics.
- [X] T021 Write message/controller/client contract tests in `tests/contract/protocol.test.ts` and `tests/contract/client.test.ts` for supported versions, malformed numeric payloads, invalid transitions, generic execution/pause/step, structural prediction-required Run/Step for an explicit guided-stage context (not lesson scoring), duplicate/conflicting IDs, stale generation/run/sequence, cancellation, one-credit progress, terminal delivery, and accepted-versus-settled replacement acknowledgments before implementing the adapter.
- [X] T022 Implement shared typed messages and runtime validation in `src/worker/protocol.ts` and `src/worker/validate.ts`, with protocol version `1`, model version `viral-v1.1`, `nonnegative safe integers` for generation/run/command/observation IDs, monotonically increasing/no-reuse identities, all commands/replies/error codes from worker-protocol.md, nullable unavailable observations, finite enum/range/array validation, and bounded last-control deduplication rather than a growing ID map.
- [X] T023 Implement `src/worker/controller.ts` and `src/worker/simulation.worker.ts` with one active core, one 10 ms step per yielding scheduling turn, clock/timers only in the shell, 1x/4x pacing, genuine cancellable initialization to 5 s, one unapplied progress credit, at most ten wall-clock progress sends/s, retained virtual chart evidence, reliable bounded control/final/error delivery, generic REPLACE/CANCEL/reset/replay handlers with accepted-versus-settled acknowledgments, structural guided-stage prediction presence checks, and typed protocol dispatch; implement every worker case written in T021 before T026, without depending on later lesson scoring/stage integration.
- [X] T024 Implement `src/app/simulationClient.ts` with Vite's base-aware emitted module-worker construction, one normal command plus one superseding cancel/replacement maximum, credit acknowledgments, active generation/run/sequence filtering, graceful errors and lifecycle cleanup; no model calculations or browser storage dependency; implement every client case written in T021 before T026, including replacement acknowledgment/credit handling, without deferring handlers to US3.
- [X] T025 Connect the real worker to the minimal application bootstrap in `src/main.tsx` and `src/app/App.tsx`, displaying initialization/error/paused-baseline states only from authoritative observations; keep strict-mode mount/unmount from creating orphan workers or duplicated runs, and never substitute hardcoded baseline numbers.
- [X] T026 Add and execute `tests/e2e/worker-startup.spec.ts` against built static files to verify the emitted worker computes the actual 5 s paused baseline, same inputs reproduce it, and production requests are own assets only; run typecheck/lint/unit/build and all protocol/client tests written in T021 with no skipped cases or undefined foundation subset, and record evidence in `specs/001-viral-traffic-mvp/validation.md` before story implementation.

**Checkpoint**: Pure engine D1–D3 and foundational worker gates have actual evidence. The
numerical targets are not assumed passed because their capacity arithmetic seems plausible.

## Phase 3: User Story 1 — Predict and observe a traffic spike (Priority: P0)

**Goal**: One screen starts with a real working baseline, collects three predictions, runs
the spike, and presents separate arriving/completing work and honest causal evidence.
**Independent Test**: Fresh session → stage 1 baseline → predict stage 2 → Run/Step spike →
read matching-window throughput/p95/queue outcomes, without scaling or saved progress.

### Tests for User Story 1

- [X] T027 [P] [US1] Write baseline/spike lesson evaluation tests in `tests/unit/lesson-spike.test.ts`, covering required predictions, ±5% approximately-same classification, zero reference, null unscored latency, successful sample count/window metadata, and at least two actual evidence values per explanation; prerequisite T026.
- [X] T028 [P] [US1] Write `tests/e2e/spike-journey.spec.ts` for a fresh single-screen baseline, no landing/account, three accessible prediction choices, blocked Run/Step with missing answers, aggregate topology, all metric/time-series labels, and actual stage-2 before/after evidence using the real worker; prerequisite T026.

### Implementation for User Story 1

- [X] T029 [US1] Define authoritative stage/config metadata in `src/lesson/stages.ts` for all five planned stages, fixed 25 s endpoints/5 s spike boundary/final 10 s reference windows and seed policy, with stage 1 initialization at 5 s; reuse config factories/fixtures, and expose the baseline/spike journey first without a second engine.
- [X] T030 [US1] Implement pure prediction/direction/evidence evaluation in `src/lesson/evaluate.ts` for successful throughput, completed p95 and time-weighted mean queue, classifying on unrounded data, zero/null cases, and referencing actual observations/assumption IDs rather than illustrative claims; satisfy T027.
- [X] T031 [US1] Integrate baseline/spike lesson state, scoring/reference evidence and required predictions with the already-tested foundation presence gate in `src/worker/controller.ts`, including RUN and STEP, reliable complete summaries, automatic 25 s pause/finish, bounded stage references, and worker-calculated comparisons/explanations.
- [X] T032 [US1] Implement session presentation state in `src/app/sessionReducer.ts` and the single-screen layout in `src/app/App.tsx`, consuming immutable worker views and owning drafts/selection/dialog/mode only; do not calculate authoritative rates, percentiles, directions, or resource state in React.
- [X] T033 [P] [US1] Build fixed SVG/CSS topology in `src/components/Topology.tsx` with Clients → API replicas → Database and optional cache path, aggregate flow explanation, component selection events and numeric/text health labels, at most `50 moving marks per topology link`, and no per-request element; prerequisite T032's props/actions contract.
- [X] T034 [P] [US1] Build metric readouts in `src/components/Metrics.tsx` with offered target versus observed offered/admitted/completed RPS, sample-counted p50/p95/N/A, queue versus in-flight, separate timeout/rejection/unmodeled-error counts/rates, estimated MiB and resource percentages, virtual window and model/seed labels; prerequisite T032.
- [X] T035 [P] [US1] Build bounded Recharts plots in `src/components/Charts.tsx` for offered/admitted/completed rates, p50/p95, queue, timeout/rejection interval counts and estimated working memory, synchronized virtual-time axes/spike marker/units, text summaries, peak-preserving ranges and `600` samples/series; no frontend metric reconstruction; prerequisite T032.
- [X] T036 [US1] Implement and integrate native labeled controls and baseline/spike prediction/explanation in `src/components/Controls.tsx`, `src/components/LessonPanel.tsx`, and `src/app/App.tsx`, including guided locks, Run/Pause/Step and speed, window/sample labels and visible “Educational simulation, not a benchmark”; add the always-visible Assumptions trigger and a basic truthful defaults/limitations panel in `src/components/AssumptionsPanel.tsx` (full ledger/access work follows in US4), using only worker-backed results from T031 and components T033–T035.
- [X] T037 [US1] Run T027/T028 plus D1 and foundational regressions, verify all required spike chart/readout labels and the unsaturated baseline explanation and the spike CPU-saturation explanation, both backed by actual observations, and append observed outcomes to `specs/001-viral-traffic-mvp/validation.md`; do not mark US1 complete from screenshots or mocked data.

**Checkpoint**: First useful demo increment: baseline → Predict → Run → Explain spike. This
is not the complete first release; remaining stories and release gates are still mandatory.

## Phase 4: User Story 2 — Find and relieve the next bottleneck (Priority: P0)

**Goal**: Scale API replicas, demonstrate the DB plateau, and compare cache or faster DB.
**Independent Test**: Use defined one/four/eight-replica and remedy fixtures, inspect evidence
without requiring prior prediction history, then validate the complete guided stage sequence.

### Tests for User Story 2

- [X] T038 [P] [US2] Write `tests/unit/lesson-scaling.test.ts` for API/DB simultaneous evidence, no-saturated-bottleneck state, 70%/90% window thresholds, DB wait precedence, stage-4 reference retention and both stage-5 remedies, fixed 4/5 realized cache assumptions versus zero/perfect hits, and no universal cache capacity multiplier; prerequisite T037.
- [X] T039 [P] [US2] Write the real-worker five-stage/both-remedies flow in `tests/e2e/scaling-remedies.spec.ts`, checking D2/D3 values, matched windows, configuration differences, Next Stage/Replay Stage, required predictions and actual explanations rather than stage-name assertions; prerequisite T037.

### Implementation for User Story 2

- [X] T040 [US2] Extend `src/lesson/evaluate.ts` and `src/lesson/stages.ts` with API-scaling/DB-constraint/remedy evidence, cacheable-read/lookup-cost caveats, observed rather than expected bottleneck explanations, and stage-5 cache OR fast-DB choice while eight replicas stay fixed; satisfy T038 without changing core assumptions.
- [X] T041 [US2] Complete stage advance, reference summary retention and COMPARISON delivery in `src/worker/controller.ts`, retaining up to `five guided reference summaries` and `one Last run`, always comparing either stage-5 replay to stage 4, and refusing to score absent reference observations as if they existed.
- [X] T042 [P] [US2] Extend `src/components/Controls.tsx` for guided stages 3–5 and explicit remedy selection/locked controls with visible cache hit assumptions; preserve identical input configuration semantics and no live queue migration; prerequisite T041's state contract.
- [X] T043 [P] [US2] Extend `src/components/Metrics.tsx` and `src/components/LessonPanel.tsx` with side-by-side headline comparisons, seed/model/window/sample labels and actual delta/evidence for scaling/DB/cache, including percentage suppression on zero/null baselines; prerequisite T041.
- [X] T044 [P] [US2] Extend `src/components/Topology.tsx` with scaled replica groups, DB wait/congestion, cache bypass flow and configured/realized hit evidence, keeping aggregate count limits and distinct CPU/worker/DB representations; prerequisite T041.
- [X] T045 [US2] Execute T038/T039 and D1–D3, verify both independent remedies and the four-to-eight-replica plateau, and record actual quantitative outcomes/explanation evidence in `specs/001-viral-traffic-mvp/validation.md` before declaring the five-stage lesson complete.

**Checkpoint**: Guided lesson includes all five stages; API scaling never changes global DB
capacity, and cache changes DB visit demand while retaining API/lookup cost.

## Phase 5: User Story 3 — Inspect, pause, reset, and reproduce (Priority: P0)

**Goal**: Complete sandbox, detailed inspection, repeatable controls and race-safe comparison.
**Independent Test**: Load a sandbox fixture, inspect/pause/step, edit/restart/discard, replay
same inputs, and reset under overload while injecting stale results in contract tests.

### Tests for User Story 3

- [X] T046 [P] [US3] Write `tests/contract/replacement.test.ts` for early invalidation and two-phase replacement, null accepted observation versus settled baseline, sequence/credit retirement, obsolete commands, cancellation without fabricated request outcomes, bounded control queues, guided-to-sandbox and return-guided replacement with pending edits/late results, failed-worker recovery and unavailable partial summary; extend the already-passing T021 contracts rather than deferring their behavior; prerequisite T045.
- [X] T047 [P] [US3] Write `tests/e2e/replay-controls.spec.ts` for sandbox knobs/seed bounds, paused no-progress, exact Step, 1x/4x same-time equality, pending edits/Discard/Apply & Restart, Reset preserving applied seed and partial Last run, replay from zero, component inspection, and 60 s no-drain endpoint; explicitly test a running guided stage with drafts entering sandbox at t=0 paused with a new 60-second endpoint/applied settings, then returning to default guided baseline at 5 s with recomputed references, notices, old summary retention and stale-result rejection; prerequisite T045.

### Implementation for User Story 3

- [X] T048 [US3] Integrate guided/sandbox mode replacements and adversarial regressions with the existing foundation REPLACE/CANCEL/reset/replay and control-supersession handlers in `src/worker/controller.ts`, preserving in-flight in partial summaries, new-run paused-zero versus reset-baseline-at-5-s semantics, accepted-versus-settled acknowledgments, no old-result mutation, and snapshot-equivalent continuation; implement enter-sandbox as a new paused-zero 60-second constant-traffic run with applied seed/resources/cache and offered target resolved at authoritative cancellation, and return-guided as a new default baseline at 5 s; clear lesson predictions/references and preserve speed/motion without changing the old config/queue; satisfy T046 with bounded same-core computation.
- [X] T049 [US3] Integrate and regression-check `src/app/simulationClient.ts` foundation cancellation/replacement handlers with story-level timeout/error recovery and generation/run/sequence/credit rejection, preserving at most one normal command and one superseding cancellation, terminating/recreating only for explicit failure recovery and never treating a lost/stale view as an authoritative old summary.
- [X] T050 [US3] Complete pending/applied config and run lifecycle state in `src/app/sessionReducer.ts`, requiring pause acknowledgment before Apply & Restart, atomic edits, paused Discard, same applied seed on Reset, lesson restart on guided seed changes and return-guided mode changes, mode-switch draft discard with visible notice and prediction/reference/chart clearing, retained playback/motion preference, and no persisted simulation state.
- [X] T051 [US3] Complete sandbox controls in `src/components/Controls.tsx` and wire `src/app/App.tsx` for five traffic presets, 1–8 replicas, DB preset/cache/seed, guided/sandbox replacement toggle (disabled until initial initialization settles), pending edit actions, replay/reset and 1x/4x; show paused-zero sandbox versus recomputed guided baseline explicitly; omit optional slider/localStorage and route all execution through the single worker.
- [X] T052 [P] [US3] Implement `src/components/Inspector.tsx` and selection binding in `src/components/Topology.tsx` for current assumptions, busy/total instantaneous CPU/worker/connection/DB fractions, separate window percentages, queue and bottleneck evidence, clients' offered/admission state and cache ratio/overhead; no invented client utilization; prerequisite T051.
- [X] T053 [P] [US3] Complete current/Last-run partial-window comparison in `src/components/Metrics.tsx`, using worker summaries/directions, actual window durations, remaining in-flight, N/A/zero-baseline handling, configuration differences and explicit complete/partial/unavailable labels; prerequisite T051.
- [X] T054 [US3] Complete initializing/cancelling/failed/restart presentation and focused readable errors in `src/app/App.tsx` using client status, prevent Play beyond finished endpoints, and keep all old-run metrics from rendering as new baseline before settled acknowledgment; integrate T052/T053.
- [X] T055 [US3] Run T046/T047, snapshot/purity/protocol regressions and maximum-load logical-bound cases, record matching-time replay/step/speed results and failure-recovery behavior in `specs/001-viral-traffic-mvp/validation.md`, and leave device-timed SC-006 measurements for T068 rather than declaring timing from logical tests.

**Checkpoint**: Reset/cancellation preserves honest accounting, replacement cannot receive
old-run evidence, sandbox uses the same engine, and same-input replay is reproducible.

## Phase 6: User Story 4 — Learn on mobile and without motion (Priority: P1)

**Goal**: Make the complete lesson and evidence readable and operable without color, mouse,
or animation, with transparent assumptions available in every state.
**Independent Test**: Full keyboard flow at 360/1,280 px and reduced motion, chart text access,
node inspection and Assumptions access during initialization, run, pause, finish and failure.

### Tests for User Story 4

- [X] T056 [P] [US4] Write `tests/e2e/accessibility.spec.ts` for visible focus, accessible names, keyboard prediction/control/inspection/dialog actions and focus return, 360/1,280 px without horizontal page scroll, reduced motion/Pause Motion independent from model pause, and chart values without hover/color; prerequisite T055.
- [X] T057 [P] [US4] Write `tests/e2e/assumptions.spec.ts` checking always-accessible Assumptions, A-01–A-15/glossary content, seed-independent fixed schedule, cacheable-read/overhead caveat, successful-only N/A latency, finite queue and estimated memory versus JS heap/GC, plus normal operation when localStorage is blocked/corrupt; prerequisite T055.

### Implementation for User Story 4

- [X] T058 [US4] Complete `src/components/AssumptionsPanel.tsx` from the spec ledger/glossary and wire its always-visible trigger in `src/app/App.tsx`, exposing all default units, model version, limits, omitted behavior, no-benchmark and memory/latency caveats without inventing physical realism or saved outcomes.
- [X] T059 [US4] Complete keyboard/focus/semantic/status handling across `src/components/Controls.tsx`, `src/components/Topology.tsx`, `src/components/Inspector.tsx`, `src/components/LessonPanel.tsx`, `src/app/App.tsx`, and `src/styles.css`, using native labels, focus restoration, responsive layout and meaningful live announcements rather than every sample; satisfy the interaction parts of T056.
- [X] T060 [US4] Implement reduced-motion and Pause Motion behavior in `src/app/App.tsx`, `src/components/Topology.tsx`, `src/components/Charts.tsx`, and `src/styles.css`, stopping decorative/chart transitions while virtual time and numeric evidence continue unchanged; preserve motion preference through Reset without requiring storage.
- [X] T061 [US4] Complete accessible chart values/min-max summaries and bounded keyboard-operable table pagination in `src/components/Charts.tsx` (at most 50 visible sample rows, with all retained samples reachable), retain units/interval definitions/peaks, and verify no reliance on Recharts hover/animation/color alone.
- [X] T062 [US4] Execute T056/T057 against the production app and full lesson, inspect desktop/narrow text readability and focus manually, fix observed violations in the affected components, and record accessibility/assumption evidence in `specs/001-viral-traffic-mvp/validation.md` without treating screenshots as interaction proof.

**Checkpoint**: P1 is complete required quality, not optional polish. All four user stories
must pass before release validation can be completed.

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Prove reproducible setup, production routing, supported performance, and real
static-host behavior. No extra feature or speculative dependency is justified by this phase.

- [X] T063 Write `tests/e2e/static-routing.spec.ts` for root and `/SystemScope/` builds, base entry/refresh/fragments, CSS/JS/worker asset success, real-worker lesson and no non-asset/third-party runtime requests; test a no-fallback static server, not only Vite dev/preview; prerequisite T062.
- [X] T064 Implement `scripts/check-routing.mjs` and finish `scripts/serve-static.mjs` plus `package.json` test:routing wiring to build isolated root/subpath output with correct Vite flag passthrough, mount each exact prefix, execute T063 without false SPA fallback, and clean test outputs; use built-in Node tooling rather than add a production service.
- [X] T065 [P] Prepare `.github/workflows/pages.yml` to build the proper configurable repository base and publish only `dist` to GitHub Pages using the planned CI result, with no application server/functions/analytics; keep root Cloudflare-compatible build documented, and do not claim a deployed URL until an actual deployment exists; may proceed alongside T064 once T063's build/test contract is stable.
- [X] T066 Complete `.github/workflows/ci.yml` and `playwright.config.ts` with clean npm install/no-lockfile-drift smoke plus reproducible npm ci, strict typecheck/lint/Vitest/production build, browser installation, essential real-worker lesson/pause/reset/stale checks, both-base routing and useful failure artifacts; wait for T064/T065 and all story checks, and never make required checks optional to get green CI.
- [X] T067 [P] Complete `README.md`, `LICENSE`, and `specs/001-viral-traffic-mvp/quickstart.md` with explicit open-source licensing, actual pinned prerequisites/scripts, install plus one-command start, model/dependency limits, contribution/check instructions and under-five-minute demo; remove obsolete “planned only” setup text only after the commands exist and preserve honest limitations; may proceed alongside T064–T066 without editing their files.
- [X] T068 Add/run supported-load browser measurements in `tests/e2e/performance.spec.ts` and record hardware/OS/browser/input/speed/response timestamps, maximum bounds and actual progress cadence in `specs/001-viral-traffic-mvp/validation.md`; verify ≤250 ms pause/reset/cancel acknowledgment and ≥2 visible updates/s on the documented ≥4-core/8-GiB reference environment, label lag, and do not count forced termination as a passing normal cancel.
- [X] T069 Validate clean-clone installation/start and the complete five-stage walkthrough at 1x in under five minutes, plus Firefox/WebKit release smoke, keyboard/360/1,280 px/reduced-motion flows and both stage-5 remedies; record exact commands, versions, timing and observed results in `specs/001-viral-traffic-mvp/validation.md`, fixing actual failures before release.
- [ ] T070 Run the static-host smoke suite from `tests/e2e/static-routing.spec.ts` against the actual configured published URL and record host/base URL/commit/lockfile/browser/network/console and full-lesson results in `specs/001-viral-traffic-mvp/validation.md`; if no deployment is available, keep this task and the release gate pending explicitly instead of substituting local preview evidence or creating a backend.
- [ ] T071 Review `specs/001-viral-traffic-mvp/validation.md` against all FR-001–FR-017, SC-001–SC-012 and constitution gates; confirm actual install/typecheck/unit/contract/lint/build/E2E/routing/accessibility/performance/host evidence, no unresolved model defects, no runtime service/storage dependency, and update `README.md` with final supported limits only when evidence warrants them; do not declare release complete with a pending T070.

## Dependencies & Execution Order

### Phase Dependencies

| Phase | Requires | Completion checkpoint |
| --- | --- | --- |
| 1. Setup | Existing approved design | Toolchain/checks configured, no backend |
| 2. Foundation | T001–T005 | T020 numerical/model gate and T026 real-worker gate |
| 3. US1 | T026 | T037 usable baseline/spike demo |
| 4. US2 | T037 | T045 complete scaling/DB/remedy lesson |
| 5. US3 | T045 | T055 repeatable controls, detailed inspection and safe comparison |
| 6. US4 | T055 | T062 complete mobile/keyboard/motion/assumption access |
| 7. Cross-cutting | T062, then listed internal dependencies | T071; all release evidence present |

### User Story Dependencies

```text
Setup → Shared engine/tests → D1–D3 gate → Shared worker/client → Real-worker gate
  → US1 baseline/spike → US2 scaling/remedies → US3 sandbox/replay/inspection
  → US4 access/assumptions → Cross-cutting validation → Release evidence review
```

The implementation order is deliberately sequential where stories extend the same worker,
reducer, controls and metrics. Do not assign whole stories concurrently against shared files.
“Independently testable” means each story's named fixtures/actions verify its outcome without
having to complete earlier lesson steps manually; it does not mean shared infrastructure or
integration dependencies disappear. US2 fixture tests can bypass prediction history; US3 can
start directly in sandbox; US4 can load any run state for its accessibility checks.

### Within Each Phase

- Complete shared input/config schemas before parallel test batches; write tests before the
  behavior they verify. Fix failures, then run the named checkpoint and update real evidence.
- Core sequence: T006 → T007/T008 → T009 → tests T010–T014 → T015/T016/T017 → T018/T019
  → T020. T015/T016/T017 have coupled domain interfaces and remain serial unless contracts
  have been stabilized; do not infer `[P]` from separate filenames alone.
- Adapter sequence: T021 → T022 → T023 → T024 → T025 → T026. Every test written in T021
  must pass at T026, including prediction presence checks and generic reset/replacement
  acknowledgments; no skipped cases or unspecified subset. T027/T031 later add scoring/stage
  integration, and T046–T049 add adversarial mode/recovery regressions and UI integration
  over those existing handlers, each passing its own story gate.
- UI sequence: stabilize reducer/view props, then the explicitly independent component
  batches, then integration/test checkpoint. Shared App/worker/lesson files remain serial.
- Final sequence: T063 → T064 with T065/T067 as permitted → T066 → T068/T069 → T070 → T071.
  Publishing and deployed-host verification need a real host; unavailable infrastructure
  cannot be reported as a passed test or replaced by speculative architecture.

## Parallel Examples

These are scheduling examples, not extra tasks or permission to spawn agents automatically.

| Scope | Prerequisite | Parallel work on distinct files |
| --- | --- | --- |
| Setup | T001–T002 | T003 Vitest config; T004 production browser harness; T005 initial CI |
| Foundation | T007–T009 | T010 scheduler tests; T011 resource tests; T012 observations; T013 snapshots/invariants; T014 demonstrations |
| US1 tests | T026 | T027 lesson unit tests and T028 learner journey E2E |
| US1 components | T032 | T033 Topology, T034 Metrics, T035 Charts; integration waits for all |
| US2 tests | T037 | T038 scaling evidence unit tests and T039 remedies E2E |
| US2 components | T041 | T042 Controls, T043 Metrics/LessonPanel, T044 Topology |
| US3 tests | T045 | T046 replacement contract tests and T047 replay-control E2E |
| US3 components | T051 | T052 Inspector/Topology and T053 Metrics partial comparison |
| US4 tests | T055 | T056 keyboard/mobile/motion and T057 assumptions/storage-independence |
| Final | T063 | T064 routing harness, T065 Pages workflow, T067 documentation |

## Implementation Strategy

### First Useful Increment and Required MVP Scope

Implement Setup/Foundation/US1 first and validate T037. That provides an end-to-end traffic-
spike learning demo, not the complete promised release. Continue through US2, US3, US4 and
cross-cutting validation: the MVP requires all five lesson stages, safe replay/reset,
accessibility, finite overload, fresh-clone setup, CI, and actual static-host evidence.

### Incremental Delivery

Keep one coherent implementation and use the gates to catch wrong modeling before adding
polish. D1–D3 must execute before UI claims depend on them; keep all numerical thresholds
and assumptions unchanged without an explicit documented specification correction. Add
only the planned dependencies; keep slider/localStorage optional and unimplemented initially.
No second scenario, editor, backend, or generic extension layer is part of this checklist.

### Completion Evidence

Mark a task checked only after its behavior/files exist and its named validation passes.
Record genuine blockers/failures and affected gates. Runtime results, 1x completion time,
reference-device responsiveness and actual deployed routing cannot be inferred from unit
arithmetic, a green build, or screenshots. Leave incomplete release checks visibly pending.

## Notes

- Baseline: 71 tasks. Setup 5; foundation 21; US1 11; US2 8; US3 10; US4 7; final 9.
- Amendment: 17 tasks; foundation 3, US1 5, US2 2, US3 3, US4 2, final 2.
- Combined: 88 tasks, 86 complete and 2 pending; story totals US1 16, US2 10, US3 13, US4 9.
- The original generation preserved design documents; this amendment refreshes plan/contracts
  to match the two accepted clarification answers while preserving baseline completion.
- `[P]` batches are optional scheduling opportunities; one engineer can execute serially.
- All task paths refer to planned files; scaffolding them is part of implementation, not
  proof that they exist now. No tests/builds/deployment were executed in this phase.

## Implementation Status

86/88 tasks are complete locally; all amendment tasks T072–T088 are implemented and verified. T070 and T071 remain pending actual GitHub Pages publication,
remote CI and hosted smoke evidence. All local engine/UI/static checks are recorded in
validation.md. No publishing or push was performed implicitly.


## Amendment Phase 1: Setup review

Reuse the completed setup and existing dependencies. No new package, backend, storage,
engine, branch, or scaffolding is required. Read the revised spec, plan, and contracts first.

## Amendment Phase 2: Foundation — fast execution and optional history

**Goal**: One deterministic core, two shell execution styles, bounded optional history delivery.
**Independent gate**: Protocol v2 tests prove canonical fast/playback equality and cancellation.

- [X] T072 Extend `tests/contract/protocol.test.ts`, `tests/contract/client.test.ts`, and `tests/contract/replacement.test.ts` for protocol v2, fast/playback style, atomic replacement execution, default 60-second initialization, mode-aware reset, invalid draft preservation, chart subscriptions (off by default), reliable final/ACK order, credit retirement, and stale history rejection; add fast/Watch canonical equality cases in `tests/unit/demonstrations.test.ts` without changing model constants or numerical targets.
- [X] T073 Update `src/worker/protocol.ts`, `src/worker/validate.ts`, and `src/worker/controller.ts` for protocol v2, validated execution intent paused/fast/playback, fast Explore initialization/reset, bounded cooperative batches initially at most 10 existing 10 ms steps per yield, atomic Run replacement/archive, and cancellable completion; preserve guided prediction gates and 1x/4x pacing. Make T072 execution tests pass and retain the 250 ms control gate.
- [X] T074 Update `src/worker/controller.ts`, `src/app/simulationClient.ts`, and `src/worker/protocol.ts` for SET_CHARTS subscription, no history serialization in unsubscribed views, retained current-run history on enabling, bounded incremental delivery/credit, and replacement/recovery synchronization; retain at most 600 real chart samples/series and make all T072 subscription/stale tests pass.

## Amendment Phase 3: US1 — direct input → result and optional views (P0)

**Goal**: Change inputs and Run once; charts and lesson appear only after explicit selection.
**Independent test**: Fresh visit → 1,000 RPS → Run → comparison, with both optional views closed.

- [X] T075 [P] [US1] Add `tests/e2e/explore-first.spec.ts` covering real-worker default completed baseline, unlocked inputs, one-click draft application/fast result, no prediction gating, calculating/invalid states, separate Show Charts/Start Guided Lesson selection, and absent chart/lesson chunks and mounted controls before selection; assert labels, applied inputs, and (50,60] final window.
- [X] T076 [US1] Update `src/app/sessionReducer.ts`, `src/app/simulationClient.ts`, `src/app/App.tsx`, and `src/components/Controls.tsx` to initialize Explore with charts/lesson closed, expose one-action Run plus optional fresh-run Watch, atomically apply valid drafts, preserve truthful previous/current summaries, and show busy/cancel states; no separate Apply action in Explore and no authoritative metric computation in React.
- [X] T077 [US1] Update `src/app/App.tsx` and `src/components/LessonPanel.tsx` to lazy-load/mount lesson presentation only on Start Guided Lesson, hide stage track/predictions/locks outside it, preserve its five-stage Predict → Run → Explain behavior, and implement explicit return to Explore with existing replacement rules; never open charts implicitly.
- [X] T078 [US1] Update `src/app/App.tsx`, `src/components/Charts.tsx`, and `src/app/simulationClient.ts` to load/mount charts only on selection, unmount/unsubscribe on close, show actual retained engine samples on reopen, provide numeric/text evidence, and annotate spikes only when the actual schedule contains one; selection must not reset or alter results.
- [X] T079 [US1] Extend `tests/e2e/explore-first.spec.ts` with real chart sample/value assertions, close/reopen unchanged summaries/time, no history payloads while closed, chart selection during computation, independent lesson/chart states, and full T075 regression checks; record passing evidence in `specs/001-viral-traffic-mvp/validation.md` before completing this story.

## Amendment Phase 4: US2 — compare input effects directly (P0)

**Goal**: Scaling/remedies are usable without any lesson completion.
**Independent test**: Same 1,000-RPS constant schedule at one/four/eight replicas and separate remedies.

- [X] T080 [P] [US2] Extend `tests/e2e/scaling-remedies.spec.ts` for Explore Run one/four/eight replicas, cache and fast-DB remedies independently, and Last/Current applied-config/window metadata with charts/lesson closed; retain the existing D1–D3 guided tests after explicit lesson selection.
- [X] T081 [US2] Update `src/components/Metrics.tsx`, `src/app/App.tsx`, and `src/worker/controller.ts` as needed so Explore comparisons and short explanations use authoritative worker summaries/evidence for the changed inputs, DB plateau, and cache overhead; no lesson-reference requirement or fixed-stage explanation. Pass T080 and record actual numbers in `specs/001-viral-traffic-mvp/validation.md`.

## Amendment Phase 5: US3 — trustworthy execution controls (P0)

**Goal**: Fast results, Watch, reset, and optional views preserve determinism and safe replacement.
**Independent test**: Replay a fast run through Watch; edit/reset/cancel under maximum supported load.

- [X] T082 [P] [US3] Extend `tests/e2e/replay-controls.spec.ts` and `tests/e2e/worker-failure.spec.ts` for fast/Watch final equality, pause/Step/1x/4x, edit during fast computation/playback, mode-aware Reset/Replay, partial archives, subscription restore after recovery, and delayed old-run final/history rejection; same configuration/seed results must match exactly.
- [X] T083 [US3] Update `src/app/sessionReducer.ts`, `src/app/simulationClient.ts`, `src/app/App.tsx`, and `src/worker/controller.ts` to pass T082: selected-style Replay, current-mode Reset, fast cancellation before staging edits, correct old/new applied labels, preserved chart visibility without stale history, and bounded recovery; finished runs must not silently extend or drain past 60 s.
- [X] T084 [US3] Extend `tests/e2e/performance.spec.ts` for fast baseline and one-replica 1,000-RPS completion within 5 wall seconds from worker acceptance on the documented SC-006 reference environment, plus 10,000-RPS/eight-replica cancellation within 250 ms and recorded full-compute duration; verify charts open/closed preserve authoritative results and record genuine device/browser measurements in `specs/001-viral-traffic-mvp/validation.md`.

## Amendment Phase 6: US4 — accessible optional controls (P1)

**Goal**: Main and opt-in flows remain usable on mobile, keyboard, and reduced motion.
**Independent test**: Fresh Explore, open/close charts, start/exit lesson at 360/1,280 px keyboard-only.

- [X] T085 [P] [US4] Extend `tests/e2e/accessibility.spec.ts` and `tests/e2e/assumptions.spec.ts` for keyboard-operable independent selectors, focus restoration on close/mode switch, calculating/completion announcements, numeric chart access only when selected, 360/1,280 px layouts, reduced motion, and always-accessible modeled-memory/latency caveats.
- [X] T086 [US4] Update `src/components/Controls.tsx`, `src/components/Charts.tsx`, `src/components/LessonPanel.tsx`, `src/components/AssumptionsPanel.tsx`, `src/app/App.tsx`, and `src/styles.css` as needed to pass T085; hidden views must leave no focusable controls, and motion settings must never alter simulation results.

## Amendment Phase 7: Polish and release revalidation

- [X] T087 Update `README.md`, `tests/e2e/spike-journey.spec.ts`, `tests/e2e/worker-startup.spec.ts`, `tests/e2e/static-routing.spec.ts`, and `scripts/check-routing.mjs` for Explore-first entry, explicit lesson selection, independent optional views, and fast/Watch commands; run clean npm install, typecheck, lint, Vitest, production build, essential E2E and both base-routing checks without dropping the five-stage lesson/remedy gate. Record current results in `specs/001-viral-traffic-mvp/validation.md`.
- [X] T088 Recheck `specs/001-viral-traffic-mvp/quickstart.md` against the implemented main flow and optional lesson, time both fast runs and the selected under-five-minute lesson, inspect production chunk/network behavior, and record limitations/failures in `specs/001-viral-traffic-mvp/validation.md`; only then proceed to pending T070/T071 actual-host/remote-CI release evidence under existing publication authorization rules.

## Amendment dependencies and delivery

Foundation T072 → T073 → T074 blocks runtime integration. Write T075 after foundation;
T076 → T077 → T078 → T079 delivers the first useful revised increment: direct Run with
independent optional views. T080 → T081 verifies US2. T082 → T083 → T084 verifies US3.
T085 → T086 verifies US4. T087 → T088 precedes T070 → T071. All four stories remain required.
Historical completion is preserved; check new tasks only after their amended behavior and
validation actually pass. Do not publish or push as a side effect of this documentation pass.

| Story | Parallel opportunity after foundation | Integration checkpoint |
| --- | --- | --- |
| US1 | T075 writes a new Explore test while runtime integration is prepared | T079 after T076–T078 |
| US2 | T080 edits scaling-remedies tests independently of US1 files | T081 after T079/T080 |
| US3 | T082 edits replay/failure suites independently of US1/US2 files | T084 after T081–T083 |
| US4 | T085 edits accessibility/assumptions suites independently of other test files | T086 after T083/T085 |

`[P]` is optional scheduling on distinct files, not an instruction to spawn agents. Shared
App/controller/client/component edits are serial. Deliver Explore-first US1 before optional
UI polish, then finish the remaining stories and release checks without adding new scope.
