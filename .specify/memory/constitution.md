<!--
Sync Impact Report — temporary review material; remove before committing this constitution.
Version: 1.0.0 → 2.0.0 (incompatible browser-only architecture and contract requirements).
Modified principles: I Education First; II Technical Honesty; III Deterministic Simulation;
V Testable Behavior; VI Separation of Concerns; VII Developer Experience;
IX Bounded Performance; X Simulation Only. Titles and all ten principles retained.
Updated sections: Implementation and Scope Constraints; Review and Release Gates.
Added sections: none. Added static deployment gate within existing review section.
Removed sections: none. Removed C#/ASP.NET Core, HTTP API, Docker/dotnet setup, and
backend-only testing obligations; replaced with TypeScript/Web Worker equivalents.
Follow-up conflicts (not modified here): specs/001-viral-traffic-mvp/spec.md must align
runtime/hosting scope, worker cancellation and stale-result rules, optional local preferences/
lesson progress, worker protocol tests, and static deployment acceptance criteria.
specs/001-viral-traffic-mvp/checklists/requirements.md must be re-reviewed against v2.0.0.
No existing plan.md or tasks.md found; future planning/tasks must use this architecture.
Dependent templates/commands unchanged. Deferred placeholders: none.
-->

# SystemScope Constitution

SystemScope is an open-source, portfolio-quality interactive backend and system-design
learning simulator. Its mission is to teach what happens to requests, latency, queues,
memory, CPU and worker capacity, and databases as incoming load rises. Learners MUST be
able to predict, experiment, observe evidence, and read clear English explanations.

## Core Principles

### I. Education First

Every learning interaction MUST connect the learner's action to visible cause and effect,
with a short contextual explanation adjacent to the evidence. Plain English MUST precede
jargon; unfamiliar technical terms MUST be explained where first used. Controls, charts,
topology, and text MUST tell a consistent story. The learning flow MUST use Predict → Run →
Explain with observable causal evidence. Visual polish MUST support understanding.

### II. Technical Honesty

The UI and model documentation MUST distinguish modeled assumptions, simulated observations,
and technical facts. Material assumptions and limitations MUST be visible where they affect
interpretation. Hypothetical results MUST be labeled as simulation results and MUST NOT be
presented as real benchmarks, measured production throughput, or predictions of a particular
production system. Numerical claims MUST derive from a coherent resource and request model,
not arbitrary illustrative formulas. Approximations and uncertainty MUST be documented;
physical realism MUST NOT be claimed for behavior the model does not represent.

Metric contracts and visible labels MUST define units, populations, and time windows:

- Offered/incoming RPS (requests per second) measures arrivals per virtual-time interval;
  configured target RPS MUST be distinguished from observed arrivals over a window.
- Admitted RPS measures arrivals accepted into the simulated system per virtual-time interval.
- Queued requests count admitted work waiting for a resource, distinct from active service.
- Requests in flight count arrived requests without a terminal outcome, including queued
  and actively processed requests.
- Completed throughput measures successful completions per virtual-time interval. Failures,
  rejections, timeouts, and other errors MUST be counted separately.
- Concurrent users count simultaneously active users under an explicit user-behavior model;
  they MUST NOT be inferred from RPS alone.

These quantities MUST NOT be equated or substituted for one another. Latency MUST state
which requests it measures and whether it includes queue wait. CPU, memory, worker, and
database metrics MUST explain what is modeled and which real-world behavior is omitted.

### III. Deterministic Simulation

Identical scenario configuration, seed, and ordered simulation inputs MUST produce identical
results for the same documented engine/model version. A seed is the starting value used to
reproduce pseudo-random choices. The engine MUST use explicit ticks or steps and controlled
virtual time. Wall-clock timing, worker-message timing, and rendering speed MUST NOT affect
outcomes. Date.now(), Math.random(), and real timers MUST NOT be used in the core model;
any pseudo-random behavior MUST use explicit seeded state. Playback scheduling MUST remain
outside the core and MUST NOT change virtual-time results.
Pause MUST stop virtual time; a step MUST advance only its declared virtual-time amount.

The computational core MUST be pure: explicit inputs and state produce outputs and next
state without network, file, clock, or UI side effects. Reproducible snapshots MUST contain
or identify configuration, state, virtual time, seed/random state, and model version needed
for continuation. Automated replay tests MUST verify identical results and continuation.

### IV. One Polished MVP

The first release MUST deliver one complete traffic-spike scenario before adding scenario
breadth or a generic editor. It MUST support prediction, configuration, execution,
observation, explanation, and repeatable comparison. Its modeled behavior MUST make request
flow, latency, queue buildup, memory pressure, CPU/worker capacity, and database constraints
under rising load understandable.

A release MUST include a working end-to-end demo with documented steps and expected learning
outcomes. Portfolio quality means a coherent, usable demo, clear documentation, reproducible
behavior, and passing review gates; feature count is not a quality measure.

### V. Testable Behavior

The engine MUST have Vitest unit, determinism, and invariant tests: checks of rules that
remain true across steps. These MUST cover request accounting, nonnegative quantities, declared
capacity limits,
virtual-time progression, deterministic replay, traffic spikes, boundary inputs, and declared
overload outcomes. The worker input/output protocol MUST have contract tests for typed
messages, validation, errors, cancellation, and stale-result rejection.

The UI MUST have essential Playwright flows for configuration, prediction, run, pause,
step, reset/replay, and result inspection wherever provided. Behavior changes MUST update
relevant tests. Known limitations MUST be documented and surfaced in the UI when they affect
interpretation. Tests MUST verify observable behavior rather than only implementation details.

### VI. Separation of Concerns

The simulation MUST be pure TypeScript logic independent of React and presentation code,
with tests runnable without a browser or application server. Simulation computation MUST
execute in a dedicated Web Worker. Typed input/output protocols MUST define validated
commands, results, and errors. React and presentation code MUST NOT calculate authoritative
simulation metrics or advance authoritative state; the worker-hosted core owns those results.

Formatting, chart downsampling, and visual interpolation MAY transform presentation only;
they MUST preserve the meaning of engine results. Optional preferences and lesson progress
MAY be stored in localStorage outside the core. Simulation execution and determinism MUST NOT
depend on localStorage; unavailable, corrupt, or cleared storage MUST NOT prevent simulation.
These boundaries maintain one reproducible source of truth.

### VII. Developer Experience

A fresh checkout MUST have a documented npm install and one-command local start path.
Required Node/npm versions and prerequisites MUST be explicit; Node is development/build
tooling only, not a deployed application server. Running the MVP MUST require no account,
secret, Docker installation, or external runtime service.

The repository MUST provide typed worker protocols and scripts for lint/static checks,
typecheck, Vitest unit tests, Playwright flows, and production build. GitHub Actions MUST
run build, test, and typecheck checks, including the required end-to-end flow. Documentation
MUST explain startup, checks,
demo reproduction, and contribution. The project MUST include an explicit open-source license.

### VIII. Accessibility and Responsiveness

Core learning interactions MUST work with keyboard controls, visible focus, accessible
control names, readable text, and layouts usable at narrow viewport widths. Charts MUST
communicate values, units, and outcomes through accessible text or value summaries as well
as color. Meaning MUST NOT depend on animation alone.

Motion MUST be pausable and respect reduced-motion preferences. Pausing decorative motion
MUST NOT alter simulation outcomes. Core flows MUST be checked for keyboard access, focus,
readability, reduced motion, and responsive layout before release.

### IX. Bounded Performance

The UI MUST NOT render a DOM element for every simulated request. Request motion MUST use
aggregate visual effects. Charts MUST downsample displayed history while preserving relevant
peaks and the meaning of authoritative results.

Simulation work per step, run duration, input ranges, queues, event logs, retained history,
snapshots, and visual effects MUST have explicit finite limits. Inputs beyond supported limits
MUST be rejected
or handled by a documented bounded policy. Implementations MUST document numeric budgets
and a reproducible maximum-supported-load check before claiming performance compliance.
Queue overflow and history truncation MUST be visible when they affect interpretation.
Optimizations MUST preserve determinism. Unbounded work or memory growth is prohibited.
Worker computation MUST NOT block UI interaction or animation. Work MUST be cancellable
within a documented finite responsiveness budget. Reset, restart, and cancellation MUST
invalidate old work; commands/results MUST carry run identity or equivalent ordering so
late messages cannot overwrite current state. Cancellation MUST NOT wait for an entire run
to finish. Worker/main-thread message queues MUST also have bounded update/backpressure rules.

### X. Simulation Only

All workload and resource behavior MUST remain simulated. The product MUST NOT accept
arbitrary user-supplied target endpoints, generate load against third-party services, or
provide an externally reachable stress-test capability. The MVP MUST make no runtime network
calls for simulation, telemetry, data, or external services. Initial delivery of its own
static application assets, including the worker bundle, is permitted; assets MUST be served
from the static deployment rather than runtime third-party CDNs. This restriction also
applies to shipped demos, examples, utilities, and future extensions.

## Implementation and Scope Constraints

The fixed MVP architecture is a static React + TypeScript + Vite application hosted on
Cloudflare Pages or GitHub Pages, with all simulation computation in a dedicated Web Worker.
No ASP.NET Core, Node application server, serverless API, database, authentication, Docker
dependency, external runtime service, or runtime network call is permitted. Simulated API
instances and databases are educational model resources, not deployed application services.

Use Recharts for graphs and Tailwind CSS for styling. Prefer SVG/CSS for the fixed topology;
React Flow requires a documented interactive graph requirement within the MVP that SVG/CSS
cannot reasonably meet. Introduce Zustand only when a documented state-sharing need makes
it useful. Dependencies MUST be few, justified by current requirements, and keep the
architecture understandable by one engineer. Changing the fixed architecture requires a
constitution amendment rather than a per-feature exception.

Static deployment MUST work at both root URLs (Cloudflare Pages) and repository subpaths
(GitHub Pages) using a configurable Vite base. Application assets, worker loading, and any
navigation MUST respect that base without requiring a server-side application or rewrites
unavailable on the selected host. Local development/build tooling is not a runtime service.

**Explicit out-of-scope rule:** work that is not necessary to deliver, explain, verify, or
run the single traffic-spike scenario MUST be deferred from the first release. This includes
generic editors, additional scenarios, authentication, persistent simulation storage, real
brokers, runtime cloud integrations, and real load generation. Static hosting and optional
localStorage preferences/lesson progress are explicitly permitted within the MVP. Every proposal
MUST identify its current
learning need and smallest adequate solution; future usefulness alone is not justification.
Expanding this boundary requires an approved constitution amendment before implementation.
The simulation-only safety principle remains binding beyond the MVP.

## Review and Release Gates

Every feature specification, implementation plan, and pull request MUST identify applicable
principles and provide evidence for each applicable gate. A gate may be marked not applicable
only with a written reason tied to the actual change. Reviewers MUST block merging when a
required gate fails or lacks evidence.

1. **Scope and learning:** identify the traffic-spike learning outcome, learner action,
   visible evidence, and adjacent explanation. Record dependency/stack justifications where
   applicable. Reject speculative work under the out-of-scope rule.
2. **Model and contracts:** review assumptions, metric definitions, units, windows, request
   accounting, reproducibility, finite limits, and core/worker/presentation boundaries. Behavior or
   payload changes MUST update documentation and typed contracts.
3. **Automated verification:** a clean checkout MUST pass npm install, typecheck, Vitest
   unit/invariant/determinism tests, worker protocol contract tests, lint/static checks,
   production build, and the key Playwright end-to-end scenario in GitHub Actions before
   merge. The key scenario MUST cover Predict → Run → Explain through API scaling, DB
   bottleneck discovery, and cache or DB relief, plus pause/reset and stale-result protection.
   Failures MUST NOT be bypassed to meet a demo date.
4. **Usability and accessibility:** UI changes MUST demonstrate the affected learning flow
   and verify keyboard access, focus, text/value alternatives, narrow layouts, pause, and
   reduced motion. Screenshots alone do not prove interactive behavior.
5. **Performance and safety:** engine, rendering, or input changes MUST show that documented
   numeric budgets hold at supported limits and that beyond-limit inputs follow the declared
   policy. Check worker cancellation responsiveness, stale-result rejection, and bounded
   event/message history. Review MUST check for arbitrary targets, real outbound workload,
   runtime network calls, and accidental storage dependencies.
6. **Static deployment:** release evidence MUST verify the production build on the selected
   static host and smoke-test both root and repository-subpath base configurations. Check
   page entry/refresh, CSS/JS assets, worker startup, and the key learning flow without asset
   404s or runtime service calls. Record tested base URLs; a successful local build alone
   does not prove deployed asset routing.

A first-release candidate MUST additionally pass all gates across the complete product,
start from a fresh checkout using the documented command, and complete the reproducible
end-to-end demo. Release documentation MUST describe model assumptions, known limitations,
supported limits, and expected learning outcomes. Missing required evidence blocks release.

## Governance

This constitution governs specifications, plans, implementation, reviews, and releases.
Conflicting project guidance MUST be aligned before affected work is accepted. No review
waiver may silently override a non-negotiable principle.

Amendments MUST be proposed as a reviewed change with a reason, exact rule changes, impact
on existing work, and required migration or documentation updates. A project maintainer
MUST explicitly approve the amendment before conflicting implementation proceeds. Scope or
dependency convenience alone does not justify weakening a principle.

Versions use MAJOR.MINOR.PATCH: increase MAJOR for incompatible principle removals or
redefinitions, MINOR for new principles or materially expanded guidance, and PATCH for
clarifications that do not change obligations. Each amendment MUST update the version and
last-amended date, preserve the original ratification date, and record its impact. Reviews
MUST check the active version; release review MUST reassess the complete product against it.

**Version**: 2.0.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-05
