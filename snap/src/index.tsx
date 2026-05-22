// drain't MetaMask Snap entry point.
//
// Handlers:
//   onSignature   — Permit / Permit2 phishing detection
//   onTransaction — EIP-7702 type 0x04 SET_CODE detection
//   onRpcRequest  — manual classify method for test harness / SDK
//   onHomePage    — drain't status panel in MM Settings → Snaps

import type {
  OnHomePageHandler,
  OnRpcRequestHandler,
  OnSignatureHandler,
  OnTransactionHandler,
  SeverityLevel,
} from "@metamask/snaps-sdk";

import { classifyAddress, type ClassifyResult } from "./api";
import { extractAuthorizationTargets } from "./eip7702";
import { extractPermitTargets } from "./permit";
import { getState, pushAlert } from "./state";
import {
  renderClassifyResult,
  renderHome,
  renderSafePanel,
  renderWarning,
} from "./ui";

// ─── onSignature ─────────────────────────────────────────────────────

export const onSignature: OnSignatureHandler = async ({
  signature,
  signatureOrigin,
}) => {
  if (
    signature.signatureMethod !== "eth_signTypedData_v4" &&
    signature.signatureMethod !== "eth_signTypedData_v3"
  ) {
    return null;
  }

  const targets = extractPermitTargets(signature);
  if (targets.length === 0) return null;

  const target = targets[0];
  const data = signature.data as Record<string, unknown> | undefined;
  const domain = data?.domain as Record<string, unknown> | undefined;
  const chainId = domain?.chainId ? Number(domain.chainId) : 1;

  let verdict: ClassifyResult;
  try {
    verdict = await classifyAddress(chainId, target);
  } catch {
    return null;
  }

  if (verdict.severity === "safe" || verdict.severity === "unknown") {
    return null;
  }

  await pushAlert({
    kind: "permit",
    origin: signatureOrigin ?? null,
    verdict: {
      target: verdict.target,
      chainId: verdict.chainId,
      riskScore: verdict.riskScore,
      severity: verdict.severity,
      matchedPattern: verdict.matchedPattern,
    },
  }).catch(() => {});

  return {
    severity: (verdict.severity === "critical"
      ? "critical"
      : "warning") as SeverityLevel,
    content: renderWarning(
      "Suspicious Permit signature",
      `You're granting spending permission to ${target}.`,
      verdict,
      signatureOrigin ?? null,
    ),
  };
};

// ─── onTransaction ───────────────────────────────────────────────────

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  transactionOrigin,
  chainId,
}) => {
  const txObj = transaction as unknown as Record<string, unknown>;
  const numericChainId = parseChainId(chainId);

  // Two intercept paths:
  //  1. EIP-7702 SET_CODE — extract every delegation target from authList
  //  2. Plain tx — classify the call target (`tx.to`) for known drainers
  const authTargets = extractAuthorizationTargets(txObj);
  const txTo =
    typeof txObj.to === "string" && /^0x[a-fA-F0-9]{40}$/.test(txObj.to)
      ? (txObj.to.toLowerCase() as `0x${string}`)
      : null;

  const targets: `0x${string}`[] = Array.from(
    new Set([...authTargets, ...(txTo ? [txTo] : [])]),
  ) as `0x${string}`[];

  if (targets.length === 0) return null;

  const verdicts = await Promise.all(
    targets.map((t) =>
      classifyAddress(numericChainId, t).catch(() => null),
    ),
  );

  const valid = verdicts.filter((v): v is ClassifyResult => v !== null);
  const worst = [...valid].sort((a, b) => b.riskScore - a.riskScore)[0];

  if (!worst || worst.severity === "safe") {
    return renderSafePanel(targets.length);
  }

  if (worst.severity === "unknown") {
    return null;
  }

  await pushAlert({
    kind: "tx-7702",
    origin: transactionOrigin ?? null,
    verdict: {
      target: worst.target,
      chainId: worst.chainId,
      riskScore: worst.riskScore,
      severity: worst.severity,
      matchedPattern: worst.matchedPattern,
    },
  }).catch(() => {});

  // Determine messaging — was the worst target a 7702 delegation target
  // or simply the tx call target? Different copy for each.
  const isDelegationTarget = authTargets.includes(worst.target);
  const title = isDelegationTarget
    ? "EIP-7702 delegation drainer suspected"
    : "Drainer contract suspected";
  const context = isDelegationTarget
    ? `This tx delegates your wallet's execution to ${worst.target}.`
    : `This tx calls ${worst.target}, classified as a known drainer.`;

  return {
    severity: (worst.severity === "critical"
      ? "critical"
      : "warning") as SeverityLevel,
    content: renderWarning(title, context, worst, transactionOrigin ?? null),
  };
};

// ─── onRpcRequest ────────────────────────────────────────────────────
// Test harness / SDK entry — dApps invoke via wallet_invokeSnap.

export const onRpcRequest: OnRpcRequestHandler = async ({ request, origin }) => {
  switch (request.method) {
    case "classify": {
      const params = request.params as
        | { chainId?: number; target?: string }
        | undefined;
      if (!params?.target || !params?.chainId) {
        throw new Error(
          "classify requires { chainId: number, target: 0x... }",
        );
      }

      const verdict = await classifyAddress(params.chainId, params.target);

      await pushAlert({
        kind: "manual",
        origin: origin ?? null,
        verdict: {
          target: verdict.target,
          chainId: verdict.chainId,
          riskScore: verdict.riskScore,
          severity: verdict.severity,
          matchedPattern: verdict.matchedPattern,
        },
      }).catch(() => {});

      // Show classification dialog AND return the verdict
      await snap.request({
        method: "snap_dialog",
        params: {
          type: "alert",
          content: renderClassifyResult(verdict),
        },
      });

      return verdict;
    }

    case "getAlerts": {
      const state = await getState();
      return state.alerts;
    }

    case "clearAlerts": {
      await snap.request({
        method: "snap_manageState",
        params: { operation: "update", newState: { alerts: [] } },
      });
      return { ok: true };
    }

    default:
      throw new Error(`Method not supported: ${request.method}`);
  }
};

// ─── onHomePage ──────────────────────────────────────────────────────
// Status panel shown when user opens drain't in MM Settings → Snaps.

export const onHomePage: OnHomePageHandler = async () => {
  const state = await getState();
  return { content: renderHome(state.alerts) };
};

// ─── helpers ─────────────────────────────────────────────────────────

function parseChainId(chainId: string): number {
  if (chainId.startsWith("eip155:")) return Number(chainId.slice(7));
  if (chainId.startsWith("0x")) return Number.parseInt(chainId, 16);
  return Number(chainId) || 1;
}
