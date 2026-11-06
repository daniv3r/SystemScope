export const PRESETS = [100, 500, 1000, 5000, 10000] as const;
export interface Config {
  modelVersion: "viral-v1.1";
  seed: number;
  rps: number;
  replicas: number;
  db: "slow" | "normal" | "fast";
  cache: boolean;
  hit: number;
  spike: boolean;
  duration: number;
}
export function validateConfig(c: Config): void {
  if (
    !c ||
    typeof c !== "object" ||
    Array.isArray(c) ||
    Object.keys(c).some(
      (k) =>
        ![
          "modelVersion",
          "seed",
          "rps",
          "replicas",
          "db",
          "cache",
          "hit",
          "spike",
          "duration",
        ].includes(k),
    )
  )
    throw Error("INVALID_CONFIG: unknown fields");
  if (
    c.modelVersion !== "viral-v1.1" ||
    !Number.isInteger(c.seed) ||
    c.seed < 0 ||
    c.seed > 4294967295 ||
    !PRESETS.includes(c.rps as 100) ||
    !Number.isInteger(c.replicas) ||
    c.replicas < 1 ||
    c.replicas > 8 ||
    !["slow", "normal", "fast"].includes(c.db) ||
    typeof c.cache !== "boolean" ||
    typeof c.spike !== "boolean" ||
    ![0, 0.8, 1].includes(c.hit) ||
    ![250000, 600000].includes(c.duration)
  )
    throw Error("INVALID_CONFIG: unsupported model configuration");
}
export function config(p: Partial<Config> = {}): Config {
  const c: Config = {
    modelVersion: "viral-v1.1",
    seed: 42,
    rps: 100,
    replicas: 1,
    db: "normal",
    cache: false,
    hit: 0.8,
    spike: false,
    duration: 600000,
    ...p,
  };
  validateConfig(c);
  return c;
}
export function offered(c: Config, at: number) {
  return c.spike ? (at >= 50000 ? 1000 : 100) : c.rps;
}
export function dbTime(c: Config) {
  return { slow: 200, normal: 100, fast: 40 }[c.db];
}
