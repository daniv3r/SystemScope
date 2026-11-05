# Feature Specification: SystemScope MVP — Your App Just Went Viral

**Feature Branch**: None; no branch hook configured.

**Created**: 2026-11-05

**Status**: Draft — requirements reviewed; ready for planning.

**Input**: A single-screen Predict → Run → Explain experience for a mobile/frontend engineer
learning what changes when incoming traffic increases tenfold. Governed by constitution v2.0.0.
This revises the existing MVP specification rather than introducing another feature.

## User Scenarios & Testing *(mandatory)*

**Persona**: A mobile/frontend engineer familiar with client requests but learning backend
capacity, queues, and system design. Explanations must work without prior queueing vocabulary.
P0 stories deliver the core experiment; P1 stories make it accessible and reliably usable.
All stories are required for MVP release. Independent tests use the named scenario fixtures.

### User Story 1 - Predict and observe a traffic spike (Priority: P0)

As a learner, I want to compare arriving requests with successful completions, predict the
result of a tenfold increase, and inspect the resulting evidence on one screen.

**Why this priority**: This teaches that demand and successful throughput are different.

**Independent Test**: Open a fresh session and execute baseline and spike stages without
requiring scaling, caching, or saved progress.

**Acceptance Scenarios**:

1. **Given** a fresh visit, **When** initialization completes, **Then** the single simulator
   screen shows a working 100 RPS baseline, separate offered/admitted/completed labels,
   topology, controls, metrics, lesson prompt, and an Assumptions entry point; no landing
   page or account is required. Initial baseline values come from actual simulation.
2. **Given** the baseline, **When** I reach the spike prediction, **Then** I can choose
   increase / approximately same / decrease separately for completed throughput, completed
   p95 latency, and mean queued requests, with the reference window identified.
3. **Given** an unanswered prediction, **When** I try Run or Step for that lesson stage,
   **Then** the UI explains which answers are missing rather than silently running it.
4. **Given** all predictions, **When** I run the 10x spike, **Then** incoming demand increases
   from 100 to 1,000 RPS, successful throughput increases less than tenfold, waiting and
   successful p95 latency increase, and separately labeled failures appear.
5. **Given** a finished stage, **When** I read the explanation, **Then** each prediction is
   compared with observed before/after values, sample count/window, and a causal explanation;
   an unavailable measure is not scored as a wrong answer.

### User Story 2 - Find and relieve the next bottleneck (Priority: P0)

As a learner, I want to scale API replicas, discover the database limit, and compare a cache
or faster database with the previous run.

**Why this priority**: A successful intervention can expose another resource constraint.

**Independent Test**: Load the defined scaling fixtures and inspect the results without
requiring a completed prediction history.

**Acceptance Scenarios**:

1. **Given** the overloaded one-replica fixture, **When** I compare its run with four replicas,
   **Then** successful throughput improves and the explanation cites changed API capacity
   and observed DB utilization/waiting.
2. **Given** four replicas at 1,000 RPS with normal DB and no cache, **When** I rerun with
   eight replicas, **Then** successful throughput changes by no more than 5%, the shared DB
   capacity remains unchanged, and DB congestion is explained using observed evidence.
3. **Given** that DB-limited result, **When** I enable cache with the stated hit assumption
   or choose fast DB, **Then** a fresh controlled run compares the changed configuration,
   successful throughput, p95, waiting, failures, and estimated memory with the previous run.
4. **Given** a cache result, **When** I inspect the explanation, **Then** it states that only
   cacheable reads can avoid DB work, shows configured and realized hit fractions, and
   identifies API and lookup work that remains. It does not promise universal improvement.

### User Story 3 - Inspect, pause, reset, and reproduce (Priority: P0)

As a learner, I want to inspect resources and control time without changing the experiment's
meaning or receiving outdated results from a cancelled run.

**Why this priority**: Trustworthy evidence requires repeatable inputs and clear state.

**Independent Test**: Run a sandbox fixture, pause/step it, replay it, and reset during load.

**Acceptance Scenarios**:

1. **Given** any component, **When** I select it, **Then** its assumptions, occupied/available
   resources, instantaneous utilization, waiting count, and evidence for bottleneck status
   are available without relying on animation or color.
2. **Given** a running simulation, **When** I pause, **Then** virtual time and all model
   changes stop after pause acknowledgment; Step advances exactly 10 simulated ms and
   leaves the run paused, processing every intervening event.
3. **Given** a recorded configuration and seed, **When** I replay it, including with different
   pause/step or 1x/4x playback choices, **Then** metrics at matching virtual times and final
   results are identical for the same model version.
4. **Given** a running experiment, **When** I change a model control, **Then** it pauses and
   stages the edit; Apply & Restart saves the old partial summary and starts an empty run
   with all pending edits atomically, while Discard preserves the unchanged old run.
5. **Given** an overloaded run, **When** I select Reset, **Then** it cancels current work,
   restores the low-traffic baseline with the currently applied seed, clears current
   predictions/charts, preserves Last run as partial, and ignores all late old-run results.
6. **Given** two summaries with different or incomplete observation durations, **When** I
   compare them, **Then** their durations/configurations are explicit; unavailable values
   remain N/A, and percentage changes from zero or missing values are not fabricated.
7. **Given** a running guided stage with pending edits, **When** I enter sandbox, **Then**
   the mode-switch rules create a new paused 60-second run at t=0 using applied settings,
   discard drafts with notice, preserve the old partial summary, and reject late old results.
8. **Given** a sandbox run, **When** I return to guided mode, **Then** a new paused stage-1
   baseline at t=5 s uses the applied seed and default resources; old predictions/references
   are cleared and later comparisons use newly computed lesson evidence.

### User Story 4 - Learn on mobile and without motion (Priority: P1)

As a learner, I want readable evidence, keyboard access, and limitations wherever I work.

**Why this priority**: Access and honest explanations are required parts of the lesson.

**Independent Test**: Complete the core flow at 360 px and desktop width, keyboard-only,
with reduced motion, then open Assumptions and inspect chart values.

**Acceptance Scenarios**:

1. **Given** a 360 px or 1,280 px viewport, **When** I use the simulator, **Then** controls,
   charts, inspectors, predictions, and explanations are usable without horizontal page
   scrolling; the same journey remains on one screen, allowing vertical scrolling.
2. **Given** keyboard-only use, **When** I operate each core action, **Then** controls have
   accessible names, focus is visible, and chart values/units are available without hover.
3. **Given** reduced motion or Pause Motion, **When** a run executes, **Then** aggregate
   animations stop while model results and text/status evidence remain available unchanged.
4. **Given** any lesson/run state, **When** I open Assumptions, **Then** it states that results
   are educational modeled behavior, not production benchmarks, and working-memory occupancy
   is estimated per-request accounting, not actual JS process memory, heap, or GC usage.

### Lesson Narrative and User Journey

All stages use the same screen, simulation semantics, model version, and chosen seed.
The learner sees the system first, predicts, runs, and reads an explanation beside evidence.
A sandbox toggle unlocks the same controls without requiring predictions and uses the same
engine. Entering sandbox cancels the old run and creates a new run identity, empty state at
t=0, paused, with a 60-second endpoint. It copies the applied seed, API replica count, DB
preset, cache setting/hit assumption, and current offered target at the worker's acknowledged
cancellation boundary; that target becomes constant sandbox traffic. It never modifies the
old run's immutable endpoint or continues its queue. Archive the old run as Last run with
complete/partial status, clear lesson predictions/reference summaries and current charts,
and discard pending edits with a visible notice. Preserve playback speed and motion preference.
Metrics are N/A/zero as defined at t=0 until Run or Step produces observations. Mode changes
are disabled until initial baseline initialization has settled.

Returning to guided mode similarly replaces the sandbox run, archives its summary, discards
pending edits with a notice, clears predictions/references/charts, restores default baseline
resources with the applied seed, computes stage 1 to t=5 s, and pauses. Preserve speed and
motion preference and state that the lesson restarts. Old-run results cannot affect either
replacement. Predictions and reference evidence are recomputed as the lesson proceeds.

Each official stage is a 25-second virtual experiment from empty state. Stage 1 is 100 RPS
throughout. Stages 2–5 use 100 RPS through t=5 s and 1,000 RPS thereafter. Each comparison
uses the final 10-second window, (15 s, 25 s], and a fresh controlled rerun rather than live
migration of queued work. The initial view is stage 1 already advanced to t=5 s and paused;
Run continues it to 25 s. Its initialization is reproducible and has no synthetic metric data.

| Stage | Narrative and configuration | Reference and explanation |
| --- | --- | --- |
| 1. Baseline | One API replica, normal DB, cache off. “Requests arrive slowly enough to finish.” Run the working baseline. | Offered and completed rates are nearly equal, little waiting, no failures |
| 2. 10x demand | Same resources; predict three changes, then run the scheduled spike. | Compare stage 1: API service is limited; additional arrivals wait or fail |
| 3. API scale | Four replicas, same spike and DB; predict and rerun. | Compare stage 2: throughput improves until DB becomes limiting |
| 4. Discover DB | Eight replicas, same spike and DB; predict and rerun. | Compare stage 3: DB ceiling persists despite more API capacity |
| 5. Remedy | Keep eight replicas; choose cache on (default) OR fast DB, not both; predict and rerun. | Compare stage 4: fewer DB visits or faster DB service relieves that constraint |

After each run show prediction versus observation and enable Next Stage. Replay Stage uses
identical inputs from t=0. Stage 5 can be replayed with the alternative remedy, retaining stage
4 as the lesson reference. Lesson resource controls are fixed to each stage except remedy
choice; seed can be set before starting/restarting the lesson. Sandbox permits all main knobs.
Hints cite current evidence, e.g. “The DB is busy 99% of this window and 84 requests are
waiting for it,” only when those numbers are actually observed. A shop-counter analogy may
explain waiting but must map explicitly to the modeled resource and its limits.

### Edge Cases

| Case | Required outcome |
| --- | --- |
| No successful completions | p50/p95 N/A, sample count zero; failures visible separately |
| High overload / queue full | Queue and estimated memory remain bounded; new arrivals may be rejected; admitted work may time out |
| Pause or background tab throttling | No wall-clock catch-up that skips events; pause acknowledgment freezes state, playback lag is labeled |
| Reset/cancel mid-run | Finite response time, old run invalidated, late results ignored, fresh baseline reproducible |
| Switch guided/sandbox mode | New run identity and immutable mode-specific endpoint; archive old summary, discard drafts with notice, clear predictions/references, never continue the old queue |
| Change seed/config while running | Pending-change restart rule; no window mixes configurations; invalid values preserve current state |
| Change speed | Playback only; no changed ordering, skipped events, or results at matching virtual times |
| DB saturated | More replicas cannot increase shared DB capacity; DB waits and CPU/worker distinctions visible |
| Zero cache hits | Every completed lookup misses and incurs overhead; no promised improvement |
| Perfect cache hits | DB bypassed for all cacheable reads; API/lookup CPU cost still limits completions |
| Cache off / no lookups | Realized hit fraction N/A, configured assumption remains visible |
| Timeout at service completion | Success exactly at deadline wins; otherwise only one terminal outcome and one resource release |
| End at 60 s | Stop arrivals and progression, report remaining in-flight work; do not silently drain past limit or mark it successful |
| Empty or partial comparison | Actual window shown; no invented samples or division by zero |
| Worker failure | Stop showing advancing progress, show readable error and restart; never substitute UI-calculated results |
| Missing/blocked/corrupt local storage | Lesson and simulation still run; no dependency on stored state |
| Reload | Fresh baseline; simulation histories are not persisted; optional saved preferences/progress cannot masquerade as simulated evidence |

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Provide the single-screen journey with clearly related Topology, Controls,
  Metrics, lesson/explanation, and always-accessible Assumptions areas. No separate landing.
- **FR-002**: Show Clients → API replicas → Database with an optional cache path. Flow is
  aggregated, never one UI object per request; explain that moving marks are illustrative
  aggregates. Every component can be selected and inspected.
- **FR-003**: Expose traffic presets 100/500/1,000/5,000/10,000 RPS, 1–8 integer replicas,
  slow/normal/fast DB, cache on/off with its specified hit assumption, seed, Run, Pause,
  Step, Reset, Replay, and selected-node inspection. Retain playback 1x/4x. A slider is
  optional, must remain within 100–10,000 integer RPS, and cannot replace accessible presets.
- **FR-004**: Follow the lesson, prediction, pending-edit, and mode-switch rules above. Approximately same
  means within ±5% of the reference; zero to zero is same, zero to positive is increase.
  Compare successful throughput, completed p95, and time-weighted mean queued requests over
  matching final windows. N/A is unscored, with an explanation of missing successful samples.
- **FR-005**: Distinguish offered, admitted, and successful completed RPS; queued and in-flight
  work; latency; timeouts; rejections; and other errors using the definitions below. Display
  virtual time, units, observation window, configuration/seed, and successful sample count.
- **FR-006**: Provide aligned time series for offered/admitted/completed RPS, p50/p95 latency,
  pending queue, timeout/rejection counts, and estimated working-memory occupancy. Label
  counts by interval versus run total; other-error count remains separately available.
  Provide text values and min/max summaries, shared virtual-time axis, and spike marker.
- **FR-007**: Inspectors show instantaneous busy/total CPU slots, occupied/total simulated
  workers, DB connections/service slots, waiting counts, and assumptions. Show instantaneous
  utilization as a fraction and percentage, separate from time-averaged utilization.
  Cache inspection shows lookup cost and configured/realized hit fractions; Clients shows
  offered schedule and admission/rejection evidence, not invented client CPU utilization.
- **FR-008**: Bottleneck explanations cite at least two actual numbers and their time basis.
  Window utilization is healthy below 70%, busy 70%–below 90%, saturated at least 90%; present
  waiting work also labels congestion. Identify DB as limiting when saturated with DB wait;
  identify API when CPU/worker saturation accompanies ingress/CPU wait. Acknowledge simultaneous
  constraints, and say “no saturated bottleneck observed” at low load. Distinguish estimates
  from observations; never hardcode a stage's expected explanation when its evidence differs.
- **FR-009**: Last run versus Current run shows final-window offered/admitted/completed RPS,
  p50/p95, timeout/rejection/error counts and rates, mean/peak queue, peak estimated memory,
  CPU/worker/DB utilization, configurations, seed, model version, and window/sample metadata.
  Partial summaries are labeled. Keep one previous run and up to five lesson summaries.
- **FR-010**: Run the coherent bounded resource model in the assumptions ledger. Simulation
  results are authoritative; presentation cannot invent metrics. Same model version, inputs,
  schedule, and seed reproduce results across replay, pause/step, and playback speeds.
- **FR-011**: Run no longer than 60 virtual seconds; bound resource work, queues, history,
  logs, snapshots, and visual updates. Cancellation/reset must acknowledge within 250 ms
  on the reference environment in SC-006, without waiting for a full run. Reject stale
  results and stale commands; never let an old run overwrite new-run state. If playback
  cannot keep pace, label lag and preserve events rather than fabricate or skip progress.
- **FR-012**: Assumptions must expose the ledger, definitions, model version, approximations,
  omitted behavior, and uncertainty. Explain successful-latency sampling bias: low p95 among
  successes may coexist with many failures. Estimated memory excludes process baseline/GC.
- **FR-013**: All core actions meet Story 4 accessibility criteria. Pause Motion is separate
  from simulation pause. Color, hover, and animation cannot be the sole source of information.
- **FR-014**: Apply constitution v2.0.0's static browser architecture, pure worker-hosted core,
  typed input/output protocol, and dependency rules. No backend or runtime external services.
  No target endpoints, real stress traffic, telemetry, or data-fetching network calls;
  delivery of the application's own static assets is permitted.
- **FR-015**: Optional preferences/lesson progress may use localStorage, outside the simulation.
  No simulation outcomes, comparison history, or authoritative state depend on it. Storage
  failure falls back safely; restoring progress never restores uncomputed evidence.
- **FR-016**: Root-URL and repository-subpath deployment must both load page, styles, scripts,
  and worker and complete the lesson without routing failures, runtime service calls, or
  host-specific application-server rewrites. Refresh and all in-app navigation must work.
- **FR-017**: Document prerequisites, npm install, one-command local start, and the under-five-
  minute lesson walkthrough. Enforce constitution gates: typecheck, Vitest unit/invariant/
  determinism and worker-protocol tests, production build, essential Playwright scenario,
  lint/static checks in GitHub Actions, and deployed static-asset routing verification.

### Key Entities *(include if feature involves data)*

- **Scenario**: Fixed model parameters, offered schedule, replica count, DB preset, cache
  assumption, seed, model version; no editable topology.
- **Run**: Unique identity, immutable applied configuration, virtual time, status, resource
  state, request accounting, and bounded observations. Pending edits are separate.
- **Resource**: Simulated API CPU/worker slots, connections, DB slots, and their waits.
- **Observation**: Counts, rates, completed latency samples, queue/memory state, utilization,
  and explicit window. Instantaneous counts are distinct from window averages.
- **Prediction**: Stage/reference and three direction choices, compared with actual evidence.
- **Summary**: Complete/partial results, window/configuration metadata, and explanation evidence.
- **Preference/progress**: Optional local presentation settings and lesson location, never
  simulation state or a replacement for reference observations.

### Data Definitions and Glossary

The default observation window is the latest 10 simulated seconds, (max(0, t−10), t]. Rates
use its actual duration when younger than 10 s. At t=0 rates/averages are N/A and counts zero.
Official lesson comparisons use (15,25] s. Queue means are time-weighted; peaks include event
boundaries. Percentages never divide completion-window outcomes by unrelated arrival cohorts.

| Term | Meaning / units |
| --- | --- |
| RPS | Requests per simulated second, not concurrent users |
| Offered target / observed offered RPS | Configured arrival rate now / actual arrivals in window divided by window seconds; show both when window crosses a spike |
| Admission | Acceptance into worker or ingress queue; admitted RPS = admissions in window / seconds |
| Completed throughput | Successful completions in window / seconds, regardless of arrival time |
| In flight | Admitted requests not yet terminal, including waiting and serving |
| Pending queue | All admitted requests waiting for ingress/CPU/connection/DB service, each counted once; excludes active service |
| Latency | Simulated arrival-to-success elapsed ms, including all queue waits, CPU, lookup, DB wait and service |
| p50 / p95 | Successful-latency values at nearest rank ceil(0.50×N) / ceil(0.95×N) in sorted samples completing in window; N/A when N=0 |
| Rejection | Arrival refused immediately before admission because all admission positions are full |
| Timeout | Admitted request reaches its end-to-end deadline without success |
| Other error | Admitted terminal failure other than timeout; no random errors modeled in MVP, show zero as “not modeled” |
| Failure counts / rates | Separate window timeout/rejection/error counts and counts divided by window seconds; run totals labeled separately |
| Working-memory estimate | 16 KiB per ingress request + 64 KiB per worker-held request; replaces ingress weight on worker assignment, not added twice; display MiB (1,048,576 bytes) |
| Instantaneous utilization | Busy slots / total slots now; for CPU, workers, connections, and DB service independently |
| Window utilization | Busy-slot virtual time / available-slot virtual time in window ×100%; aggregate replicas by slot-time, not by summing percentages |
| Bottleneck | Resource currently constraining completion capacity, established by saturation and waiting evidence |
| Cache hit | A cacheable read served without DB work; configured fraction is an assumption, realized fraction = hits / finished lookups in window, N/A if none |
| Replica / API instance | Another identical simulated API resource group; never another deployed backend |
| Simulated worker | A slot holding one request until termination, including DB wait; distinct from a CPU slot and from the browser Web Worker |
| Web Worker | Browser execution context hosting computation away from UI; it is not a simulated API worker |
| Virtual time | Time inside the model; pause freezes it, playback speed changes only its relation to real elapsed time |
| Seed | Recorded starting value for deterministic choices; fixed schedules in this MVP do not vary with seed |
| Invariant | A rule that must always hold, e.g. admissions equal terminal outcomes plus current in-flight work |

Cumulative accounting: arrivals = admissions + rejections; admissions = successes + timeouts
+ other errors + current in-flight. Each admitted request terminates once and releases all
resources once. Queued and actively serving sets are disjoint. At run limit, unfinished work
remains explicitly in flight; it is neither a success nor an invented failure.

### Cross-Cutting Acceptance and Automated Demonstrations

1. **Given** the stage fixtures, **When** automated demonstration D1 runs baseline versus
   the tenfold spike, **Then** SC-002 holds, accounting invariants remain true, and queues
   never exceed declared capacity. Verify with core tests and the key end-to-end flow.
2. **Given** scaling fixtures, **When** D2 compares one, four, and eight replicas, **Then**
   initial improvement and the DB plateau satisfy SC-003 without changing DB capacity.
3. **Given** the DB-limited fixture, **When** D3 tests cache and fast DB separately,
   **Then** SC-004 holds and explanations use observed evidence, not a capacity multiplier.
4. **Given** same-input replays, **When** automated tests vary pause/step, speed, and snapshot
   continuation, **Then** matching virtual-time results are identical. Seed changes are
   recorded; fixed-rate model results may remain identical across different seeds.
5. **Given** no completions, a full queue, or an expired deadline, **When** observations are
   generated, **Then** N/A, rejection, or exactly-once timeout behavior follows the glossary.
6. **Given** h=0 and h=1 cache fixtures, **When** lookups finish, **Then** respectively all
   and none visit DB, both pay API/lookup cost, and realized fractions are 0 and 1.
7. **Given** a reset followed by delayed old-run results, **When** they arrive, **Then** the
   new baseline remains unchanged; contract/UI tests verify cancellation and stale protection.
8. **Given** a fresh static deployment at root and repository subpath, **When** a reviewer
   opens, refreshes, and completes the lesson, **Then** assets/worker load without 404s and
   no backend or runtime service traffic is required. Test selected deployed host explicitly.
9. **Given** unavailable/corrupt local storage or worker failure, **When** a session starts
   or computation fails, **Then** storage cannot prevent learning; worker failure stops
   progress with a readable restart action, never fabricated metrics.
10. **Given** a 60-second maximum-load run, **When** it is stepped, paused, cancelled, or ends,
    **Then** declared bounds and SC-006 hold and no hidden drain exceeds the time limit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer can complete the five-stage lesson in under 5 minutes at 1x, including
  predictions and explanations, without an account, backend setup, or navigation away from
  the simulator. A fresh clone starts by documented install/start steps after prerequisites.
- **SC-002**: Final-window baseline successful throughput is 95–105 RPS with zero failures.
  At 1,000 offered RPS and one replica, throughput is below 400 RPS, mean queue and failure
  counts are nonzero, and completed p95 is higher than baseline.
- **SC-003**: Stage 3 throughput exceeds stage 2 by at least 10%. Stages 3 and 4 each achieve
  350–420 completed RPS; doubling four replicas to eight changes throughput by at most 5%,
  with at least 90% DB window utilization and observed DB wait.
- **SC-004**: Each independent stage 5 remedy completes at least 850 RPS and reduces combined
  timeout/rejection counts by at least 50% versus stage 4 in matching final windows.
- **SC-005**: Every lesson fixture reproduces identical model state/observations at matching
  virtual times under replay, pause/step, 1x/4x, and snapshot continuation.
- **SC-006**: At 10,000 RPS, eight replicas, and 60 virtual seconds, no declared bound is
  exceeded. On a documented reference laptop with at least four logical cores and 8 GiB RAM,
  pause/reset/cancel acknowledgment occurs within 250 ms, controls remain operable, and
  visible metrics update at least twice per wall-clock second during running playback.
  Record browser/hardware, achieved playback speed, and any labeled lag in release evidence.
- **SC-007**: All core actions and chart evidence are usable keyboard-only, with reduced
  motion, at 360 px and 1,280 px viewport widths, without horizontal page scrolling or
  meaning conveyed solely through color, hover, or animation.
- **SC-008**: Automated verification covers all three demonstrations D1–D3 plus deterministic
  replay, bounded overload, cancellation, empty-latency data, and the full prediction flow.
- **SC-009**: Both deployment base configurations load all application/worker assets and
  complete the lesson with no missing-asset or runtime-service errors; verify refresh and
  record base URLs. The chosen deployed static host passes the same smoke check.
- **SC-010**: In the walkthrough, each stage's explanation cites at least two matching
  observed values; a reviewer can trace every numerical claim to the model or recorded
  observation, including the distinction between arriving and successfully completed work.

## Assumptions

### Assumptions Ledger

These are educational defaults for model version 1, not production measurements. They retain
the established scenario's coherent resource model. The ledger is visible in Assumptions;
no unsupported physical realism or statistical confidence is implied. Changing semantics
requires a model-version update and refreshed expectations, not altered observations.

| ID | Assumption / default | Meaning, uncertainty, and verification |
| --- | --- | --- |
| A-01 | Fixed-rate arrivals, presets 100–10,000 requests/s | Even spacing, first arrival at 1/RPS s, none at zero; no real burst variability. At schedule change start a new interval after boundary. D1 verifies offered counts |
| A-02 | Seed 42; editable integer 0–4,294,967,295 | Same inputs/seed reproduce outputs; v1 fixed arrival/service/cache schedules use no randomness, so different seeds need not change results. Explain this beside seed control |
| A-03 | One API replica initially; supported 1–8 | Identical replicas, instantaneous least-outstanding routing among replicas able to admit, tie by replica number; no network/load-balancer model |
| A-04 | Per replica: 32 simulated workers, 2 CPU slots, 200 ingress positions | A worker holds a request through terminal outcome; CPU service and DB waits are distinct. No actual OS/thread measurement |
| A-05 | API CPU: 5 ms pre-DB, 1 ms post-DB per request | Fixed times, no hardware calibration. Post-CPU also required for cache hits |
| A-06 | Eight DB connections per replica; four shared DB service slots | Connection retained while waiting for/using DB, then released; API scaling does not change global DB slots |
| A-07 | DB slow/normal/fast = 20/10/4 ms service per visit | Ideal upper bounds 200/400/1,000 DB visits/s with four slots, before other limits; D2 verifies plateau |
| A-08 | Cache off; on = 80% configured hits and 1 ms CPU lookup overhead for every lookup | All modeled operations are cacheable reads; hits bypass DB only. No write workload, invalidation, warming, eviction, or real cache. Contract fixtures cover 0% and 100% |
| A-09 | End-to-end deadline 1,000 ms after arrival | Queue and service all count; timeout immediately cancels simulated work and releases resources. Real cancellation may be slower or incomplete |
| A-10 | Memory weights: 16 KiB ingress; 64 KiB worker-held | Per-request buffer/accounting estimate, replaces weight on promotion; excludes real browser/app/GC memory |
| A-11 | Step 10 virtual ms; playback 1x/4x; run limit 60 s | Exact intervening events preserved; no dependence on rendering or real-time pacing |
| A-12 | Initial view/reset = baseline advanced to 5 s and paused | Uses actual model execution; Reset restores baseline resources and currently applied seed. Replay preserves current experiment configuration from zero |
| A-13 | Fixed trailing 10 s live window; guided comparison final 10 s | Avoids unneeded window controls; rates use actual duration at startup. At t=0 averages N/A, counts zero |
| A-14 | No random failures or retries | Timeouts/rejections modeled separately; other errors zero and explicitly unmodeled. No invented error probability |
| A-15 | Preferences/progress storage is optional | Default release may remain session-only. If saved locally, failures degrade safely and resuming a stage recomputes reference runs before scoring, never invents evidence |

### Model Semantics and Derived Capacity

Requests enter an available worker or its bounded ingress queue. A worker waits for CPU,
runs pre-DB work and optional cache lookup, then either bypasses DB on a hit or waits for
its replica's connection and a global DB slot. After DB service, or directly after a hit,
it runs post-CPU and succeeds. CPU is released during DB waits; the worker remains occupied.
All wait lists are FIFO (first in, first out) by ready time then request identity. No queue
beyond ingress and worker-held waiting is introduced.

For reproducible cache results, the kth finished lookup hits when floor(k×h) is greater than
floor((k−1)×h), with h the configured hit fraction; ties use request identity. This is a
fixed hit schedule, not a random probability or claim about production cache behavior.
At equal timestamps, finish service first (success at deadline wins), expire other deadlines,
dispatch existing waits, process arrivals, then dispatch newly ready work. Ties use request
identity. Resource release does not itself advance time. Request identities follow arrivals.

The ideal API CPU bound is replicas × 2 / 0.006 requests/s without cache, about 333 per
replica. Normal DB's independent upper bound is 4 / 0.010 = 400 visits/s. Cache increases
CPU work to 0.007 s/request (about 286 requests/s per replica) but sends only about 20% of
finished lookups to DB under h=0.8. These are derived upper bounds, not completion formulas;
worker occupancy, waits, deadlines, and finite observation windows determine observed results.
This explains why caching can hurt a CPU-limited or zero-hit workload instead of helping it.

### Finite Budgets and Run State

At eight replicas there are at most 1,856 admitted requests: 8×(200+32). The maximum modeled
working-memory occupancy is 8×(200×16+32×64) KiB = 41 MiB. Queued work is a subset of admitted
work; no infinite queue is implied. At 10,000 RPS, a run admits or rejects at most 600,000
arrivals in 60 s, with at most 100 arrivals per 10 ms step. Each admitted request has the
finite lifecycle above and no retry loop. Deadlines include all phases and holds.

Retain at most 101,856 successful-latency samples in the trailing 10 s: at most 100,000 new
arrivals plus 1,856 previously in-flight requests. Retain at most 600 time-series points per
series at 100 ms intervals, one previous summary, five guided summaries, and one continuation
snapshot. Raw diagnostic event logging is off by default; if enabled, retain at most the
latest 1,000 entries and label truncation. At most 50 moving marks per topology link; no
request-to-UI-object allocation. Downsample charts preserving peaks or visible min/max ranges.

Worker-to-UI updates are coalesced so at most one unapplied progress update per active run
is retained; superseded progress may be replaced, authoritative simulation events may not.
Control acknowledgments/final results cannot be silently dropped. Snapshot state/history
must obey the same bounds. Unexpected internal limit breaches pause with an explicit error;
supported configurations must fit without such errors.

Pause freezes after acknowledgment; pending edits retain results under their applied config.
Apply & Restart saves the outgoing summary and starts at t=0, paused; Replay does the same
without configuration changes. Reset cancels and restores A-12 with the applied seed, clears
pending edits/predictions and current histories, restarts lesson at stage 1, and retains Last
run with complete/partial label. Motion preference is preserved. A finished run cannot
advance beyond its endpoint; it can only replay or reset. At reset, discarded new seed edits
do not silently change the applied seed. Browser reload begins a fresh baseline, not a run
continuation. A crash may leave Last run unavailable; label it instead of inventing a summary.

### Dependencies and Explicit Non-Goals

The only architecture choices are those fixed by constitution v2.0.0: static React/TypeScript/
Vite, pure simulation in a dedicated Web Worker with typed protocols, Recharts, Tailwind CSS,
SVG/CSS preference, and Cloudflare Pages or GitHub Pages with configurable base. No new
package, transport, file layout, or deployment mechanism is selected here. Runtime requires
a supported browser and static assets only; Node/npm are local development/build tools.

Out of scope: backend/serverless APIs, auth, databases/brokers as application infrastructure,
Docker dependency, external runtime services, analytics calls, real endpoints/load generation,
generic topology editors, extra scenarios, autoscaling, retries, write workloads, real cache
invalidation, persistence of simulation histories, export/sharing, and concurrent-user modeling.
Static hosting and optional local preferences/progress are in scope. No actual JS process
memory, OS scheduling, network jitter, heap/GC, DB locking/query optimization, disk, replication,
or physical hardware behavior is measured or faithfully emulated. No second sandbox engine.
