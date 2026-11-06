import type { Model } from "./model";
import { Scheduler } from "./scheduler";
/** Cloneable DTO: no browser functions, classes, or hidden clock state. */
export interface Snapshot {
  version: "viral-v1.1";
  data: string;
}
export function snapshot(s: Model): Snapshot {
  return {
    version: "viral-v1.1",
    data: JSON.stringify({
      ...s,
      requests: [...s.requests],
      events: s.events.items,
    }),
  };
}
export function restore(value: Snapshot): Model {
  if (value.version !== "viral-v1.1")
    throw Error("Unsupported snapshot version");
  const dto = JSON.parse(value.data) as Omit<Model, "requests" | "events"> & {
    requests: [
      number,
      Model["requests"] extends Map<number, infer R> ? R : never,
    ][];
    events: Scheduler["items"];
  };
  const events = new Scheduler();
  for (const event of dto.events) events.add(event);
  return { ...dto, requests: new Map(dto.requests), events };
}
