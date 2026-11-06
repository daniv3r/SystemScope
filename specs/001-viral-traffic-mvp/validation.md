# Implementation evidence

Model correction explicitly approved by the user on 2026-11-05: ingress capacity is 16
requests per API replica, replacing 200. Version `viral-v1.1`; deadline remains 1,000 ms.
The original 200-position fixtures gave only ~39/46 completed RPS for four/eight replicas
because work expired during DB service. The bounded smaller queues preserve the lesson's
existing acceptance targets. New bounds: 384 in-flight and 18 MiB estimated request buffers.

## Engine and foundation

- Node on this workstation: 26.8.2; development/CI pin: verified available Node 24.22.2.
- Vitest: configuration, indexed scheduler, successful-only histogram/window observations,
  cache extremes, 60-second maximum-load conservation/bounds, immutable transitions,
  snapshot continuation, D1–D3, and foundational protocol/client tests pass locally.
- D1–D3 targets unchanged: baseline ~100, spike 333.2, four/eight replicas 400/400 RPS;
  both cache and faster DB remedies meet ≥850 RPS and ≥50% fewer failures.
- `npm run typecheck`, `npm run lint`, and production build passed at worker bootstrap.
- Browser/interactive/routing/performance evidence is added as each implementation gate runs.
- Remote GitHub Actions and actual static-host deployment are not yet verified.

## Real worker startup

The production-build Chromium startup test passed: emitted worker fetched from own static
assets, actual baseline at 5.00 virtual seconds, no page errors, ~99.6 completed RPS.
First spike interaction run exposed an accessible-name mismatch on Next Stage; fixed with
an explicit accessible name and rerun before marking the story complete.

## Story browser gates

Chromium production-build tests passed: baseline → predict → spike (12.7 s automated at
4x), all five stages and both stage-5 remedies against the stage-4 reference (38.6 s), and
sandbox edits/pause/step/reset/inspect (1.2 s). Typecheck, lint, engine and protocol suites
pass with the user-approved model. Charts are separately bundled (~371 kB uncompressed);
main app bundle ~252 kB, no runtime CDN. Screenshots are kept outside the repository.

## Final local QA (2026-11-05)

- Strict typecheck, ESLint, production build, and all 24 Vitest core/protocol tests pass.
  Core/protocol tests and build also passed under the pinned Node 24.22.2 toolchain.
- Clean isolated project: npm ci, npm install, and production build pass using Node 24.22.2.
  Run npm in the project directory: npm's --prefix invocation produced a misleading local
  name-resolution error; changing working directory resolved it without lockfile edits.
- Chromium: all 10 original browser cases pass (including full lesson/both remedies, real
  worker, sandbox, keyboard/mobile/motion, assumptions, static routing, overload and recovery).
  Added running-worker fault injection plus controls/accessibility regression: 5/5 pass.
  Fatal workers are terminated; their queued results cannot revive progress/animation.
- Firefox 157 and WebKit 27.2: 12/12 release smoke cases pass, including 360/1,280 px,
  focus return, blocked localStorage, sandbox controls, worker failure/restart and startup.
- Normal 1x guided flow including the additional remedy completed in about 2.5 minutes
  (six experiments), below five minutes for the required five-stage lesson. Automated
  user-action timing is evidence of achievable flow, not a user-study satisfaction metric.
- Reference hardware: Apple M1 Pro, 10 logical cores, 16 GiB RAM, macOS Darwin 25.6.0.
  Chromium 156 maximum-load test: 10,000 offered RPS, eight replicas, fast DB, cache enabled,
  4x playback; exact 60-second endpoint. Pause 9.3 ms, reset including cancellation plus
  freshly computed baseline 24.4 ms; 10.3 visible updates/s (includes control views).
  Progress messages themselves are capped at ten/s. No forced termination was needed.
- Earlier root and /SystemScope/ production matrices both passed the full lesson, both
  remedies, refresh/worker/lazy-chart assets, and own-static-assets-only network assertions.
  The final post-recovery matrix also passed both configurations (four checks total),
  with 31.6 s five-stage playback at 4x and successful alternative-remedy reruns.
- Production dependency audit: zero known vulnerabilities. Build/test dependency advisories
  are tracked below; no force downgrade was applied silently.

## Remaining release gates

- GitHub Pages API for daniv3r/SystemScope returned HTTP 404: no existing Pages site could
  be verified. No code was pushed and no site was published in this implementation phase.
- Prepared a manual Publish static site workflow that calls the required CI workflow before
  publishing dist. Remote Actions and actual-host checks require pushing/configuring Pages.
- T070 (actual deployed-host smoke) and T071 (all release evidence confirmed) remain unchecked.
  Local implementation is ready for review; full release is not declared complete.

### Dependency metadata and limitations

The clean npm install normalized six optional Tailwind/WASM packages as development-only.
That normalized lockfile was copied back without changing any dependency versions; the
clean-install lockfile drift check is repeated against this corrected baseline.

Full npm audit reports 10 moderate findings propagated from the lint toolchain's minimatch
10.2.6 (GHSA-g3hv-75wg-m249, glob amplification); production-only audit is zero. Suggested
automatic remediation includes major toolchain downgrades, which were not applied blindly.
This is a documented development-tool limitation; production serves static files only.
Advisory: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).

### Final verification details

- Source-level queue-peak bug fixed: an immediately dispatched staging entry is not counted
  as real waiting. Baseline queue mean and peak are zero; a targeted regression test passes.
- Identical resource slots use bounded occupancy counts rather than unused per-slot IDs;
  request identities still determine ordering. This changes representation, not model rules.
- Final root/subpath matrix passed after all worker-recovery changes; the harness removed
  its temporary build outputs afterward. No application source or runtime topology changes
  were introduced for either host configuration.
- Live local preview: http://127.0.0.1:5173/ . Desktop 1440×1080 and mobile 360×900 captures
  show meaningful UI; real Step advanced 5.00→5.01 s; page title/URL correct, no framework
  overlay, no browser console/page errors, and no mobile horizontal overflow. Browser plugin
  unavailable; regular Playwright used. Screenshots remain outside the repository in /tmp.
- Maximum-load playback delivered over 65 virtual seconds within an 18.2-second test including
  setup/pause/reset (overall progress ≥3.57× including overhead; playback requested 4×).
- Clean npm install lockfile dev-flag normalization is verified separately from package
  version resolution; no versions or numerical acceptance thresholds were changed.

### Closing results

The complete final Chromium suite passes all 11 cases in ~1.2 minutes. Latest maximum-load
measurements: pause 9.2 ms; reset/cancellation plus baseline computation 22.9 ms; ~10 visible
updates/s. Separate final root/subpath matrices pass four cases total with genuine 404s
for missing files and no runtime service traffic. All 24 Vitest tests pass under Node 24.22.2.
Final preview console check includes warnings and errors: none relevant or unexplained.

The normalized lockfile remains unchanged on repeated clean-project npm install; all
package versions match. Local source changes are reviewable in the workspace and the live
preview; publication and hosted-release evidence remain explicitly pending.

Final Firefox/WebKit worker-fault regressions: 4/4 pass, including running faults, stopped
animation/time, and restart without stale results. Final screenshot viewports are desktop
1440×1000 and mobile 360×900; earlier interaction check also used desktop 1440×1080.


## Explore-first amendment — 2026-11-06

The earlier sections record the original guided-first implementation. The amended UI now
starts in Explore with editable inputs and a genuine completed 60-second baseline. Run
atomically applies drafts and computes a full result; Watch optionally paces the same core.
Charts and the guided lesson are independent lazy-loaded presentation chunks. No changes
to viral-v1.1 resource parameters, arrival schedules, or event semantics were needed.

Protocol v2 adds execution style and chart subscription. Unselected charts have no mounted
UI/chunk load and no serialized history; bounded real samples remain available on selection.
Core snapshots match fast versus 4x/pause/Step execution at 10,000 RPS/eight replicas and
both zero/perfect cache hits. Tests also cover default initialization, atomic rejection of
invalid replacements, stale replies, cancelled partial summaries, coalesced chart intents,
and a late initialization FINISHED not clearing a newer command's pending state.

Reference workstation: MacBookPro18,1, 10 logical CPUs, 16 GiB RAM; Node 26.8.2. CI/development
pin remains Node 24.22.2. Real production-build Chromium measured from worker acceptance:

| Measurement | Observed |
| --- | --- |
| 60-second baseline fast computation | 317.9 ms |
| 1,000-RPS / one-replica fast computation | 421.1 ms |
| 10,000-RPS / eight-replica / normal-DB / cache-off full computation | 10,153.0 ms |
| Cancel during maximum-load fast computation | 14.2 ms |
| Watch playback updates | 20 progress views across the measured interval; test requires ≥2/s |

The first two pass the 5-second SC-011 budget. Maximum-load completion time is documented,
not claimed instantaneous; its UI remains responsive and cancellation passes 250 ms. All
numbers are execution timings of this browser simulator, not backend performance benchmarks.

Clean npm install in an empty temporary directory passed offline (227 packages), leaving
package-lock.json byte-identical. npm reported its default optional fsevents install-script
notice; no dependency/lockfile changes were required. Strict typecheck, lint, and production
build passed. Production output separates LessonPanel (~1.82 kB) and Charts/Recharts
(~371.55 kB) from the main entry; tests assert neither is requested before selection.

Direct Explore scaling observed the expected one/four/eight-replica improvement/DB plateau
and both ≥850-RPS remedies without predictions or lesson completion. Comparison metadata
now includes traffic inputs, model version, sample counts, complete/partial state, and exact
windows; additional metrics are accessible without cluttering the three headline comparisons.

Final browser/unit/routing/normal-speed checks are recorded below. GitHub
Pages status was rechecked using the read-only Pages API on 2026-11-06: HTTP 404. No published
site is currently available through that repository endpoint. T070/T071 remain pending;
local static tests do not replace hosted routing or remote-CI evidence. No push/deployment
or Git index changes were performed.


### Final amendment gates

- All 29 Vitest tests passed across 12 files, including unchanged D1–D3 model fixtures,
  bounded maximum-load invariants, fast/Watch snapshot equality at cache extremes, chart
  subscription, stale filtering, and invalid/duplicate protocol command handling. A final
  targeted regression also verifies conflicting command-ID reuse cannot poison the cached
  reply, and a repeated rejected command replays its own error rather than an older success.
- All 14 production Chromium E2E cases passed. Later focused reruns cover final focus and
  worker/protocol changes without rerunning unrelated numerical fixtures.
- Firefox/WebKit startup, Explore optional views, worker crash/recovery, narrow/desktop
  keyboard and reduced-motion smoke cases were verified. The initial WebKit chart-close
  focus assertion failed: mouse clicks do not automatically focus the trigger there.
  Explicit trigger focus fixed it; all six accessibility cases across Chromium/Firefox/
  WebKit then passed. Hidden chart controls leave no focusable UI.
- The root and /SystemScope/ production build matrix passed four cases each: default
  Explore/optional views, complete guided lesson with both remedies, direct input scaling,
  and static asset/refresh/network checks. Actual emitted workers and optional chunks loaded
  under each prefix, with no service calls, missing assets, or console/page errors.
- At normal 1x playback, the five-stage automated walkthrough took 122.931 seconds; the
  additional alternative remedy completed within the same ~2.5-minute test. This measures
  execution/interactions, not a human reading-speed study. Both remedies retained stage 4
  as their authoritative DB-limited reference.
- Final typecheck (via production build), lint, clean install/unchanged lock, production
  build, and diff whitespace checks passed. No dependency or pure-core model changes.
- Desktop and 360 px screenshots inspected. Fixed the new comparison/chart wrapper order
  on narrow screens. Controls, text evidence, Assumptions, and optional selectors remain
  available without horizontal page scrolling.

Two early parallel browser commands shared the default artifact directory and deleted each
other's trace files during teardown. Their reruns used isolated output directories and
passed; routing now isolates each base's artifacts too. This was test-runner interference,
not simulated behavior. A separate initial text comparison used innerText against textContent;
its assertion was corrected and the fast/Watch/replay comparison passed unchanged metrics.

Local status: 86/88 tasks complete. All 17 Explore-first amendment tasks are done. T070 and
T071 remain unchecked for actual-host/remote-CI release evidence; no deployment, push,
staging, or commit was performed. The static-only safety boundary is unchanged.
