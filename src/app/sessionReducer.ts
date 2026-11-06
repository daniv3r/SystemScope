import type { ComponentId } from "../components/componentGuide";
import type { Config } from "../simulation/config";
import type { Predictions, View } from "../worker/protocol";
export interface Session {
  view: View | null;
  error: string;
  predictions: Partial<Predictions>;
  draft: Config | null;
  selected: ComponentId | null;
  motion: boolean;
  assumptions: boolean;
  notice: string;
  replacing: boolean;
  chartsVisible: boolean;
}
export const initialSession: Session = {
  view: null,
  error: "",
  predictions: {},
  draft: null,
  selected: null,
  motion: false,
  assumptions: false,
  notice: "",
  replacing: false,
  chartsVisible: false,
};
export type Action =
  | { type: "view"; view: View }
  | { type: "error"; error: string; fatal?: boolean }
  | { type: "patch"; patch: Partial<Session> };
export function sessionReducer(s: Session, a: Action): Session {
  if (a.type === "view")
    return { ...s, view: a.view, error: "", replacing: false };
  if (a.type === "error")
    return {
      ...s,
      error: a.error,
      replacing: false,
      view: a.fatal && s.view ? { ...s.view, status: "failed" } : s.view,
    };
  return { ...s, ...a.patch };
}
