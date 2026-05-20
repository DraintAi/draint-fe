// drain't snap state — persisted alerts via snap_manageState.
//
// We keep a small ring of recent verdicts so the home page + test
// harness can show what drain't has caught lately.

import type { ClassifyResult } from "./api";

const MAX_ALERTS = 20;

export interface AlertEntry {
  id: string;
  at: string; // ISO timestamp
  kind: "permit" | "tx-7702" | "manual";
  origin: string | null;
  verdict: {
    target: string;
    chainId: number;
    riskScore: number;
    severity: ClassifyResult["severity"];
    matchedPattern: string | null;
  };
}

export interface DraintState {
  alerts: AlertEntry[];
}

const EMPTY_STATE: DraintState = { alerts: [] };

export async function getState(): Promise<DraintState> {
  const raw = await snap.request({
    method: "snap_manageState",
    params: { operation: "get" },
  });
  if (!raw) return EMPTY_STATE;
  return raw as unknown as DraintState;
}

export async function pushAlert(entry: Omit<AlertEntry, "id" | "at">) {
  const state = await getState();
  const next: AlertEntry = {
    ...entry,
    id: `${Date.now().toString(36)}_${secureRandomSuffix()}`,
    at: new Date().toISOString(),
  };
  const alerts = [next, ...state.alerts].slice(0, MAX_ALERTS);
  await snap.request({
    method: "snap_manageState",
    params: { operation: "update", newState: { alerts } },
  });
}

function secureRandomSuffix(): string {
  // Snap sandbox provides Web Crypto. Use it instead of Math.random.
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
