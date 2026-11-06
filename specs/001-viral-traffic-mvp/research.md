# Research: Your App Just Went Viral

**Date**: 2026-11-05 | **Inputs**: [spec.md](spec.md), constitution v2.0.0

All planning unknowns are resolved below. Official documentation informs tool integration;
model decisions derive from the specification's assumptions, not production measurements.
No application or prototype was implemented and no numerical acceptance test has run.

## R1. Toolchain and dependencies

**Decision**: Use Node 24 LTS with bundled npm for development/CI; record an exact supported
patch in the implementation's version file and lock all packages in package-lock.json.
Use React/React DOM, TypeScript strict mode, Vite with its React plugin, Recharts, Tailwind
CSS with its Vite plugin, Vitest, Playwright Test, and ESLint with TypeScript/React rules.
Resolve compatible stable package releases together at scaffolding; no floating latest
versions in committed scripts. Vite and Vitest current prerequisites permit this Node line.

**Rationale**: One npm project and the constitution's required tools cover the product.
Node is never a deployed server. Vite transpilation is accompanied by an explicit TypeScript
check; builds alone are not evidence of type safety.

**Alternatives**: No React Flow for a fixed graph, Zustand without a state-sharing need,
router for a single screen, RPC/schema/quantile library, UI component framework, monorepo,
backend, or Docker. Use explicit small validation functions and typed message unions.

Sources: [Vite prerequisites](https://vite.dev/guide/),
[Vitest prerequisites](https://vitest.dev/guide/),
[Playwright prerequisites](https://playwright.dev/docs/intro#system-requirements),
[Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite),
[Recharts installation](https://recharts.github.io/en-US/guide/installation/).

## R2. Static host and worker bundling

**Decision**: Target GitHub Pages first, retaining Cloudflare Pages-compatible root builds.
Use Vite base `/` for root and `/SystemScope/` (or the actual repository name) for project
Pages. Construct one module worker using Vite's direct Worker/new URL/import.meta.url
pattern with static options, so Vite emits and resolves its hashed asset. Import assets;
never hardcode root-relative asset/worker paths. No pathname router; panels use local state
and optional section fragments. Only dist is deployed, with no Pages Functions or analytics.

**Rationale**: GitHub Actions already supplies the required CI. Static files need no API
or path rewrite. Worker bundling must be tested in the production build, not only dev mode.

**Alternatives**: Cloudflare Git-integrated static Pages is an equivalent allowed publishing
choice, with `npm run build` and `dist`; no Wrangler dependency/framework adapter is needed.
Do not deploy Vite dev/preview as the application server. No runtime CDN scripts or fonts.

Sources: [Vite worker bundling](https://vite.dev/guide/features#web-workers),
[Vite static deployment and base](https://vite.dev/guide/static-deploy),
[Cloudflare React static Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/).

## R3. Deterministic time and event processing

**Decision**: Implement a discrete-event core exposed in 10 ms steps. Represent time as
integer 100-microsecond quanta: preset arrival intervals are respectively 100/20/10/2/1
quanta, CPU times 50/10 quanta, lookup 10, DB 200/100/40, deadline 10,000. Maximum time
is 600,000 quanta. These are exact representations of every supported preset/default;
no floating accumulation or frame rounding is needed. Omit the optional arbitrary-RPS slider.
Use the specification's tie order and fixed cache-hit schedule; represent 80% as 4/5, with
0/1 and 1/1 fixtures, avoiding floating-point hit-threshold drift.

**Rationale**: The slider is optional; adding fractional timing machinery has no MVP value.
Seed is preserved but intentionally does not affect the fixed schedule. The core has no
clock, timers, Math.random, browser, storage, or React dependencies. Event stepping jumps
between events within the requested step, rather than iterating all time quanta.

**Alternatives**: Floating absolute time needs a documented tolerance/tie policy; per-frame
capacity formulas cannot reproduce queue/resource/deadline behavior. Neither is needed.

## R4. Finite scheduler and exact observation windows

**Decision**: Use an indexed min-heap for scheduled events and bounded FIFO wait queues.
Cancel pending completion/deadline entries eagerly; do not accumulate cancelled tombstones.
One next-arrival event, one schedule-boundary event, and at most two scheduled events per
admitted request fit within a conservative 4,000-event cap (2×384+2 < 4,000).
Sample output at 100 ms; Step endpoints are 10 ms-aligned. Use 1,000 closed 10 ms statistics
buckets for the exact trailing 10 s, plus the current accumulator. Integrate busy-slot time
and queue area across exact event intervals, not from displayed chart samples. Preserve
per-bucket peaks for final-window maxima. Keep cumulative run totals separately.

Maintain an expiring completion ring (at most 100,384 samples) and a 10,001-bin latency
histogram in 100-microsecond units, from zero through the 1,000 ms deadline. Select nearest-
rank p50/p95 by cumulative count, never averaging percentiles or inventing empty samples.
Every successful latency is exactly representable under R3. Counts for each outcome use
exact bucket intervals; successes are timestamped by completion, not arrival.

**Rationale**: Bounded arrays/rings avoid request-history growth. Histogram rank scanning is
bounded to 10,001 bins per observation and exact for this model, needing no approximation
package. Observation windows always end on 10 ms boundaries. Preserve the final 10 s when
stopping; do not drain beyond the run endpoint.

**Alternatives**: Unbounded event logs, lazy cancelled events, sorting all run successes,
per-request DOM, or estimating percentiles from mean latency violate bounds or honesty.

## R5. Playback, cancellation, and message pressure

**Decision**: The worker shell, outside the core, schedules at most one 10 ms virtual step
per event-loop turn. Wall timers/performance measurements may pace shell playback only.
Yield after each step; process pause/cancel commands before scheduling another step.
Use run identity, worker generation, command IDs, increasing observation sequence, and
command acknowledgments. One credit allows one unacknowledged progress message; retain current core state without
serializing further views until the main thread applies/acknowledges the old one. Limit
progress to ten wall-clock sends/s while preserving all 100 ms virtual chart samples.
Use a separate bounded control lane for acknowledged commands and final/error responses.

Invalidate the old run immediately in the UI on reset/restart, request an authoritative old
summary, then initialize replacement state. Do not display new-baseline results until computed.
If acknowledgment misses 250 ms in the supported reference environment, report the failure,
terminate/recreate the worker, and mark old summary unavailable if it was not received.
Never manufacture a partial summary from stale display values.

**Rationale**: Worker execution alone does not make a whole-run synchronous loop cancellable.
Cooperative steps and true message credit prevent an unbounded browser message backlog.
Hard termination is recovery, not proof that the normal cancellation performance gate passed.

**Alternatives**: Ignoring React renders alone does not bound posted messages. SharedArrayBuffer,
cross-origin isolation, and a worker pool add complexity without a demonstrated requirement.

Source: [Worker.terminate semantics](https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate).
Scheduling/credit rules are project design decisions derived from FR-011 and spec budgets.

## R6. Presentation and persistence

**Decision**: Keep one React reducer for lesson/run coordination, pending edits, predictions,
selected node, motion, and latest immutable worker view. Scoped context supplies actions;
chart data and controls have separate component boundaries. Explanation templates consume
worker-calculated evidence/directions; React formats values without recomputing model metrics.
Use Recharts with numeric text/table alternatives, bounded series, and disabled animation
under reduced motion. Use fixed SVG/CSS for topology. Default to session-only state: omit
optional localStorage progress/preferences and optional slider from initial tasks.

**Rationale**: Core learning needs no persistence or external state package. Session-only is
explicitly allowed by A-15; add storage later only with failure tests and recomputed evidence.

**Alternatives**: No second sandbox engine. Entering sandbox replaces the run with empty
paused state and a 60-second endpoint, using applied resources/seed/cache and constant traffic
resolved at cancellation; returning guided recomputes the default baseline. Neither transition
mutates an old config/queue. No chart library tooltip or accessibility feature substitutes for text values and keyboard evidence.

Source: [React reducer reference](https://react.dev/reference/react/useReducer).

## R7. Validation and numerical confidence

**Decision**: Build the pure engine and D1–D3 acceptance fixtures before presentation. Vitest
checks accounting, limits, event ties, replay/continuation, successful-only percentiles, cache
extremes, and protocol handling. Playwright runs the real bundled worker against production
static files, using learner controls at 4x for practical CI duration; no alternate test engine.
Check root and subpath builds on a file server without SPA fallbacks, then the selected
actual deployment. Assert network requests are own static assets only. Install Playwright
browsers in CI without a Docker requirement.

**Rationale**: Capacity arithmetic supports the lesson targets but is not a proof of completed
rates under queues and deadlines. SC-002–SC-004 remain unverified until fixtures execute.
If they fail, inspect event semantics and document evidence; do not tune outputs, relax
thresholds, or change model assumptions silently. Resolve genuine spec defects explicitly
before further implementation. Gate verification is implementation/release work, not a
completed planning result.

Source: [Playwright CI](https://playwright.dev/docs/ci).

## Research outcome

No blocking clarification remains. Optional slider/persistence are deferred within existing
scope; no constitution exceptions are requested. Proceed to the Phase 1 contracts and data
model. Source compatibility checks must be repeated when locking actual dependencies.

## R8. Explore-first amendment (2026-11-06)

**Decision**: Default to editable Explore inputs plus real completed results. Run computes
60 virtual seconds quickly; Watch optionally paces the same core. Charts and guided lesson
are independent opt-in presentation chunks. Retain bounded model chart sampling but omit
history transport until subscribed; opening delivers genuine retained samples. No dependency,
model constant, or underlying resource behavior changes. Protocol v2 adds execution intent
and chart subscription, retaining cooperative cancellation/identity/credit safeguards.

**Rationale**: The user selected both optional views and fast results in two clarification
answers. Source inspection found the charts already use actual model observations, while
initial guided mode locks controls and the chart component mounts automatically. Reusing the
engine preserves truthful evidence and keeps one engineer able to understand the system.

**Alternatives considered**: Guided-first entry and always-visible charts contradict the
clarified journey. Mandatory paced runs slow comparisons. A separate approximate fast engine
would compromise determinism. Disabling chart capture would lose earlier real observations;
retaining at most 600 samples while avoiding hidden rendering/serialization is sufficient.
No new technology research is required; implementation performance must be measured.
