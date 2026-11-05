# Feature Specification: SystemScope MVP — Your App Just Went Viral

**Feature Branch**: None; no branch hook configured.

**Created**: 2026-11-05

**Status**: Draft — requirements reviewed; ready for planning.

**Input**: User request for one interactive traffic-spike learning scenario, with honest,
deterministic simulation, prediction, experimentation, and evidence-based explanations.

## User Scenarios & Testing *(mandatory)*

P0 means required for the coherent learning demo. P1 means required MVP support quality;
P1 does not mean permission to omit it from the first release. All stories below are in scope.
Each story can be verified against its stated starting fixture without completing other stories.

### User Story 1 - See why traffic is not throughput (Priority: P0)

As a developer, I enter the simulator, increase incoming traffic, and connect request flow,
queues, latency, and outcomes to limited service capacity.

**Why this priority**: This is the central learning outcome.

**Independent Test**: Run the baseline and overloaded fixtures; inspect numbers, topology,
and explanation without using the guided lesson.

**Acceptance Scenarios**:

1. **Given** the landing screen, **When** I read it, **Then** exactly two introductory
   sentences describe the traffic-spike challenge and simulation, with Start Experiment.
2. **Given** that screen, **When** I select Start Experiment, **Then** topology, controls,
   metrics, and education panel appear in a paused baseline state, with all units visible.
3. **Given** one instance and normal DB, **When** I compare 100 and 1,000 RPS runs,
   **Then** incoming RPS rises tenfold while successful throughput rises less than tenfold,
   waiting and latency grow, and overload produces separately visible failures.
4. **Given** a congested run, **When** I inspect the API or DB, **Then** its assumptions,
   busy/available capacity, waiting count, and numeric reason for its health state appear.

### User Story 2 - Predict and complete the guided lesson (Priority: P0)

As a learner, I predict changes, run five controlled stages, and compare my answers with data.

**Why this priority**: Structured experiments make cause and effect understandable.

**Independent Test**: Start the lesson fixture and complete the five-stage journey below.

**Acceptance Scenarios**:

1. **Given** stage 2 before execution, **When** I have not selected an answer for throughput,
   p95 latency, and queue depth, **Then** Run explains that all three predictions are required.
2. **Given** three predictions, **When** I run the stage, **Then** the experiment executes,
   pauses automatically at its endpoint, and compares each prediction with measured change,
   including before/after values, window, and a plain-English explanation.
3. **Given** the scaled API stage, **When** I proceed to stage 4 with eight instances,
   **Then** the lesson identifies the DB limit from DB utilization and waiting evidence,
   even though API capacity increased.
4. **Given** stage 4 results, **When** I choose cache or faster DB for stage 5,
   **Then** only that intervention changes, and the results explain the resulting DB demand
   and throughput without describing cache as a universal capacity multiplier.

### User Story 3 - Repeat and compare experiments safely (Priority: P0)

As a learner, I control playback, reset, and compare runs without confusing virtual time
with time on my computer.

**Why this priority**: Repeatability makes the evidence trustworthy.

**Independent Test**: Use two sandbox runs with the same scenario and compare snapshots.

**Acceptance Scenarios**:

1. **Given** a running experiment, **When** I pause, **Then** virtual time, metrics, queues,
   and deadlines stop until Play or Step; Step advances exactly 10 ms and remains paused.
2. **Given** identical runs, **When** one uses 1x and another uses 4x or changes speed,
   **Then** results at matching virtual times and final summaries are identical.
3. **Given** a running or paused run, **When** I edit a model control, **Then** execution
   pauses, the edit becomes pending, and existing results remain labeled with the old config;
   Apply & Restart starts an empty run with the pending config, while Discard keeps the old run.
4. **Given** a mid-run experiment, **When** I select Reset to Baseline, **Then** it immediately
   returns to the fixed paused baseline, clears predictions and results, and shows the
   interrupted run's summary as Last run, clearly labeled partial with its actual window.
5. **Given** a previous and current run, **When** I view comparison, **Then** side-by-side
   headline metrics, configuration differences, and observation durations are shown;
   percentage changes are suppressed where a baseline is zero or a value is unavailable.

### User Story 4 - Understand the evidence accessibly (Priority: P1)

As a learner, I inspect values, definitions, and limitations using a keyboard or narrow screen,
without needing color or animation to understand the result.

**Why this priority**: The lesson must remain usable and honest for different learners.

**Independent Test**: Complete a run at 360 px viewport width using keyboard navigation and
reduced motion, then inspect charts and limitations.

**Acceptance Scenarios**:

1. **Given** any simulator state, **When** I open Assumptions & Limitations, **Then** it states
   “Educational discrete-event simulation; not measured production performance” and lists
   model parameters, omissions, metric definitions, and estimated-memory caveats.
2. **Given** reduced motion or Pause Motion, **When** a run continues, **Then** animations
   stop while textual values, status labels, and outcomes remain available and identical.
3. **Given** keyboard-only use, **When** I navigate controls, component inspectors, charts,
   and lesson actions, **Then** focus is visible, controls have names, and chart values and
   units are available as text without relying on color or hover.

### User Journeys

**First visit**: landing → Start Experiment → paused baseline with a guided-lesson prompt →
Start Lesson → stage 1 → predict → run spike → explain → scale → discover DB limit → choose
cache or faster DB → compare and review limitations. No account or prior setup in the UI.

**Guided stages**: Each is an independent 25-second virtual-time run from empty state with
identical model version and seed. Stages 2–5 use 100 RPS for the first 5 s, then 1,000 RPS
for 20 s. Observation is the final 10 s, (15 s, 25 s]. Configurations apply from time zero.
This is a controlled rerun, not hot scaling of an existing queue.

| Stage | Configuration and action | Comparison and intended evidence |
| --- | --- | --- |
| 1. Normal traffic | 1 API instance, normal DB, cache off; 100 RPS throughout | Baseline: throughput follows arrivals, low waits and no failures |
| 2. Go viral | Same resources; predict before the 10x spike; Run executes the full schedule | Versus stage 1: API CPU saturation, bounded queue, rising latency and failures |
| 3. Scale API | 4 instances, normal DB, cache off | Versus stage 2: API relief but DB demand reaches its shared capacity |
| 4. Discover DB | 8 instances, normal DB, cache off | Versus stage 3: throughput near the same DB ceiling despite more API capacity |
| 5. Relieve DB | Keep 8 instances; choose cache on (default) OR fast DB, not both | Versus stage 4: reduced DB demand or higher DB capacity improves successful throughput |

Stages 3–5 also request the same three predictions before Run. Stage 1 needs no prediction.
Next Stage is available after explanation; Replay reruns the same stage. Sandbox is available
without completing the lesson. Leaving the lesson preserves only Last run and returns to
sandbox; restarting the lesson starts stage 1. Guided resource controls are locked to each
stage, except stage 5's intervention choice. Playback controls remain available.

**Sandbox**: choose pending controls → Apply & Restart → Play → inspect → pause/step →
finish or restart → compare Last run with Current run. A sandbox run lasts at most 60 virtual
seconds, then pauses as finished; replay creates a fresh run. No infinite simulation session.

### Edge Cases

| Case | Required observable outcome |
| --- | --- |
| Zero completed requests | p50/p95 show N/A with “No successful completions in this window”; throughput is 0 and failures remain visible |
| High overload at 10,000 RPS | Bounded queues/memory, increasing rejections/timeouts, responsive controls, truthful throughput |
| Queue capacity reached | New arrivals are rejected immediately; no eviction of admitted work and no hidden queue growth |
| Paused run | No arrivals, completion, timeout, or virtual-time changes; wall time may pass freely |
| Reset mid-run | Atomic fresh baseline and partial previous summary; late updates from the old run cannot overwrite it |
| Speed change | No reset, changed ordering, skipped events, or altered observations at matching virtual time |
| DB bottleneck | More API instances cannot increase the shared DB service limit; DB wait remains visible |
| Zero cache hits | Every request reaches DB and still pays lookup overhead; no fabricated improvement |
| Perfect cache hits | No DB work, zero DB utilization; API CPU and lookup costs still bound throughput |
| Running configuration edit | Pause and pending edit; explicit Apply & Restart or Discard, never mixed-config metrics |
| Empty/partial comparison | Show unavailable state or actual shorter window; no invented values or misleading percentage deltas |
| Invalid input or stale command | Reject with a readable reason, preserve state, and never apply to another run |
| Service interruption/reload | Pause/show recoverable error if control is lost; reload starts a fresh baseline and states that session results are lost |

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The product MUST provide the landing and simulator journeys above, with three
  clearly related areas labeled Topology, Controls, and Metrics, plus adjacent education text.
- **FR-002**: Topology MUST show Clients → API instances → Database and optional cache lookup
  on the API-to-DB path. Aggregate flow MUST distinguish arrivals, admissions, completions,
  and failures without suggesting one visual particle equals one request. Inspectors MUST
  expose assumptions and current resource counts. A cache hit bypasses DB, not API work.
- **FR-003**: Controls MUST expose incoming RPS presets 100/500/1,000/5,000/10,000, instance
  count 1–8 (integers), DB preset slow/normal/fast, cache on/off, Play/Pause, Step, Reset to
  Baseline, speed 1x/4x, and observation window 1/5/10 s (default 10 s). No free-form editor.
- **FR-004**: Model control edits MUST obey the pending-change restart rule in Story 3.
  Speed, observation window, and Pause Motion are presentation/playback controls and MUST
  NOT restart or alter the model. Predictions and official guided comparisons use the fixed
  final 10-second window regardless of the live observation selector.
- **FR-005**: Metrics MUST expose every data definition below with units, virtual-time window,
  sample count where relevant, and current run/config identity. Requested schedule and actual
  arrivals MUST be distinguishable, especially in windows crossing a spike.
- **FR-006**: Throughput, latency, and queue-depth time series MUST share a virtual-time axis,
  spike marker, and visible units. Throughput MUST include incoming, admitted, and successful
  completion series. Latency MUST include p50/p95; queue MUST include total waiting count.
  Text values/summaries MUST be available without hover, color, or animation.
- **FR-007**: The education panel MUST identify the current capacity constraint using observed
  CPU/worker occupancy, DB utilization, and waits. It MUST cite at least two current numbers,
  name the window, explain a useful next experiment, and distinguish a capacity estimate from
  an observed rate. Under low load it MUST say there is no saturated bottleneck.
- **FR-008**: Health MUST use utilization over the selected window: healthy below 70%, busy
  from 70% to below 90%, saturated at least 90%. A resource with waiting work is congested
  even below that average. Failures add an explicit overload label. DB constraint takes
  explanatory precedence when DB is saturated with DB wait; API constraint otherwise requires
  CPU/worker saturation with API wait. Simultaneous constraints MUST be acknowledged.
- **FR-009**: Guided stages, predictions, automatic endpoints, and explanations MUST follow
  the journey table. Answer choices are increase/plateau/fall; plateau means within ±5% of
  the reference value. For reference zero, unchanged zero is plateau and positive is increase.
  Unavailable latency yields “insufficient successful samples,” not a scored answer.
- **FR-010**: Prediction comparison MUST use mean completed throughput, completed p95 latency,
  and time-weighted mean waiting count over matching final windows. It MUST show the actual
  delta and explain counterintuitive results, including successful-request sampling bias.
- **FR-011**: Last run and Current run MUST show mean incoming/admitted/completed RPS, p50/p95,
  failure rate, mean/peak queue, peak estimated memory, and mean CPU/worker/DB utilization.
  Each MUST include config, seed, model version, sample count, window, and complete/partial
  label. Only one previous full summary is retained; guided reference summaries for five
  stages may additionally be retained. Reset preserves Last run, not old chart histories.
- **FR-012**: The engine MUST implement the model contract, accounting rules, bounded behavior,
  and defaults below. Frontend values MUST come from authoritative simulation results;
  presentation transformations MUST NOT invent or recalculate authoritative metrics.
- **FR-013**: Identical version/config/seed/input schedule MUST reproduce state and summaries,
  including across pause, step, snapshot continuation, and playback speeds. Snapshots MUST
  identify all state needed for continuation; file export is not required.
- **FR-014**: Assumptions & Limitations MUST always have a visible entry point and state that
  service times, cache behavior, concurrency, memory, and CPU are simplified estimates,
  not production measurements, heap/GC inspection, or hardware sizing advice.
- **FR-015**: All core interactions MUST support keyboard use, visible focus, readable text,
  text status alternatives, reduced motion, and 360 px through desktop layouts without
  horizontal page scrolling. Pause Motion MUST be separate from simulation pause.
- **FR-016**: Work, history, and visuals MUST obey finite budgets below. If the device cannot
  sustain playback, progress MAY lag wall time but MUST show this and preserve model results;
  it MUST NOT silently drop simulation events to catch up.
- **FR-017**: Fresh-clone startup MUST use a documented single command after listed prerequisites,
  require no credentials/cloud services, and include a reproducible lesson walkthrough.
  Lint/static checks, tests, builds, and CI MUST enforce constitution gates; no product
  features or external services may be added solely to satisfy startup.
- **FR-018**: Validation MUST cover engine units/invariants/replay, control/payload contracts,
  essential UI journeys, accessibility, and supported-load behavior. All constitution review
  gates apply; evidence MUST accompany planning, review, and release.
- **FR-019**: The product MUST generate no real workload traffic, accept no target endpoints,
  and require no login, persistent database, broker, or cloud dependency.

### Key Entities *(include if feature involves data)*

- **Scenario configuration**: RPS schedule, instance count, DB preset, cache flag/hit fraction,
  service times, resource/queue limits, deadline, memory weights, seed, and model version.
- **Run**: Unique identity, frozen configuration, input schedule, virtual time, playback state,
  lifecycle (ready/running/paused/finished), and complete/partial observation metadata.
- **Request lifecycle**: Arrival identity/time, admission/outcome, queue/resource position,
  deadline, cache decision, and successful completion time. Internal representation is not
  prescribed; observable results must follow the same lifecycle.
- **Resource state**: API workers, CPU slots, per-instance DB connections, global DB service
  slots, waiting counts, busy time, and capacity limits.
- **Observation**: Window boundaries/duration, rates, outcome counts, successful latency
  sample count/percentiles, queue/memory values, and resource utilization.
- **Prediction**: Stage/reference identity and selected direction for three measures.
- **Run summary/comparison**: Last/current or guided reference observations plus configuration
  differences, deltas, and explanation evidence. Session-only; no persistence promise.

### Cross-Cutting Acceptance Scenarios

These scenarios supplement the story criteria and explicitly cover model, operational, and
boundary requirements (FR-004–FR-019).

1. **Given** a new or paused run with no successful completions, **When** metrics are inspected,
   **Then** successful latency is N/A with sample count zero and failures remain separate.
2. **Given** full ingress queues and occupied workers on every instance, **When** another
   request arrives, **Then** exactly one rejection is recorded, admission/in-flight do not
   increase, and queue/memory limits hold.
3. **Given** an admitted request still waiting or serving at its deadline, **When** virtual
   time reaches that deadline, **Then** it times out once, frees all resources, contributes
   no successful latency sample, and preserves the accounting equations.
4. **Given** a 10,000 RPS maximum-duration run, **When** queues saturate, **Then** failures
   increase without unbounded memory/history, and control responsiveness meets SC-006.
5. **Given** otherwise identical cache-enabled runs with h=0 and h=1, **When** lookups finish,
   **Then** respectively all and none visit DB, both incur lookup and API CPU costs, and
   realized hit fractions match 0 and 1 wherever samples exist.
6. **Given** four and eight instances with the same normal DB and 1,000 RPS spike,
   **When** their final windows are compared, **Then** SC-003 holds and no DB capacity value
   changes merely because API instance count changes.
7. **Given** running playback, **When** pause, reset, speed, or configuration-change actions
   occur, **Then** the exact state rules in Story 3 apply, with no mixed-config observations.
8. **Given** a window crossing the traffic spike, **When** metrics are displayed, **Then**
   requested RPS shows the current target and incoming RPS reflects actual window arrivals;
   neither is relabeled as concurrent users or completed throughput.
9. **Given** a recorded snapshot and identical continuation inputs, **When** execution resumes,
   **Then** all subsequent states and observations match uninterrupted execution exactly.
10. **Given** invalid capacity/rate values or a command naming an obsolete run, **When** it is
    submitted, **Then** it is rejected with a readable validation reason and current state
    remains unchanged.
11. **Given** documented local prerequisites and a fresh clone, **When** the documented startup
    command is executed, **Then** the landing and complete lesson work without credentials,
    cloud services, or real outbound workload traffic, and required CI checks are available.
12. **Given** a simulated-control interruption, **When** continuation cannot be confirmed,
    **Then** the UI stops presenting advancing state, shows a readable error and restart
    action, and never fabricates successful simulation progress.

### Data Definitions and Observation Rules

All time measurements are virtual. The live window is (max(0, t − W), t], where W is the
selected 1/5/10 s and t is current virtual time. Rates divide by actual elapsed window seconds,
not the requested full duration when the run is younger. At t=0 rates/utilization are N/A,
counts are zero. Snapshot counts are instantaneous unless explicitly labeled mean or peak.

| Data | Definition and unit |
| --- | --- |
| Requested RPS | Configured arrival target at current virtual time, requests/s; show schedule changes |
| Incoming RPS | All arrivals in window / elapsed window s, including immediately rejected arrivals |
| Admitted RPS | Arrivals accepted into an API worker or its ingress queue in window / window s |
| Completed throughput | Successful terminal completions in window / window s, regardless of arrival time |
| p50/p95 response latency | Arrival-to-success elapsed ms, including every wait and service phase, for successes completing in window; nearest-rank percentile ceil(p × N), ascending samples; N/A if N=0 |
| Timeout RPS | Admitted requests reaching deadline in window / window s |
| Rejection RPS | Arrivals rejected before admission in window / window s |
| Error RPS | Other admitted terminal failures in window / window s; zero in this model, explicitly no random errors |
| Failure rate | (timeouts + rejections + other errors occurring in window) / window s, requests/s; primary rate, not an ambiguous percentage |
| Optional outcome percentage | Failures / all terminal outcomes in window × 100; N/A if none; label outcome-based, never divide mismatched arrival/completion cohorts |
| Queue depth | All admitted waiting requests, counted once: ingress, CPU wait, DB connection wait, or DB service wait; excludes active service |
| In-flight | All admitted nonterminal requests, waiting or active; rejected requests never enter this count |
| Estimated memory | 16 KiB per ingress request + 64 KiB per worker-held request (waiting or active); display MiB = bytes / 1,048,576; excludes baseline process memory |
| CPU utilization | Occupied CPU-slot virtual time / available CPU-slot time × 100, per instance and aggregate |
| Worker utilization | Occupied worker virtual time / available worker time × 100; DB wait retains a worker |
| DB utilization | Occupied global DB-service-slot time / available slot time × 100; connections/waits shown separately |
| Cache hit fraction | Hits / completed cache lookups in window; N/A with no lookups; show configured fraction alongside realized fraction |

Queue means are time-weighted; peak queue/memory include event-boundary states. Chart samples
are emitted every 100 ms using the selected trailing window, with instantaneous queue depth;
changing window recomputes retained history consistently or clears/restarts the chart view
with an explicit marker, never relabels old values silently. Official comparison windows do
not change. Percentiles exclude all failures; explanations MUST warn that low successful
latency can hide many timeouts. No concurrent-user count is derived from RPS.

Accounting, cumulatively and per transition: arrivals = admissions + rejections;
admissions = successes + timeouts + other errors + current in-flight. Queued and active
sets are disjoint. Each admitted request has exactly one terminal outcome, and releases all
resources once. Capacity estimates are upper bounds under these assumptions, not benchmarks.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer starting from the documented local prerequisites can launch a fresh
  clone with one command and complete all five lesson stages in under 5 minutes at 1x,
  including predictions, without editing configuration files or creating an account.
- **SC-002**: In the stated final windows, baseline throughput is within 5% of 100 RPS with
  zero failures; the 1,000 RPS one-instance spike completes fewer than 400 RPS, has nonzero
  queue/failure rate, and higher completed p95 latency than baseline.
- **SC-003**: Stages 3 and 4 both complete 350–420 RPS; doubling API instances from four to
  eight changes throughput by at most 5%, with DB utilization at least 90% and DB waiting.
- **SC-004**: Either stage 5 intervention completes at least 850 RPS and reduces failure rate
  by at least 50% relative to stage 4; the explanation cites measured DB demand/utilization
  and distinguishes cache-hit avoidance from increased DB capacity.
- **SC-005**: Same-input replay, 1x/4x, pause/step, and snapshot continuation yield identical
  authoritative states and final observations at the same virtual times, for every lesson stage.
- **SC-006**: A 60-second, 10,000 RPS, eight-instance run never exceeds declared resource,
  queue, memory-estimate, history, or visual limits. On a documented reference laptop with
  at least 4 logical cores and 8 GiB RAM, pause responds within 250 ms and displayed metrics
  refresh at least twice per wall-clock second during supported 4x playback. Release evidence
  records hardware/browser and whether virtual time kept pace; slowing is labeled.
- **SC-007**: Every lesson action and displayed chart value is accessible with keyboard and
  text at 360 px and desktop widths, with reduced motion enabled and no color dependence.
- **SC-008**: A walkthrough can explain all three observations using adjacent numeric evidence:
  arrivals differ from completions; API scaling exposes the DB ceiling; cache hits reduce DB
  demand while API work remains. The reviewer verifies explanations against run summaries.

## Assumptions

The following are explicit educational model assumptions, not measured system facts. Their
values are defaults for model version 1. Changing them requires a new recorded configuration;
changes to semantics require a model-version change and updated expected outcomes.

### Reset and Baseline Defaults

Reset restores 100 RPS, one API instance, normal DB, cache off, all default model parameters,
seed 42, virtual time zero, 1x speed, and the 10-second live window. It clears pending edits,
current predictions, current chart/history, and lesson progress; Last run remains as described
above. Pause Motion follows the learner's accessibility preference. Reset is a sandbox
baseline; Replay Stage preserves the stage configuration instead. Apply & Restart preserves
the selected playback speed/window and saves the outgoing run as Last run. Applying multiple
pending edits is atomic. A finished run cannot Play forward; Replay starts it from empty state.

### Default Model Parameters

| Parameter | Default and units | Supported variation |
| --- | --- | --- |
| Baseline incoming traffic | 100 requests/s | UI presets 100/500/1,000/5,000/10,000; contract accepts integers 100–10,000 |
| Arrival model | Fixed evenly spaced arrivals, first at 1/RPS seconds, no burst randomness | Piecewise-constant schedule; no arrival at t=0; at schedule boundary new rate starts its first interval after boundary |
| Seed | 42, nonnegative 32-bit integer | Recorded for replay; fixed-rate/service/cache schedule uses no randomness, so seed does not change v1 results |
| Virtual step | 10 ms | Step advances 10 ms; discrete events within a step retain exact declared event times |
| API instances | 1 | 1–8 |
| API workers per instance | 32 concurrent requests | Model configuration 1–32; one request retains its worker until terminal outcome |
| API CPU slots per instance | 2 parallel service slots | Model configuration 1–4; illustrative CPU capacity, not real cores |
| API pre-DB CPU service | 5 ms/request | Model configuration 1–20 ms |
| API post-DB CPU service | 1 ms/request, also on cache hit | Model configuration 1–20 ms |
| API ingress queue | 200 waiting requests per instance | Model configuration 0–200 |
| DB connection pool | 8 connections per API instance | Model configuration 1–8 |
| Shared DB service slots | 4 parallel requests globally | Model configuration 1–8; not multiplied by API instances |
| DB service time | Normal 10 ms/request | Slow 20 ms; fast 4 ms; capacity bounds 200/400/1,000 DB requests/s at four slots |
| Cache | Off; on uses configured hit fraction 0.80 | Hit fraction 0–1 inclusive, model configuration only; no extra main-screen control |
| Cache lookup CPU overhead | 1 ms/request when on, including misses | Model configuration 1–5 ms; no separate real cache service |
| Request deadline | 1,000 ms after arrival | Model configuration 100–5,000 ms, applies across all waits/service |
| Ingress memory weight | 16 KiB/request | Fixed estimate; released on worker assignment |
| Worker-held memory weight | 64 KiB/request, replaces ingress weight | Fixed estimate; includes CPU/DB waiting and active work |
| Sandbox duration | 60 virtual s maximum | Guided stages fixed 25 virtual s |
| Live observation window | 10 virtual s | 1/5/10 s |
| Playback | 1x virtual s per wall-clock s | 4x; neither changes model semantics |

Model configuration ranges support deterministic engine/contract testing; only the listed
main controls are exposed to learners. All limits are validated before starting a run.

### Request and Resource Rules

1. Assign each arrival a monotonically increasing identity. Route to the instance with the
   fewest admitted outstanding requests among instances able to admit it; break ties by
   instance number. If every worker and ingress queue is full, reject immediately. An
   available worker admits directly; otherwise enqueue ingress FIFO (first in, first out).
2. A worker is an admitted request's lifetime slot, distinct from CPU. It waits for a CPU
   slot, runs pre-DB CPU service, then (if enabled) lookup CPU service. CPU slots are released
   between phases; CPU jobs are FIFO by ready time then request identity. DB waiting consumes
   a worker but no CPU slot.
3. Cache outcomes use an explicit deterministic schedule, not a capacity multiplier: lookup
   number k is a hit if floor(k × h) > floor((k − 1) × h), with h the configured hit fraction.
   Number lookups in completion order, ties by request identity. Thus h=0 always misses and
   h=1 always hits; report realized fraction. Cache hits skip DB and proceed to post-CPU;
   misses acquire a connection, wait for a global DB slot, run DB service, release both,
   then proceed to post-CPU. Cache has no warming, eviction, network delay, or memory model.
4. Connections are per instance and held from acquisition through DB completion, including
   global DB wait. Connection and DB-service wait are FIFO by ready time then request
   identity; all waiting is bounded by occupied workers, with no separate unbounded queue.
5. After post-CPU, succeed and record arrival-to-completion latency. At deadline, any admitted
   nonterminal request times out, is removed from all waits/active service, and releases
   resources immediately. This cancellation is a simplification; real DB cancellation and
   background work may differ. No retries or independent random failures occur.
6. At identical timestamps: finish service phases first (so success exactly at deadline wins),
   expire remaining deadlines second, dispatch existing waiting work third, admit new arrivals
   fourth, then dispatch newly ready work; use ascending request identity for ties within a
   phase. Record observations after all transitions at that timestamp. Resource release and
   immediate dispatch do not advance time. Events are never rounded to the playback frame.

With default values, one API instance has an ideal CPU upper bound of 2 / 0.006 ≈ 333
requests/s without cache; normal DB has a shared bound of 4 / 0.010 = 400 requests/s.
Cache adds CPU work (2 / 0.007 ≈ 286 per instance) while 80% hits reduce DB visits to about
20% of lookups. Workers, waits, deadlines, and finite observations can lower achieved rates.
These estimates motivate the stages; measured simulated results determine explanations.

### Bounds and Retention

Default maximum admitted work is 8 × (200 + 32) = 1,856 requests. Default maximum waiting
count is at most that number; active requests are excluded. Estimated request memory is at
most 8 × (200 × 16 + 32 × 64) KiB = 41 MiB, with lower configured capacities lowering the
bound. This is not a bound on real application process memory.

At most 600,000 arrivals occur in a sandbox run. Process at most 100 arrivals per 10 ms step
at maximum rate; extra work per admitted request follows its finite lifecycle above, without
retry loops. Keep at most 101,856 successful latency samples for the largest 10-second
observation window (never retain all run requests), 600 chart samples per series, one prior
run summary, five guided summaries, and one continuation snapshot. Each topology link may
show at most 50 moving marks, independent of request count. Chart downsampling MUST preserve
peaks or expose min/max ranges; aggregate effects MUST NOT allocate one UI object per request.
The latency-sample cap covers 100,000 new arrivals plus at most 1,856 requests already
in flight at the window start. Completed history expires after 10 virtual seconds; chart history expires after 60 seconds.
If an internal budget would be exceeded, pause with an explicit limit error rather than
silently dropping outcomes or corrupting percentiles. Normal supported inputs MUST fit.

### Limitations, Dependencies, and Out of Scope

- This is a single-process educational resource model: no real hardware calibration, OS
  scheduling, network jitter, .NET heap/GC visualization, database internals, locks, disk I/O,
  query optimization, replication, or transactional correctness simulation.
- Uniform requests, fixed service times, instantaneous routing, and immediate cancellation
  deliberately omit production variability. No real cache/database is contacted.
- API and DB service times/concurrency are independent configuration values; increasing API
  instances never changes DB slots, DB service time, or cache hit fraction.
- The product depends on a local runtime and browser with documented prerequisites, not
  hosted services. Technology selection follows the constitution during planning.
- No generic editor, additional scenarios, login, saved accounts, persistent history, sharing,
  export/import, real brokers, cloud deployment/integrations, external targets, real load
  testing, autoscaling, retries, multiple request classes, or concurrent-user modeling.
- Only session-local run state is promised; reloading loses comparisons. Specifying these
  requirements does not authorize implementation in this phase.
