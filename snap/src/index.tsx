// drain't MetaMask Snap — pre-sign warning against EIP-7702 delegation
// drainers and Permit/Permit2 phishing.
//
// Two intercept points:
//   1. onSignature   — catches typed-data (Permit/Permit2) phishing
//   2. onTransaction — catches type 0x04 EIP-7702 txs that include
//                      authorizationList to malicious delegation targets

import type {
  OnSignatureHandler,
  OnTransactionHandler,
  SeverityLevel,
} from "@metamask/snaps-sdk";

import { classifyAddress, type ClassifyResult } from "./api";
import { extractPermitTargets } from "./permit";
import { extractAuthorizationTargets } from "./eip7702";
import { renderWarning, renderSafePanel } from "./ui";

// ─── onSignature ─────────────────────────────────────────────────────
// Permit / Permit2 phishing detection.

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

  return {
    severity: (verdict.severity === "critical"
      ? "critical"
      : "warning") as SeverityLevel,
    content: renderWarning(
      "Suspicious Permit signature",
      `You're granting spending permission to ${target}.`,
      verdict,
      signatureOrigin,
    ),
  };
};

// ─── onTransaction ───────────────────────────────────────────────────
// EIP-7702 SET_CODE detection.

export const onTransaction: OnTransactionHandler = async ({
  transaction,
  transactionOrigin,
  chainId,
}) => {
  const targets = extractAuthorizationTargets(
    transaction as unknown as Record<string, unknown>,
  );
  if (targets.length === 0) return null;

  const numericChainId = parseChainId(chainId);

  const verdicts = await Promise.all(
    targets.map((t) =>
      classifyAddress(numericChainId, t).catch(() => null),
    ),
  );

  const worst = verdicts
    .filter((v): v is ClassifyResult => v !== null)
    .sort((a, b) => b.riskScore - a.riskScore)[0];

  if (!worst || worst.severity === "safe") {
    return renderSafePanel(targets.length);
  }

  if (worst.severity === "unknown") {
    return null;
  }

  return {
    severity: (worst.severity === "critical"
      ? "critical"
      : "warning") as SeverityLevel,
    content: renderWarning(
      "EIP-7702 delegation drainer suspected",
      `This tx delegates your wallet's execution to ${worst.target}.`,
      worst,
      transactionOrigin,
    ),
  };
};

function parseChainId(chainId: string): number {
  if (chainId.startsWith("eip155:")) {
    return Number(chainId.slice(7));
  }
  if (chainId.startsWith("0x")) {
    return Number.parseInt(chainId, 16);
  }
  return Number(chainId) || 1;
}
