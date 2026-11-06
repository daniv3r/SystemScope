import { config } from "../simulation/config";
export const stages = [
  {
    name: "Baseline",
    title: "A quiet day on the internet",
    hint: "At low demand, your system can keep up. Watch arrivals and completions track each other.",
  },
  {
    name: "10× demand",
    title: "Your app just went viral",
    hint: "Ten times the arrivals. The same two CPU slots. Predict what happens before you run.",
  },
  {
    name: "Scale API",
    title: "Give your API some breathing room",
    hint: "Four replicas can share the API work. Will another resource become the limit?",
  },
  {
    name: "Find the limit",
    title: "More replicas. The same database.",
    hint: "Double the API again. Look at database utilization and the work waiting for it.",
  },
  {
    name: "Relieve DB",
    title: "Change the constraint, not just the traffic",
    hint: "Avoid some database visits with cache, or make each database visit faster. Compare the evidence.",
  },
];
export function stageConfig(
  stage: number,
  seed: number,
  remedy: "cache" | "fast" = "cache",
) {
  if (!Number.isInteger(stage) || stage < 1 || stage > 5)
    throw Error("Invalid stage");
  return config({
    seed,
    duration: 250000,
    spike: stage > 1,
    replicas: stage < 3 ? 1 : stage === 3 ? 4 : 8,
    cache: stage === 5 && remedy === "cache",
    db: stage === 5 && remedy === "fast" ? "fast" : "normal",
  });
}
