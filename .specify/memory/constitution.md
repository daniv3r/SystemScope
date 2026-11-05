<!--
Sync Impact Report — temporary review material; remove before committing this constitution.
Version: unversioned scaffold → 1.0.0 (initial adoption).
Modified principles: five generic placeholder slots replaced with ten project principles:
Education First; Technical Honesty; Deterministic Simulation; One Polished MVP;
Testable Behavior; Separation of Concerns; Developer Experience; Accessibility and
Responsiveness; Bounded Performance; Simulation Only.
Added sections: mission statement; Implementation and Scope Constraints;
Review and Release Gates; project-specific Governance.
Removed sections: none; template examples and placeholders replaced.
Dependent templates and commands: unchanged; they read the constitution at runtime.
Deferred placeholders and follow-up TODOs: none.
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
topology, and text MUST tell a consistent story. Visual polish MUST support understanding.

### II. Technical Honesty

The UI and model documentation MUST distinguish modeled assumptions, simulated observations,
and technical facts. Material assumptions and limitations MUST be visible where they affect
interpretation. Hypothetical results MUST be labeled as simulation results and MUST NOT be
presented as real benchmarks or predictions of a particular production system.

Metric contracts and visible labels MUST define units, populations, and time windows:

- Incoming RPS (requests per second) measures arrivals per virtual-time interval.
- Requests in flight count arrived requests without a terminal outcome, including queued
  and actively processed requests.
- Completed throughput measures successful completions per virtual-time interval. Failures,
  rejections, and other terminal outcomes MUST be counted separately.
- Concurrent users count simultaneously active users under an explicit user-behavior model;
  they MUST NOT be inferred from RPS alone.

These quantities MUST NOT be equated or substituted for one another. Latency MUST state
which requests it measures and whether it includes queue wait. CPU, memory, worker, and
database metrics MUST explain what is modeled and which real-world behavior is omitted.

### III. Deterministic Simulation

Identical scenario configuration, seed, and ordered simulation inputs MUST produce identical
results for the same documented engine/model version. A seed is the starting value used to
reproduce pseudo-random choices. The engine MUST use explicit ticks or steps and controlled
virtual time. Wall-clock timing, HTTP timing, and rendering speed MUST NOT affect outcomes.
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

The engine MUST have unit tests and invariant tests: checks of rules that remain true across
steps. These MUST cover request accounting, nonnegative quantities, declared capacity limits,
virtual-time progression, deterministic replay, traffic spikes, boundary inputs, and declared
overload outcomes. The API MUST have contract tests for typed payloads, validation, and
documented errors.

The UI MUST have essential interaction tests for configuration, prediction, run, pause,
step, reset/replay, and result inspection wherever provided. Behavior changes MUST update
relevant tests. Known limitations MUST be documented and surfaced in the UI when they affect
interpretation. Tests MUST verify observable behavior rather than only implementation details.

### VI. Separation of Concerns

The C# simulation library MUST be independent of HTTP/API and UI concerns, and its tests MUST
run without a server or browser. The API MUST validate inputs and expose engine results
through typed contracts. The frontend MUST NOT calculate authoritative backend metrics or
advance authoritative simulation state.

Frontend formatting, chart downsampling, and visual interpolation MAY transform presentation
only; they MUST preserve the meaning of engine results. These boundaries maintain one
reproducible source of truth.

### VII. Developer Experience

A fresh checkout MUST have a documented one-command local setup path using Docker Compose
or clearly documented dotnet/npm orchestration. Required versions and prerequisites MUST be
explicit. First-release execution MUST require no account, secret, or cloud service.

The repository MUST provide typed API contracts, lint/static-check, test, and build scripts,
and GitHub Actions CI that runs these checks. Documentation MUST explain startup, checks,
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

Simulation work per step, input ranges, queues, retained history, snapshots, and visual
effects MUST have explicit finite limits. Inputs beyond supported limits MUST be rejected
or handled by a documented bounded policy. Implementations MUST document numeric budgets
and a reproducible maximum-supported-load check before claiming performance compliance.
Queue overflow and history truncation MUST be visible when they affect interpretation.
Optimizations MUST preserve determinism. Unbounded work or memory growth is prohibited.

### X. Simulation Only

All workload and resource behavior MUST remain simulated. The product MUST NOT accept
arbitrary user-supplied target endpoints, generate load against third-party services, or
provide an externally reachable stress-test capability. Its own HTTP API MAY control the
simulation but MUST NOT forward simulated requests to real targets. This restriction also
applies to shipped demos, examples, utilities, and future extensions.

## Implementation and Scope Constraints

The preferred first-release stack is .NET 10 ASP.NET Core Web API, an independent deterministic
C# simulation library, and React with TypeScript and Vite. Use a lightweight chart package
and SVG/CSS topology. React Flow requires a documented need within the traffic-spike scenario
that SVG/CSS cannot reasonably meet. Departures from the preferred stack MUST document their
concrete benefit, cost, and effect on these principles before adoption.

Dependencies MUST be few and justified by a current requirement. The first release MUST NOT
require a database, login, broker, or cloud dependency. Simulated database behavior belongs
in the engine and does not justify introducing a real database.

**Explicit out-of-scope rule:** work that is not necessary to deliver, explain, verify, or
run the single traffic-spike scenario MUST be deferred from the first release. This includes
generic editors, additional scenarios, authentication, persistent storage, real brokers,
cloud integrations, and real load generation. Every proposal MUST identify its current
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
   accounting, reproducibility, finite limits, and engine/API/UI boundaries. Behavior or
   payload changes MUST update documentation and typed contracts.
3. **Automated verification:** required engine unit/invariant/replay tests, API contract
   tests, essential UI interaction tests, lint/static checks, and production builds MUST
   pass in GitHub Actions before merge. Failures MUST NOT be bypassed to meet a demo date.
4. **Usability and accessibility:** UI changes MUST demonstrate the affected learning flow
   and verify keyboard access, focus, text/value alternatives, narrow layouts, pause, and
   reduced motion. Screenshots alone do not prove interactive behavior.
5. **Performance and safety:** engine, rendering, or input changes MUST show that documented
   numeric budgets hold at supported limits and that beyond-limit inputs follow the declared
   policy. Review MUST check for real outbound workload generation and arbitrary targets.

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

**Version**: 1.0.0 | **Ratified**: 2026-11-05 | **Last Amended**: 2026-11-05
