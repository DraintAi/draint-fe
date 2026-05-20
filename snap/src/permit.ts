// Permit / Permit2 signature parser.
//
// Both are EIP-712 typed-data signatures with a "spender" field. The Snap
// receives the parsed typed-data object via the onSignature event when
// signatureMethod = eth_signTypedData_v3/v4.

/**
 * Extract any spender / target addresses from a Permit-style typed-data sig.
 * Returns lowercase 0x-prefixed addresses; empty array if none found.
 */
export function extractPermitTargets(signature: {
  data?: unknown;
  signatureMethod: string;
}): `0x${string}`[] {
  const data = signature.data as Record<string, unknown> | undefined;
  if (!data) return [];

  const message = data.message as Record<string, unknown> | undefined;
  const primaryType = (data.primaryType as string) || "";
  if (!message) return [];

  const targets: `0x${string}`[] = [];

  // ERC-2612 Permit
  if (primaryType === "Permit" && typeof message.spender === "string") {
    if (isAddress(message.spender)) {
      targets.push(message.spender.toLowerCase() as `0x${string}`);
    }
  }

  // Permit2 (signleton). Several variants — primaryType can be:
  //   PermitSingle, PermitBatch, PermitTransferFrom
  // Spender field placement differs slightly; check common shapes.
  if (
    primaryType === "PermitSingle" ||
    primaryType === "PermitBatch" ||
    primaryType === "PermitTransferFrom"
  ) {
    if (typeof message.spender === "string" && isAddress(message.spender)) {
      targets.push(message.spender.toLowerCase() as `0x${string}`);
    }
    // Some Permit2 variants nest under "details" or "spender"
    const details = message.details as Record<string, unknown> | undefined;
    if (details && typeof details.spender === "string" && isAddress(details.spender)) {
      targets.push(details.spender.toLowerCase() as `0x${string}`);
    }
  }

  return [...new Set(targets)] as `0x${string}`[];
}

function isAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}
