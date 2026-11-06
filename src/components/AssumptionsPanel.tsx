import { useEffect, useRef } from "react";
const ledger = [
  [
    "A-01",
    "Arrivals",
    "Fixed evenly spaced traffic: 100 / 500 / 1,000 / 5,000 / 10,000 requests per virtual second. First arrival after one interval, none at t=0. Guided spike: 100 → 1,000 RPS at 5 s. No random bursts.",
  ],
  [
    "A-02",
    "Seed",
    "Default 42; integer 0–4,294,967,295. Recorded with every run. Fixed arrival, service and cache schedules mean changing seed alone does not change results in this version.",
  ],
  [
    "A-03",
    "API replicas",
    "1–8 identical resource groups. Least-outstanding routing with fixed replica-order ties; instantaneous routing, no network delay.",
  ],
  [
    "A-04",
    "API limits",
    "Per replica: 32 simulated workers, two CPU slots and 16 ingress positions. A worker remains occupied during DB wait; it is not a CPU core or browser Web Worker.",
  ],
  [
    "A-05",
    "API service",
    "5 ms CPU before DB plus 1 ms after DB or cache hit. These are assumptions, not calibrated hardware measurements.",
  ],
  [
    "A-06",
    "Database resources",
    "Eight connections per replica and four shared DB service slots. A connection is held through DB wait/service. Adding replicas never adds DB service slots.",
  ],
  [
    "A-07",
    "DB presets",
    "Slow 20 ms, normal 10 ms, fast 4 ms per visit. Ideal DB ceilings: 200 / 400 / 1,000 visits/s. Queues, deadlines and other resources can lower observed completions.",
  ],
  [
    "A-08",
    "Cache",
    "All modeled operations are cacheable reads. When enabled, a fixed 80% hit schedule bypasses DB; every lookup still costs 1 ms API CPU. No writes, invalidation, warming or eviction. Zero/perfect hit behavior is verified in engine tests.",
  ],
  [
    "A-09",
    "Deadlines",
    "1,000 ms from arrival, including every wait/service phase. Expiration immediately cancels simulated work and releases its slots. Real cancellation can differ. No retries.",
  ],
  [
    "A-10",
    "Estimated memory",
    "16 KiB per ingress request, replaced by 64 KiB while a worker holds it. Maximum 384 in flight and 18 MiB estimated buffers. This is not actual JS process memory, heap, or GC usage.",
  ],
  [
    "A-11",
    "Time",
    "Step = 10 virtual ms. Playback 1×/4× changes pacing only. Guided stages end at 25 virtual s; Explore at 60 s without draining unfinished work. Background throttling may slow playback, never skip events.",
  ],
  [
    "A-12",
    "Baseline and reset",
    "Explore initial/reset baseline is computed through 60 s; the selected guided lesson starts/resets at 5 s paused. Defaults and applied seed are preserved on reset. Fast Run and Watch use identical model events. Replay starts identical configuration at zero. Mode switches archive the old run and create a new identity; no queues carry over.",
  ],
  [
    "A-13",
    "Observations",
    "Latest 10 virtual seconds, or actual elapsed duration if younger. Guided comparison uses (15,25] s. p50/p95 use successful completions only; queue wait and all service count toward latency. No successful samples means N/A.",
  ],
  [
    "A-14",
    "Failures",
    "Timeouts and rejections reported separately. Other errors show zero as not modeled. No independent random errors, OS scheduling, network jitter, DB locks, disk I/O or GC simulation.",
  ],
  [
    "A-15",
    "Storage",
    "Session-only state. No localStorage, account or cloud dependency. Reload starts a new baseline; histories are not saved. No real load, endpoints, telemetry or runtime service calls.",
  ],
];
export default function AssumptionsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="assumptions-title">
      <div className="dialog-heading">
        <h2 id="assumptions-title">Assumptions & limitations</h2>
        <button onClick={onClose} aria-label="Close assumptions">
          ✕
        </button>
      </div>
      <p>
        <strong>
          Educational discrete-event simulation, not a production benchmark.
        </strong>{" "}
        Model viral-v1.1 explains cause and effect under explicit assumptions.
        No physical realism is claimed for omitted behavior.
      </p>
      <h3>How this demo uses your device</h3>
      <p>
        Calculations run in your browser and use your device’s CPU and memory.
        Explore’s Run computes 60 virtual seconds as quickly as your device
        allows, then stops advancing. Watch and the guided lesson play the
        simulation over time; Pause freezes virtual time. Higher traffic can
        require more calculation, and charts load only when selected.
      </p>
      <p>
        Finished or paused experiments retain their results, so the browser
        still uses some resources. Displayed CPU utilization and estimated
        request-buffer memory belong to the model; they do not measure your
        device’s actual CPU or RAM usage. No real traffic is sent to websites
        or databases.
      </p>
      <div className="assumptions-ledger">
        {ledger.map(([id, title, body]) => (
          <section key={id}>
            <h3>
              <span>{id}</span> {title}
            </h3>
            <p>{body}</p>
          </section>
        ))}
      </div>
      <h3>Plain-English glossary</h3>
      <dl className="glossary">
        <dt>Offered / admitted / completed RPS</dt>
        <dd>
          Arrivals, accepted arrivals, and successful completions per virtual
          second. These are different counts; none measures concurrent users.
        </dd>
        <dt>Queued / in flight</dt>
        <dd>
          Queued requests wait for a resource. In-flight requests include both
          waiting and active admitted work.
        </dd>
        <dt>p50 / p95 latency</dt>
        <dd>
          Half / 95% of successful samples finish within this end-to-end time.
          Failures are excluded: a low p95 can hide many timeouts.
        </dd>
        <dt>Rejection / timeout / error</dt>
        <dd>
          Rejected arrivals never enter the system. Timeouts entered but
          exceeded their deadline. Other failures are not modeled here.
        </dd>
        <dt>Bottleneck</dt>
        <dd>
          A capacity constraint supported by saturation and waiting evidence.
          Like a service counter, adding customers does not add servers.
        </dd>
        <dt>Observation window</dt>
        <dd>
          The virtual-time interval used for counts, rates and successful
          latency samples. Instantaneous utilization is a current fraction;
          window utilization averages occupied slot-time.
        </dd>
        <dt>MiB and memory occupancy</dt>
        <dd>
          One MiB = 1,048,576 bytes. Buffer weights estimate retained request
          work; they do not measure the browser process.
        </dd>
      </dl>
      <button onClick={onClose}>Return to experiment</button>
    </dialog>
  );
}
