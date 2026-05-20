// drain't backend client.
//
// Calls draint-be /api/classify directly. No SDK needed for MVP.
// In prod the endpoint comes from snap.manifest.json env (TBD), for now hardcoded.

const DRAINT_API_BASE =
  // @ts-expect-error — Snap globals
  (typeof snap !== "undefined" && (snap as any).env?.DRAINT_API_BASE) ||
  "https://draint-be.vercel.app";

export interface ClassifyResult {
  chainId: number;
  target: `0x${string}`;
  riskScore: number;
  severity: "safe" | "unknown" | "warning" | "critical";
  matchedPattern: string | null;
  reasons: string[];
  classifierVersion: string;
  // optional Venice verdict + features omitted in Snap type (unused in UI)
}

export async function classifyAddress(
  chainId: number,
  target: string,
): Promise<ClassifyResult> {
  const res = await fetch(`${DRAINT_API_BASE}/api/classify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chainId, target }),
  });

  if (!res.ok) {
    throw new Error(`classify failed: HTTP ${res.status}`);
  }

  const json = (await res.json()) as ClassifyResult;
  return json;
}
