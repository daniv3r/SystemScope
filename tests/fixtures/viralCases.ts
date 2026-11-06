import { config } from "../../src/simulation/config";
export const cases = {
  baseline: config({ duration: 250000 }),
  spike: config({ spike: true, duration: 250000 }),
  four: config({ replicas: 4, spike: true, duration: 250000 }),
  eight: config({ replicas: 8, spike: true, duration: 250000 }),
  cache: config({ replicas: 8, spike: true, cache: true, duration: 250000 }),
  fast: config({ replicas: 8, spike: true, db: "fast", duration: 250000 }),
  overload: config({ replicas: 8, rps: 10000, db: "slow" }),
};
