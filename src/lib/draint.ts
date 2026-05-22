// Shared drain't client config + helpers for the dashboard.

export const DRAINT_API_BASE =
  process.env.NEXT_PUBLIC_DRAINT_API_URL ?? "http://localhost:3001";

export const SNAP_ID_DEV = "local:http://localhost:8080";
export const SNAP_ID_PROD = "npm:@draint/snap";

export type Severity = "safe" | "unknown" | "warning" | "critical";

export interface ClassifyResult {
  chainId: number;
  target: `0x${string}`;
  riskScore: number;
  severity: Severity;
  matchedPattern: string | null;
  reasons: string[];
}

export interface AgentIncident {
  id: string;
  at: string;
  kind: "delegation_changed" | "delegation_malicious" | "delegation_critical";
  address: `0x${string}`;
  chainId: number;
  delegationTarget: `0x${string}` | null;
  severity: Severity;
  riskScore: number;
  matchedPattern: string | null;
  reasoning: string[];
}

export interface WatchedAddress {
  address: `0x${string}`;
  chainId: number;
  lastBytecodeHash: string | null;
  lastDelegationTarget: `0x${string}` | null;
  lastCheckedAt: string;
  recoveryAddress: `0x${string}` | null;
  autoRescue: boolean;
}

// ─── Backend client ────────────────────────────────────────────────

export async function fetchIncidents(limit = 20): Promise<AgentIncident[]> {
  try {
    const res = await fetch(
      `${DRAINT_API_BASE}/api/agent/incidents?limit=${limit}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { incidents: AgentIncident[] };
    return json.incidents;
  } catch {
    return [];
  }
}

export async function fetchWatched(): Promise<WatchedAddress[]> {
  try {
    const res = await fetch(`${DRAINT_API_BASE}/api/agent/watch`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { watched: WatchedAddress[] };
    return json.watched;
  } catch {
    return [];
  }
}

export async function postWatch(opts: {
  address: string;
  chainId: number;
  autoRescue?: boolean;
  recoveryAddress?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${DRAINT_API_BASE}/api/agent/watch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(opts),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `HTTP ${res.status}: ${txt}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ─── Snap helpers ──────────────────────────────────────────────────

type EthereumProvider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
};

function getEthereum(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum ?? null;
}

export async function detectSnapInstalled(snapId: string): Promise<boolean> {
  const eth = getEthereum();
  if (!eth) return false;
  try {
    const res = (await eth.request({ method: "wallet_getSnaps" })) as Record<
      string,
      unknown
    > | null;
    return res !== null && snapId in res;
  } catch {
    return false;
  }
}

export async function installSnap(snapId: string): Promise<void> {
  const eth = getEthereum();
  if (!eth) throw new Error("MetaMask not detected. Install MetaMask Flask.");
  await eth.request({
    method: "wallet_requestSnaps",
    params: { [snapId]: {} },
  });
}

export async function invokeSnap<T = unknown>(
  snapId: string,
  method: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const eth = getEthereum();
  if (!eth) throw new Error("MetaMask not detected");
  return (await eth.request({
    method: "wallet_invokeSnap",
    params: { snapId, request: { method, params } },
  })) as T;
}

// ─── Formatting ────────────────────────────────────────────────────

export function shortAddress(addr: string): string {
  if (!addr.startsWith("0x") || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function severityClass(severity: Severity): string {
  switch (severity) {
    case "critical":
      return "bg-grunge-blood text-grunge-paper";
    case "warning":
      return "bg-grunge-mustard text-grunge-ink";
    case "unknown":
      return "bg-grunge-sepia/40 text-grunge-ink";
    case "safe":
    default:
      return "bg-grunge-olive/40 text-grunge-ink";
  }
}
