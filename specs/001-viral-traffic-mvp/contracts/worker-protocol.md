# Worker Protocol Contract

**Protocol version**: 1 | **Model version**: viral-v1

This is a typed in-browser message interface, not an HTTP API. Implement discriminated
TypeScript unions shared by the controller and worker; validate all incoming shapes at
runtime. Domain fields reference [data-model.md](../data-model.md). No functions/classes,
DOM objects, arbitrary endpoints, storage, or network capabilities are accepted.

## Envelope and identity

Commands have protocolVersion, workerGeneration, commandId, runId (target), type, and a
bounded payload. Generation, run, command, and observation IDs are nonnegative safe integers;
allocate them monotonically without reuse. Worker generation increases on worker
recreation. Run IDs are never reused in a generation. Command IDs increase per generation.
Replies echo commandId where applicable and include protocolVersion, workerGeneration,
runId, observationSeq, and acceptedTimeQ. Progress sequences increase within each run.
Unknown versions/types, invalid numbers/enums, oversized arrays, and invalid transitions
return errors without state changes. Duplicate command IDs return the cached last control
acknowledgment only when payload identity matches; conflicting reuse is rejected. Do not
keep an unbounded deduplication map. Older commands are stale, not replayed.

Main thread checks generation, active run, and sequence before rendering any observation.
A reply older than the latest applied control observation is stale even for the same run.
Errors for invalid commands may be shown without applying their embedded observation.
No wall-clock value participates in model inputs or deterministic comparison.

## Commands

| Type | Payload | Preconditions and result |
| --- | --- | --- |
| INITIALIZE | New runId, baseline seed | Once per new worker; compute baseline to 5 s in cooperative steps; ACK with paused state |
| RUN | Predictions when guided stage 2–5 | ready/paused only; validate required choices; ACK then run to endpoint |
| PAUSE | None | Stop future steps; ACK paused state at current boundary; paused is idempotent |
| STEP | Predictions when guided stage 2–5, unless already accepted | ready/paused, predictions if required; process exactly 100 quanta and all intervening events; ACK paused or FINISHED at endpoint |
| SET_SPEED | 1 or 4 | Pacing only; ACK same model state, no implicit reset |
| REPLACE | New runId, reason, replacement config/stage or reset/replay/enter-sandbox/return-guided intent | Atomic cancel/archive/create; old run becomes invalid immediately in UI; publish ACK addressed to new run with previous summary and replacement paused state |
| ADVANCE_STAGE | New runId, next stage, remedy if stage 5 | Prior lesson explanation available; preserve required references; otherwise reject |
| COMPARE | Current/reference summary identities | Return domain-calculated deltas/directions/evidence; unavailable references return explicit error |
| CANCEL | None | Stop scheduling, capture partial summary at boundary, preserve in-flight; ACK cancelled; restart requires replacement |
| PROGRESS_APPLIED | Applied observationSeq | Return progress credit only for the exact outstanding current-run sequence; no model mutation |

Initial/reset baseline construction is cancellable; no intermediate initializer value may
be presented as final baseline. A repeated pause cannot advance time. A RUN at a finished
endpoint is rejected with replay guidance. A STEP with unmet predictions is rejected just
like RUN. Selecting a node is UI state; observation includes all nine possible resource
nodes (up to eight replicas and DB) plus clients/cache evidence, so no inspection RPC is needed.

Pending edits live in React only until validated REPLACE. The controller must PAUSE and
await acknowledgment before enabling Apply & Restart; fields remain visibly pending. Seed
changes in guided mode restart the lesson rather than mixing references. Enter-sandbox
REPLACE resolves the offered target from authoritative state at the cancellation boundary,
copies applied seed/resources/cache, creates a constant-traffic 60-second run at zero paused,
and clears lesson predictions/references. Return-guided REPLACE creates the default baseline
with applied seed, advances to 5 s paused, and resets lesson state. Both archive old summary,
use new run identity, discard UI drafts with notice, and preserve speed/motion. Mode changes
are disabled before initial initialization settles. Neither changes an old endpoint or reuses
its queue. Sandbox and guided use the same config validator/core. No API exposing a second fast/approximate engine exists.

## Responses

| Type | Payload | Delivery rule |
| --- | --- | --- |
| ACK | Command identity, phase accepted/settled, status, nullable observation; previous summary for replacement | Reliable control lane, not gated on progress credit |
| PROGRESS | Latest observation plus missing retained chart points since applied view | One posted/unapplied message maximum per active run |
| FINISHED | Final observation, complete summary, prediction evaluation/explanation evidence | Reliable; invalidates any older pending progress; run frozen |
| COMPARISON | Reference/current metadata, deltas, directions, evidence | Reliable result for bounded request |
| ERROR | Code, human-readable message, command identity, unchanged authoritative status when available | No fabricated observations; fatal errors stop scheduling |

A final STEP response may be FINISHED instead of ACK, correlated by commandId. A RUN
acknowledgment accepts playback; later FINISHED has no new command ID and refers to that
run. Payload schemas use null for unavailable rates/percentiles, successful sample count,
units/virtual windows, and distinct outcome counts. Send aggregate observations and chart
points, never all active request records. Continuation snapshots are internal core test/
recovery data, not a user export or required progress payload.

Error codes: INVALID_MESSAGE, UNSUPPORTED_VERSION, INVALID_CONFIG, STALE_RUN,
STALE_COMMAND, INVALID_TRANSITION, PREDICTION_REQUIRED, REFERENCE_UNAVAILABLE,
MODEL_LIMIT, WORKER_FAILED. Limit errors pause instead of dropping model events.
Transport/controller failures distinguish a worker crash from simulated request failures.

## Replacement, stale results, and bounded traffic

1. UI allocates a new runId and records old→new replacement immediately; old-run progress
   can no longer render. It sends one REPLACE targeted at old run with the new identity.
2. Worker handles replacement between steps, captures old summary before discarding state,
   then initializes new state. A reset additionally advances the baseline to 5 s, yielding
   each step. ACK identifies the new run and contains any available previous summary.
3. Only the reply matching pending replacement commandId/new runId may install the new view.
   Old control/final replies are consumed/discarded, not rendered. Never derive Last run
   from a stale chart if the worker failed before acknowledging its authoritative summary.
4. Replacement cancellation must acknowledge old-work invalidation within 250 ms; if baseline
   initialization is not complete yet, a reliable accepted/cancelled control acknowledgment
   precedes the later replacement-ready ACK. During this state show initializing, not stale
   or fabricated baseline metrics. Both replies correlate to the replacement command. The accepted-phase ACK carries no
   new-run observation; acceptedTimeQ identifies the old cancellation boundary and is never
   rendered as new-run time. The settled ACK carries computed replacement state and its time.
   An accepted ACK does not enable commands that require a ready replacement.
5. If a healthy worker cannot acknowledge pause/cancel promptly, surface failure; recovery
   may terminate/recreate it and compute a fresh baseline. Mark lost old summary unavailable.
   Such recovery does not count as passing the normal 250 ms performance test.

The controller admits one normal mutating/control request awaiting acknowledgment; UI intents
like speed/selection coalesce to the latest local value, not an unbounded mailbox. One
superseding cancel/replacement may bypass an outstanding request; then reject/discard obsolete
intents. Disable or coalesce further actions until replacement accepted. Read-only comparison
can be computed on explicit request after control settles; no polling queue.

Progress is capped at ten sends per wall-clock second, with control/final replies exempt.
This shell-only pacing does not change 100 ms virtual chart sampling. Progress uses one
credit: worker posts one view, waits for PROGRESS_APPLIED, and keeps core
state current while withholding additional serialization. On credit return, publish current
view if newer. Include all retained missing chart points (at most 600), or explicit replacement
history with a truncation label; dropping transport updates must not lose chart evidence.
Control/final output can supersede a pending progress observation. Applying a control view
must retire older outstanding progress credit so no deadlock remains. At most one pending
control and its superseding cancellation plus one reliable final/error slot are retained;
final/error interrupts playback and coalesces obsolete progress, never silently vanishes.

## Contract verification

**Test ownership and gates**: T021 writes the foundation protocol/client suites. All cases
written there must pass by T026: validation/IDs/transitions, generic execution/step/pause,
structural prediction-required checks for a supplied guided-stage context, cancellation,
reset/replacement accepted-versus-settled acknowledgments, identity/sequence filtering,
credit handling, and reliable final/error delivery. T023/T024 implement these handlers before
T026; no unspecified subset or skipped failing cases is allowed. Prediction presence checks
need stage context and the three choices, not comparison scoring or full lesson progression.

T027/T031 add lesson-aware scoring/reference/prediction integration; T038/T041 add scaling
progression/comparison behavior; T046–T049 add adversarial replacement/mode-switch/recovery
regressions and UI integration using existing foundation handlers. Those later suites are
written in their own phases and must pass their story gates. They do not defer any T021 case.

Vitest tests message validation/versioning, transitions, exactly-once outcomes, pause/step,
replacement acknowledgment order, stale generation/run/sequence rejection, supersession,
progress-credit blocking/release, malformed/duplicate IDs, and terminal message delivery.
Freeze input configurations; verify no mutation of prior core snapshots. Simulate delayed
progress after reset and delayed progress after a newer same-run control acknowledgment.

Playwright verifies real emitted-worker startup at both bases, keyboard flow, pause/reset
under overload, readable worker-failure recovery, and visible same-seed reproducibility.
Testing time/pacing in the shell must not introduce clock dependencies into the core.
