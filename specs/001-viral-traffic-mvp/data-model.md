# Data Model: Your App Just Went Viral

**Status**: Phase 1 design, not executable types. [Specification](spec.md) is authoritative
for product behavior; [research](research.md) records implementation decisions.

## Units and validation

Time uses integer `TimeQ`, 100 microseconds per quantum; 10 quanta = 1 ms. `nowQ` ranges
0–600,000; exposed states occur at 100-quanta (10 ms) boundaries. Events within a step keep
their exact quantum. Configuration times are positive integers, fixed by model v1.
All numeric inputs must be finite; no NaN, Infinity, fractional seed/replica count, or coercion
from arbitrary strings. Seed range is 0–4,294,967,295. Null represents unavailable metrics,
never zero as a substitute. Percentages range 0–100; rates use requests per virtual second.
Sizes use bytes internally and MiB in presentation. Domain data is structured-cloneable;
no functions, DOM nodes, or class-instance behavior crosses the worker boundary.

## Entities and relationships

### ScenarioConfig

| Field | Type/constraint | Meaning |
| --- | --- | --- |
| modelVersion | Literal `viral-v1` | Binds semantics/parameters; reject incompatible versions |
| seed | Unsigned 32-bit integer | Recorded; fixed model does not consume randomness |
| replicaCount | Integer 1–8 | Number of identical API groups |
| dbPreset | slow / normal / fast | Service duration 200 / 100 / 40 quanta |
| cacheEnabled | Boolean | Lookup overhead on hits and misses |
| cacheHitRatio | Rational numerator/denominator | Learner default 4/5; test fixtures may use 0/1 or 1/1 |
| traffic | Validated schedule | Sandbox one constant preset; guided fixed 100→1,000 RPS schedule |
| endpointQ | 250,000 guided; 600,000 sandbox | Stop without draining unfinished requests |
| parameters | Model-version constants | 32 workers, 2 CPU slots, 200 ingress positions, 8 connections per replica; 4 shared DB slots; service/deadline/memory weights from A-04–A-10 |

Only spec main controls are editable. Internal cache-extreme fixtures use the same core;
no learner UI for unsupported arbitrary model values. Traffic presets are exactly
100/500/1,000/5,000/10,000. No optional slider in this release. Each segment has start/end
quanta and RPS; segments cover the run without overlaps/gaps. A boundary uses the old segment
through its endpoint arrival, then schedules the first new-rate arrival one new interval later.
There is no arrival at zero or duplicate arrival at a schedule boundary. Count arrivals at
the final timestamp before producing the final state. Configuration is immutable per run.

### CoreState / RequestState

CoreState owns config, nowQ, next request identity, schedule cursor, cache lookup ordinal,
resource arrays, live request records, pending events, observations, and cumulative counters.
Transport identity, wall-clock pacing, and lesson selection are not model inputs.

Each request has identity, replica index, arrivalQ, deadlineQ, phase, phaseReadyQ, any active
service completionQ, held worker/CPU/connection/DB slot IDs, and cache outcome if determined.
No request record is allocated for a rejected arrival beyond its immediate count/log entry.
Terminal records are removed; a successful sample keeps only completionQ and latencyQ.

Phases:

`ingressWait → preCpuWait → preCpuService → [lookupWait → lookupService] →`
`[connectionWait → dbServiceWait → dbService] → postCpuWait → postCpuService → success`.

Cache off omits lookup; a hit omits DB connection/service. Any admitted nonterminal phase may
transition to timeout at deadline. All waits are FIFO by ready time/request identity; routing
uses least outstanding among replicas able to admit, tie by replica index. Promote oldest
ingress work when a worker frees before admitting a same-timestamp new arrival. CPU is
released after each service phase, not held during DB waits. Timeout removes pending events
and queue references and releases held resources exactly once. No random failure/retry path.

### ResourceState

Per replica: 32 worker slots, 2 CPU slots, 8 connection slots, ingress FIFO of length at most
200, CPU-ready FIFO, connection-wait FIFO, outstanding count. Globally: four DB service slots
and DB-ready FIFO. Every resource records busy count and integrated slot-quanta.
Waiting outside ingress is bounded by occupied workers, not additional admission capacity.
A DB-ready request holds a connection while waiting/serving, releases it at DB finish, then
waits for post-CPU. At any observable instant a request is either waiting or actively serving,
never counted twice. Occupied workers include both groups.

### EventSchedule

Events contain timeQ, phase priority, request identity, kind, and cancellation handle. Use an
indexed min-heap ordered deterministically. At a timestamp, drain all service finishes,
resolve success-at-deadline, expire remaining deadlines, dispatch existing waits, process
arrivals, then dispatch newly ready work. Ties use ascending request identity; deterministic
slot allocation uses smallest available slot index. No zero-duration service loops.

Store at most one next-arrival and one schedule-boundary entry, plus at most two pending
entries per request (deadline and active-service finish); cap 4,000. Remove counterpart
entries when requests terminate. Observation cadence belongs to step/output logic and need
not add one event per sample to the heap. Heap order and handles are included in snapshots,
or rebuilt canonically from a documented equivalent representation before continuation.

### ObservationWindow

| State | Bound/semantics |
| --- | --- |
| Statistics buckets | 1,000 closed 10 ms buckets plus current accumulator, covering latest 10 s |
| Outcome counters | Offered/admitted/success/timeout/rejection/other-error and cache hit/lookup counts, exact per bucket |
| Integrals | Queue-count-quanta and busy-slot-quanta, accumulated across exact event intervals |
| Extrema | Event-boundary queue and memory peaks within each bucket |
| Success ring | At most 101,856 pairs of completionQ/latencyQ, chronological with identity tie order |
| Latency histogram | 10,001 integer bins, exact successful latency in quanta from 0 through deadline |
| Cumulative counters | Totals across entire run; do not reset when old buckets expire |

Windows are left-exclusive/right-inclusive. Expire contributions ending at/before t−10 s;
retain completions at t. At t=0 rates and averages are null. At Step/output boundaries,
10 ms buckets exactly cover the requested window. Before overwriting an expiring bucket,
remove its histogram contributions via chronological sample expiry. Histogram total equals
retained successes. Compute p50/p95 by nearest-rank counts, not chart interpolation.

Integrate queue and resource occupancy over elapsed time before applying event changes;
update peaks after each atomic transition. At a window start, seed peak tracking with the
boundary state continuing into the window; do not import an expired bucket's peak. This
avoids frame-dependent estimates. Bucket sums yield final (15,25] guided comparisons.

### Observation / ChartPoint

An observation includes nowQ, windowStartQ/endQ/duration, configured target, actual window
counts/rates, successful sample count/p50/p95, queue/in-flight counts, mean/peak queue,
estimated current/peak bytes, per-resource instantaneous fractions and window percentages,
realized/configured cache hits, cumulative totals, bottleneck evidence, and assumption IDs.

A chart point is emitted after each completed 100 ms boundary, not at t=0: at most 600 points
per series. Rates/latency use trailing windows; queue/memory use instantaneous samples and
per-interval min/max for preserved peaks. Failure charts show separate counts in (t−100 ms,t],
not misleading cumulative counts labeled as intervals. Run totals remain separately visible.
Worker sends missing chart points since the last applied sequence, bounded by the 600-point
history; superseding progress cannot erase chart data. Text values preserve unrounded source
numbers for comparisons; formatting is only presentation.

### RunSession and LessonState

RunSession has runId, worker generation, immutable config, core state, status
initializing/ready/running/paused/finished/cancelled/failed, and bounded current/last summaries.
At most one current run exists. One worker serves guided and sandbox modes. LessonState
includes stage 1–5, step predicting/running/explaining, submitted choices, fixed reference
summary IDs, and remedy selection. The worker coordination layer evaluates directions and
bottleneck evidence using pure domain functions, not React calculations.

| Action | State transition / result |
| --- | --- |
| Initial visit | Compute stage 1 from zero to 5 s; publish paused baseline, no synthetic values |
| Run | ready/paused → running, provided required predictions supplied and no pending edit |
| Pause | running → paused at acknowledged 10 ms boundary |
| Step | ready/paused → next 10 ms boundary → paused; at endpoint → finished |
| Endpoint | Stop exactly at configured endpoint, preserve unfinished in-flight work, summarize |
| Stage advance | Keep bounded reference summaries, replace current with next stage from zero |
| Pending edit | Pause first, keep old config/results, edit UI draft only |
| Apply & Restart | Archive old complete/partial summary, cancel old state, create fresh applied config at zero, paused |
| Discard edit | Keep old run unchanged and paused; Play explicitly resumes |
| Replay | Same config/seed/model from zero, paused; save outgoing summary |
| Reset | Cancel old run, baseline parameters with applied seed, compute 5 s, paused; stage 1; retain old summary |
| Enter sandbox | Cancel/archive old run; new runId at t=0 paused, endpoint 600,000 quanta; copy applied resources/cache/seed and constant offered target at cancellation boundary; discard drafts with notice, clear lesson predictions/references/charts; preserve speed/motion |
| Return to guided | Cancel/archive sandbox; new runId with default baseline resources/applied seed, endpoint 250,000 quanta; compute to 5 s paused stage 1; discard drafts with notice, clear predictions/references/charts; preserve speed/motion |
| Failure | Stop progress, publish error; no reconstructed metrics; restart available |

Mode switches are disabled until initial baseline initialization settles. They never mutate
an existing run's config/endpoint or migrate queued requests. At sandbox t=0, rates/averages
are null and counts zero until computed. Cleared guided references are recomputed through
normal stage progression, not recovered from old comparisons or fabricated.

Cancellation is a control transition, not a timeout/error outcome. It preserves old in-flight
counts in the partial summary rather than terminating requests or draining the queue.
Snapshots capture model state at acknowledged boundaries; same continuation yields identical
outcomes. Use copy-on-write bounded pages/structures at step boundaries to preserve pure
inputs without copying all retained history on every event. No externally visible mutable
aliasing between old and next state; freeze/hash old-state fixtures to test this property.

### Summary and Comparison

Summary fields: config/model/seed, observation window and duration, complete/partial status,
reason, sample count, rates/counts, percentiles, mean/peak queue, peak estimated memory,
CPU/worker/DB window utilization, remaining in-flight, assumptions, and evidence references.
Complete means endpoint reached, not that every request succeeded or drained. Partial uses
actual available trailing window and is never compared as an equal-duration official stage.
Keep one Last run, up to five guided reference summaries, and one continuation snapshot.
Stage 5 always compares to stage 4 even when the alternative remedy is replayed.

Comparison contains explicit reference/current values, units, delta, relative delta if
reference nonzero, and increase/same/decrease/insufficient-samples. The ±5% rule is applied
to unrounded values. Zero→zero is same; zero→positive is increase; null yields insufficient.
Each explanation cites at least two values plus their observation basis and assumption IDs.
No prewritten stage outcome may override actual evidence.

## Aggregate limits and invariants

- Admitted ≤ 1,856; workers ≤ 256; ingress ≤ 1,600; DB active ≤ 4; CPU active ≤ 16.
- Simulated request memory ≤ 42,991,616 bytes (41 MiB). It is unrelated to JS process memory.
- Arrivals ≤ 600,000, steps ≤ 6,000; event heap ≤ 4,000; no lazy cancelled-entry growth.
- History: success samples ≤ 101,856, histogram 10,001 bins, chart points ≤ 600/series,
  diagnostic log ≤ 1,000 when enabled, disabled by default. All are per active run.
- Transport: one unapplied progress view, one normal command plus one superseding cancel/
  replacement maximum; no unbounded UI intent queue. At most 50 moving marks per link.
- Conservation equations from spec hold after every timestamp and step. Resource counts
  never go negative/exceed capacity; no double membership, terminal outcome, or release.
- Replay equality compares model data only, excluding transport IDs and wall-clock telemetry.

## Persistence

Initial release uses session-only state. No localStorage adapter or saved progress is needed.
If optional persistence is later implemented within scope, it holds versioned preferences/
lesson location only, catches read/write failures, validates stored data, and recomputes all
required evidence. It never hydrates simulation state or changes seed/model outcomes silently.
