// EIP-7702 transaction parser.
//
// Type 0x04 (SET_CODE) txs carry an `authorizationList` with tuples of
// (chainId, address, nonce, y_parity, r, s). drain't extracts every
// `address` (the delegation target) and classifies them.
//
// Best-effort — MetaMask's onTransaction object shape for type 4 is still
// evolving in the Snap API. We try several common shapes.

/**
 * Extract delegation target addresses from an EIP-7702 transaction object.
 * Returns lowercase 0x-prefixed addresses; empty array if not a 7702 tx.
 */
export function extractAuthorizationTargets(
  tx: Record<string, unknown>,
): `0x${string}`[] {
  // Detect by type (string "0x04" or number 4)
  const type = tx.type;
  const isType4 =
    type === "0x04" || type === "0x4" || type === 4 || type === "4";

  // Some clients name it differently; check for authorizationList presence
  const rawList =
    (tx.authorizationList as unknown[] | undefined) ??
    (tx.authorization_list as unknown[] | undefined) ??
    (tx.authorizations as unknown[] | undefined);

  if (!isType4 && !rawList) return [];
  if (!Array.isArray(rawList)) return [];

  const targets: `0x${string}`[] = [];
  for (const auth of rawList) {
    if (!auth || typeof auth !== "object") continue;
    const a = auth as Record<string, unknown>;
    // Common field names: address, contractAddress, delegateAddress
    const candidate =
      (a.address as string | undefined) ??
      (a.contractAddress as string | undefined) ??
      (a.delegateAddress as string | undefined);
    if (typeof candidate === "string" && /^0x[a-fA-F0-9]{40}$/.test(candidate)) {
      targets.push(candidate.toLowerCase() as `0x${string}`);
    }
  }

  return [...new Set(targets)] as `0x${string}`[];
}
