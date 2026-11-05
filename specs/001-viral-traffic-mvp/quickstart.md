# Quickstart and Validation Guide

**Phase**: Planned implementation contract. There is no application/package.json yet;
commands below become runnable when implementation supplies the planned scripts. This
planning phase did not install dependencies, run a model, deploy, or claim passing tests.

References: [specification](spec.md), [data model](data-model.md),
[worker protocol](contracts/worker-protocol.md), [UI/static contract](contracts/ui-contract.md).

## Prerequisites and startup

Use the implementation-pinned Node 24 LTS patch and its npm on macOS/Linux/Windows.
No Docker, .NET, account, secrets, API, or database. A current module-worker browser is required.
From the repository root after cloning:

```sh
npm install
npm run dev
```

The first command installs locked development dependencies; the second is the one-command
local start. Open the local URL printed by Vite. The simulator computes the 100 RPS baseline
to virtual t=5 s and pauses with actual results. No production backend process is involved.
A development server serves application assets locally; it is not deployed infrastructure.

## Required scripts and checks

Implementation must provide the following scripts/commands; failures block merge/release:

```sh
npm run typecheck
npm run lint
npm run test:unit
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:routing
```

- `typecheck`: TypeScript strict checks of app, core, worker, and test/config projects; browser
  and worker globals are separate so core imports cannot accidentally depend on either.
- `lint`: ESLint plus import/global restrictions keeping clocks, timers, random, storage,
  network, and React out of the core.
- `test:unit`: Vitest run, including engine D1–D3, invariants/replay, exact windows/percentiles,
  frozen input preservation, cache extremes, lesson evidence, and worker protocol tests.
- `build`: type-safe production static output in `dist`, including worker and compiled CSS.
- `test:e2e`: Playwright against production static files with a real bundled worker, not
  Vite dev output or mocked model. Cover full five-stage flow and both remedies, control
  races, keyboard/mobile/motion, and no runtime network calls. 4x is allowed for test pacing.
- `test:routing`: build/test `/` and `/SystemScope/` (configurable repo name) separately,
  mount each under its exact prefix on a static file server with real 404s/no SPA fallback,
  then check entry/refresh, JS/CSS/worker requests, and key lesson. It is not a deployment.

In GitHub Actions, use the pinned Node, `npm ci`, and Playwright's browser/dependency install
(`npx playwright install --with-deps chromium`), then the checks above. Add a separate clean
`npm install` smoke check without permitting lockfile drift, satisfying the constitution's
explicit install gate. No Docker image is required. Run desktop/narrow/reduced-motion
projects; release smoke checks additionally cover installed Firefox and WebKit.

## Under-five-minute reviewer lesson

1. Open the app at its base URL. Confirm “Educational simulation, not a benchmark,” baseline
   100 RPS, seed 42, one replica, normal DB, cache off, actual paused t=5 s results.
2. Run stage 1 to 25 s; see successful throughput approximately 100 RPS and no failures.
3. Predict stage 2's throughput, p95, and mean queue directions; Run the 100→1,000 RPS spike.
   Read the before/after windows and separate timeouts/rejections. Inspect API capacity/wait.
4. Predict and run stage 3 with four replicas. Inspect DB utilization and waiting as successful
   throughput improves. Predict/run stage 4 with eight replicas and observe its DB plateau.
5. Choose stage 5 cache (80% fixed hit assumption) or fast DB, predict, and run. Compare with
   stage 4; verify the explanation cites at least two matching values and what work remains.
6. Open Assumptions, confirm successful-only p95 and per-request estimated memory caveats.
   Reset with the same applied seed; compare replay at matching virtual times. Test the
   other stage 5 remedy independently using Replay Stage and the stage 4 reference.

Time the five-stage journey at 1x, including predictions/explanations: under 5 min. Automated
4x runs prove behavior, not the 1x human completion-time goal. Record timing and observations.

## Demonstration and boundary matrix

| Check | Inputs / action | Expected evidence |
| --- | --- | --- |
| D1 / SC-002 | Final (15,25] windows, baseline versus one-replica spike | 95–105 baseline RPS, zero failures; spike below 400 completed RPS with nonzero queue/failures and higher successful p95 |
| D2 / SC-003 | Same spike, one/four/eight replicas, normal DB | Four beats one by ≥10%; four/eight 350–420 RPS and within 5%; DB ≥90% with wait |
| D3 / SC-004 | Eight replicas: cache or fast DB separately versus stage 4 | Each ≥850 completed RPS and ≥50% fewer timeouts+rejections; matching windows |
| Determinism | Same version/config/seed at 1x/4x, pause/step, snapshot continuation | Identical core states/metrics at matching virtual times; transport IDs/time excluded |
| Empty sample | Before first successful completion or no successes in a window | p50/p95 N/A, sample count zero, failures separate |
| Bounded overload | Sandbox 10,000 RPS, eight replicas, 60 s | All model/history/message/visual caps hold; in-flight shown at endpoint, no hidden drain |
| Mode switch | Switch from a running guided stage with drafts to sandbox, then back | New identities; sandbox zero/60 s, guided 5 s/25 s; applied seed preserved, drafts noticed/discarded, old summaries archived and stale results rejected |
| Cancellation | Pause/reset/cancel during supported maximum load | ≤250 ms acknowledgment on reference environment; old results cannot replace new state |
| Cache extremes | Same core fixture, 0% and 100% hits | All/no DB visits, CPU/lookup overhead still present, realized ratio labeled |
| Accessibility | 360/1,280 px, keyboard, reduced motion, inspect charts | Usable actions/focus, text values, no color-only meaning or horizontal page scroll |
| Worker failure | Interrupt worker during a run | Explicit stopped/error state and restart; no fabricated summary or metric progress |

Numerical ranges are acceptance targets, not observed planning results. If D1–D3 fail,
inspect scheduler/accounting before changing UI. Record the failing fixture, investigate,
and resolve any real specification defect explicitly; never silently adjust expected output.

## Build bases and publish validation

Build root output and inspect it, then build repository-subpath output:

```sh
npm run build -- --base /
npm run build -- --base /SystemScope/
```

The planned build script must pass Vite flags through correctly after typecheck; `test:routing`
handles isolated output/mounts so the second build does not invalidate the first test.
Publishing uses only `dist` and the appropriate base. GitHub Pages is the initial target;
Cloudflare Pages root builds remain supported. Publishing requires the deployment workflow/
host configuration during implementation, not merely running Vite preview.

On the actual deployed static URL, repeat page entry/refresh, worker startup, essential lesson,
and network/console checks. Record the host, full base URL, commit, Node/package lock identity,
browser, outcome, and any missing asset request. Do not mark deployed routing passed using
only local preview results. No clean-path router, host rewrite, remote fonts/scripts, analytics,
external data calls, or server process may be required to finish the lesson.

## Performance evidence

Use a documented laptop with ≥4 logical cores and 8 GiB RAM. Record device/OS/browser,
input config, playback speed, wall response measurements, achieved virtual speed, progress
refresh frequency, and observed bounds. Verify pause/reset/cancel within 250 ms and ≥2
metric refreshes/s while running. Label any playback lag; events may not be skipped.
Passing logical bounds does not prove responsiveness, and modeled 41 MiB is not a measured
browser-memory ceiling. Stop/restart worker recovery is not a passing normal cancellation test.
