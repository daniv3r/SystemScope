export type Phase =
  | "ingress"
  | "preWait"
  | "pre"
  | "lookupWait"
  | "lookup"
  | "connectionWait"
  | "dbWait"
  | "db"
  | "postWait"
  | "post";
export interface Request {
  id: number;
  replica: number;
  arrival: number;
  deadline: number;
  phase: Phase;
  ready: number;
  connection: boolean;
}
export interface Replica {
  ingress: number[];
  cpuQueue: number[];
  connectionQueue: number[];
  workers: number;
  cpu: number;
  connections: number;
}
export function replicas(n: number): Replica[] {
  return Array.from({ length: n }, () => ({
    ingress: [],
    cpuQueue: [],
    connectionQueue: [],
    workers: 0,
    cpu: 0,
    connections: 0,
  }));
}
export const waiting = (p: Phase) =>
  [
    "ingress",
    "preWait",
    "lookupWait",
    "connectionWait",
    "dbWait",
    "postWait",
  ].includes(p);
export const cpuActive = (p: Phase) =>
  p === "pre" || p === "lookup" || p === "post";
