# Learner UI and Static Hosting Contract

References: [spec.md](../spec.md), [worker protocol](worker-protocol.md).
This documents observable integration boundaries, not a pixel design or extra feature set.

## Screen and controls

One document at the configured base contains Topology, Controls, Metrics, Lesson/Explanation,
and a visible Assumptions action in every state. Initializing and error states are explicit.
No account, pathname router, separate landing, or external navigation is required.
On narrow screens use vertical flow; component selection opens an accessible inspector
without losing context. Desktop can place related areas side by side.

Use native buttons, select/radio groups, and number input for seed. Names include units
(e.g. Offered traffic, requests/s). Guided mode visibly locks resource settings to the stage;
sandbox unlocks the same engine's controls. Entering sandbox replaces the run with empty
paused state at t=0 and a 60-second endpoint, copying applied resources/cache/seed and the
offered target at cancellation boundary as constant traffic. Returning guided recomputes
baseline to 5 s paused with default resources/applied seed. Both archive Last run, clear
predictions/references/charts, discard drafts with notice, preserve speed/motion, and reject
old results. Disable mode changes until initial baseline is ready; never mutate an endpoint
or imply the old backlog carried into the new mode. Predict with three labeled radio groups and
increase/approximately same/decrease choices. Missing answers explain disabled execution.
Expose Run, Pause, Step 10 ms, Reset, Replay, Speed, Guided/Sandbox, Pause Motion, and
Apply & Restart/Discard when relevant. Focus is visible; dialogs return focus to their trigger.
Reset restarts stage 1 with applied seed; discard pending seed is explicit in reset help.

Metrics show offered target and observed offered rate separately, admitted/completed rate,
p50/p95/sample count, pending/in-flight, separate timeout/rejection/error counts and rates,
estimated memory, CPU/worker/DB utilization. Inspectors show instantaneous fractions separately
from window averages. None of those simulation values are calculated by React.

Charts have titles/units, synchronized virtual-time axis, spike annotation, and readable
values/text summaries accessible without color or hover. At most 600 samples/series; peak
ranges remain visible. Failure chart values label 100 ms intervals separately from run totals.
No animation or chart tooltip alone carries evidence. Use a text table/expandable accessible
list for retained samples with bounded rendering, and summaries for quick reading.
Use no more than 50 moving marks per topology link; marks depict aggregate flow, not requests.

Reduced motion and Pause Motion stop topology and chart transitions without pausing virtual
time. Simulation Pause freezes model progression after acknowledgment. Do not announce every
sample through a live region; announce meaningful stage completion, pause, validation/error,
and comparison results without flooding assistive technology.

## Honesty and explanation

Assumptions shows the spec ledger, model version, fixed seed-independent schedule notice,
cacheable-read assumption, cache overhead, resource bounds, successful-only latency caveat,
and modeled memory versus JS process memory. Keep “Educational simulation, not a benchmark”
visible near results. Explanations cite worker evidence IDs, exact values and windows; the
presentation layer only formats them. An unsaturated model reports no saturated bottleneck.

Comparison displays unrounded-authoritative direction decisions with rounded readable values,
configuration differences, equal/partial window labels, sample counts, and N/A where needed.
Explain why early throughput can rise after a spike yet remain far below arrivals, and why
low latency among successes can conceal many timed-out requests.

## Static routing and network boundary

- Supported bases: `/` and configurable `/<repository>/`, with trailing slash normalization
  supplied by the static host. For the current name, test `/SystemScope/` explicitly.
- Entry/refresh at the base and fragment navigation use the same static document. No clean
  deep pathname URLs or SPA fallback requirement are introduced.
- Vite imports resolve all JS/CSS/images/worker assets under base; no hardcoded `/assets`
  paths, external fonts/CDNs, analytics, WebSocket, fetch API service, or real targets.
- Page startup, worker module fetch, and bundled application assets are allowed static
  requests. The test server supplies files and 404s for missing paths, not application data.
- Publish only `dist`; GitHub Pages is the initial host. Cloudflare Pages can serve root
  output unchanged. No production Node server, Pages Functions, Docker, or worker backend.
- Reject third-party/data requests in E2E network assertions while allowing declared own
  static assets. Development-only Vite hot reload is not part of production evidence.

## Required visible-flow tests

Use accessible roles/names to exercise the five-stage lesson (D1–D3), both stage 5 remedies,
missing predictions, inspection, pause/step, pending edits, reset/stale results, and same-seed
replay. Run at 360 px and 1,280 px with reduced motion and keyboard navigation. Verify a real
module worker, final observation labels, and no runtime-service calls. Observe actual
production-build assets at both bases and on the selected deployed host; retain URLs and
network/console evidence. Do not replace the model with mocks in the key lesson test.
