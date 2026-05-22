// drain't backend client.
//
// The URL is injected at build time via snap.config.ts `environment` field.
// Default: http://localhost:3001 for local dev. Override with shell env
// `DRAINT_API_BASE` before running `bun run start` or `bun run build`.
declare const process: { env: { DRAINT_API_BASE?: string } };

const DRAINT_API_BASE =
  (typeof process !== "undefined" && process.env?.DRAINT_API_BASE) ||
  "http://localhost:3001";

export interface ClassifyResult {
  chainId: number;
  target: `0x${string}`;
  riskScore: number;
  severity: "safe" | "unknown" | "warning" | "critical";
  matchedPattern: string | null;
  reasons: string[];
  classifierVersion: string;
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
