# SystemScope

**Your App Just Went Viral** — an interactive backend/system-design learning experiment for
mobile and frontend engineers. Change inputs, compute a reproducible result, and compare
what changed. Optional charts and a guided Predict → Run → Explain lesson follow the evidence from API saturation to a database bottleneck and a cache/DB remedy.

## Run locally

Prerequisites: Node **24.22.2** (`nvm use` reads `.nvmrc`) and npm. No Docker, .NET, login,
backend, database, cloud account or runtime service is needed.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Explore opens with editable inputs and a genuinely
computed 60-virtual-second low-traffic baseline. Change offered traffic, API replicas, DB
speed, or cache, then click **Run experiment** once: it applies your inputs and computes a
complete result quickly in the browser worker. Compare Last run → Current run and read the
explanation beside the numbers. Pending edits never relabel old results as new ones.

The learning screen follows **Understand → Change → Observe**. Select Clients, API,
Cache, or Database to read what it does, what you can change, and how it can affect
results. Cache remains visible when off. Component details sit below the diagram;
inputs precede results on small screens. Technical resource readings, simulation seed,
and comparison evidence can be expanded when needed. The diagram and results always
show applied settings, even while new inputs are pending.

**Show charts** loads real retained simulation traces; closing charts removes their display
and stops chart-history delivery. Charts are not loaded on a fresh visit. **Watch simulation**
optionally plays the same model at 1x/4x with Pause and Step. Fast Run and Watch produce the
same results; neither generates real network traffic.

**Start guided lesson** explicitly opens the five-stage Predict → Run → Explain experience.
It starts with a paused baseline at 5 virtual seconds; run to 25 seconds, predict the spike,
then explore API scaling, the DB plateau, and either remedy. Charts stay independently
optional. The lesson takes about two minutes of 1x playback plus reading/interactions.
Returning to Explore creates a fresh paused run at zero with the applied resource settings
and current offered target; Run computes it, or Watch plays it. Mode switches discard drafts
with a notice and archive the outgoing summary; no queues carry over.

Reset preserves the current mode and applied seed: Explore computes a complete 60-second
baseline; the selected lesson resets to stage 1 at 5 seconds paused. Replay uses identical
applied inputs and the selected fast/playback style. Reload clears session history.
Playback speed and decorative motion are separate from model time.

## Checks

```sh
npm run typecheck
npm run lint
npm run test:unit
npm run build
npx playwright install chromium
npm run test:e2e
npm run test:routing
```

`test:e2e` runs Chromium against production `dist` static files; build first. Routing checks
build isolated `/` and `/SystemScope/` outputs, serve each without SPA fallbacks, and run the
Explore, optional charts, full lesson, and asset/refresh checks. Other browser smoke checks:

```sh
npx playwright install firefox webkit
npx playwright test --project=firefox --project=webkit tests/e2e/worker-startup.spec.ts tests/e2e/accessibility.spec.ts
```

CI runs clean installs, strict checks, core/protocol tests, production browser flows and both
base configurations. The separate manual **Publish static site** workflow verifies CI again,
then uploads only static files to GitHub Pages. It does not deploy a server.

## Static hosting

```sh
npm run build -- --base /                 # Cloudflare Pages / root URL
npm run build -- --base /SystemScope/     # GitHub repository Pages
```

Publish `dist`. Cloudflare Pages uses build command `npm run build`, output `dist`, no
Functions/adapter/analytics. GitHub Pages uses repository Settings → Pages → GitHub Actions,
then the manual publishing workflow after the code is pushed. Actual deployed routing must
be verified independently of local preview:

```sh
DEPLOYED_URL=https://daniv3r.github.io/SystemScope/ npm run test:e2e -- tests/e2e/static-routing.spec.ts tests/e2e/scaling-remedies.spec.ts
```

The URL above is the intended host, **not a claim that this checkout has been published**.

## Model and honesty

All numbers are educational modeled behavior, **not measured production performance**.
Version `viral-v1.1` uses fixed-rate arrivals and integer 100-microsecond event time. CPU,
workers, connections and DB service are distinct finite resources. A request has a 1-second
end-to-end deadline. Offered, admitted, successful throughput, queue, in-flight and failed
outcomes are separate. p50/p95 use only successful completions in the trailing 10 virtual
seconds and show N/A when no success exists. Charts expose text values and peak evidence.

Default limits: 1–8 API replicas, two CPU slots/32 simulated workers/16 ingress positions
and eight DB connections per replica, four global DB service slots. API CPU 5+1 ms; cache
adds 1 ms lookup and a fixed 80% hit schedule for cacheable reads. DB service 20/10/4 ms.
Seed defaults to 42 and is recorded; fixed schedules do not vary with seed in this version.

The user-approved correction from 200 to 16 ingress positions preserves the 1-second deadline
and intended scaling lesson. The original deep queues caused work to expire during DB
service, suppressing successful throughput. The correction and evidence are in
[validation.md](specs/001-viral-traffic-mvp/validation.md).

Runs stop at 25 virtual seconds guided / 60 in Explore, preserving unfinished in-flight work.
At most 384 admitted requests and **18 MiB estimated request-buffer occupancy** are modeled.
This is not actual JS process memory, heap or GC. Event heap ≤4,000; successful samples
≤100,384; 10-second statistics buckets ≤1,000; charts ≤600 samples/series; one prior summary,
five lesson references, one snapshot; no unbounded diagnostic log or UI object per request.

No real load, external endpoints, telemetry, network jitter, disk/DB locks, writes, retries,
autoscaling, hardware calibration or process-memory visualization. No localStorage dependency;
reload loses session history. Read the always-accessible Assumptions panel for the full ledger.

## Contribute

See [spec](specs/001-viral-traffic-mvp/spec.md), [plan](specs/001-viral-traffic-mvp/plan.md),
[tasks](specs/001-viral-traffic-mvp/tasks.md), and the project constitution. Engine code in
`src/simulation/` must stay pure and independent of React/browser/clock/storage/network.
Worker protocol validation and run identity protect against stale results; React formats
worker observations rather than calculating authoritative metrics. Keep dependencies few.

Before submitting a change, run relevant checks and update model assumptions/versions and
tests when behavior changes. Include evidence for accessibility, finite limits, deterministic
replay, and supported deployment bases. Do not add scenarios or an editor to this MVP.

MIT licensed; see [LICENSE](LICENSE).
