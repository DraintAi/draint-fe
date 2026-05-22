"use client";

import { useState } from "react";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";

const SEPOLIA_CHAIN_ID = 11155111;

// Sepolia addresses
const CRIME_ENJOYOR_MOCK =
  "0xae5d26e8bdfe3bfeed4c9a27c2394dbb2f70fd73" as `0x${string}`;
const DRAINT_ENFORCER =
  "0x2187D61279a8A54dc8907865959ef6cC8beBDa14" as `0x${string}`;
// Circle USDC on Sepolia — used as a stand-in token for the Permit demo.
const USDC_SEPOLIA =
  "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`;

type Result = {
  label: string;
  kind: "ok" | "blocked" | "error";
  message: string;
};

export default function HoneypotPage() {
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();
  const [busy, setBusy] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);

  const onSepolia = chainId === SEPOLIA_CHAIN_ID;

  function logResult(r: Result) {
    setResults((prev) => [r, ...prev].slice(0, 10));
  }

  // ─── Permit signing (EIP-2612 / typed data v4) ────────────────────

  async function signPermit(
    label: string,
    spender: `0x${string}`,
  ): Promise<void> {
    if (!walletClient || !address) return;
    setBusy(label);
    try {
      const sig = await walletClient.signTypedData({
        domain: {
          name: "USD Coin",
          version: "2",
          chainId: SEPOLIA_CHAIN_ID,
          verifyingContract: USDC_SEPOLIA,
        },
        types: {
          Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        },
        primaryType: "Permit",
        message: {
          owner: address,
          spender,
          value: BigInt(1_000_000), // 1 USDC
          nonce: BigInt(0),
          deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
        },
      });
      logResult({
        label,
        kind: "ok",
        message: `User signed. Signature: ${sig.slice(0, 18)}…`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const rejected =
        msg.toLowerCase().includes("user rejected") ||
        msg.toLowerCase().includes("user denied");
      logResult({
        label,
        kind: rejected ? "blocked" : "error",
        message: rejected
          ? "User rejected the signature (drain't warning likely surfaced)"
          : msg.slice(0, 240),
      });
    } finally {
      setBusy(null);
    }
  }

  // ─── Generic tx interception (no 7702 needed) ────────────────────
  //
  // drain't's onTransaction handler classifies `tx.to` regardless of tx
  // type. We send a value-0 self-cost tx that just calls the target —
  // any incoming SETH would be drained by CrimeEnjoyorMock's fallback,
  // but value=0 means nothing to drain. Just triggers the warning.

  async function sendTx(label: string, target: `0x${string}`): Promise<void> {
    if (!walletClient || !address) return;
    setBusy(label);
    try {
      const hash = await walletClient.sendTransaction({
        to: target,
        value: BigInt(0),
        data: "0x",
      });
      logResult({
        label,
        kind: "ok",
        message: `tx submitted: ${hash}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const rejected =
        msg.toLowerCase().includes("user rejected") ||
        msg.toLowerCase().includes("user denied");
      logResult({
        label,
        kind: rejected ? "blocked" : "error",
        message: rejected
          ? "User rejected the tx (drain't warning likely surfaced)"
          : msg.slice(0, 240),
      });
    } finally {
      setBusy(null);
    }
  }

  // ─── EIP-7702 authorization + type-0x04 tx ────────────────────────
  // EXPERIMENTAL — viem's signAuthorization requires a local privateKey
  // account; MM JSON-RPC doesn't support it as of 2026-05. Keep button as
  // documentation of the intended flow; will work once MM stabilizes
  // wallet_signAuthorization. Snap's onTransaction handler is already
  // wired to inspect authorizationList — see snap/src/eip7702.ts.

  async function send7702(
    label: string,
    target: `0x${string}`,
  ): Promise<void> {
    if (!walletClient || !address) return;
    setBusy(label);
    try {
      const auth = await walletClient.signAuthorization({
        contractAddress: target,
        executor: "self",
      });
      const hash = await walletClient.sendTransaction({
        authorizationList: [auth],
        to: address,
        data: "0x",
      });
      logResult({
        label,
        kind: "ok",
        message: `7702 tx submitted: ${hash}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const rejected =
        msg.toLowerCase().includes("user rejected") ||
        msg.toLowerCase().includes("user denied");
      const unsupported =
        msg.toLowerCase().includes("not supported") ||
        msg.toLowerCase().includes("unknown method") ||
        msg.toLowerCase().includes("method not") ||
        msg.toLowerCase().includes("does not");
      logResult({
        label,
        kind: rejected ? "blocked" : "error",
        message: rejected
          ? "User rejected the 7702 tx (drain't warning likely surfaced)"
          : unsupported
            ? `7702 signing not yet exposed by MM Flask. drain't Snap's onTransaction handler is ready (see /honeypot footer).`
            : msg.slice(0, 240),
      });
    } finally {
      setBusy(null);
    }
  }

  // ─── UI ───────────────────────────────────────────────────────────

  return (
    <main className="max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-16">
      <div className="inline-block bg-grunge-blood/80 text-grunge-paper -rotate-1 px-3 py-1 mb-6 border border-grunge-ink text-xs uppercase tracking-widest">
        Honeypot · test environment
      </div>
      <h1 className="text-4xl md:text-5xl leading-tight mb-3 -rotate-[0.3deg]">
        Real-fire range
      </h1>
      <p className="text-base md:text-lg max-w-2xl mb-8 leading-relaxed">
        Triggers <strong>actual</strong> Permit signature requests and
        EIP-7702 authorization txs. drain&rsquo;t&rsquo;s Snap should
        intercept the bad ones and insert a warning panel before MetaMask
        Flask asks you to confirm.
      </p>

      {!isConnected ? (
        <div className="p-4 bg-grunge-paper border border-grunge-ink/40 mb-8 font-serif">
          Connect your wallet first (header).
        </div>
      ) : !onSepolia ? (
        <div className="p-4 bg-grunge-mustard/40 border border-grunge-ink/40 mb-8 font-serif flex items-center justify-between flex-wrap gap-3">
          <div>
            Honeypot lives on <strong>Sepolia</strong> (chain 11155111). You
            are on chain {chainId}.
          </div>
          <button
            type="button"
            onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
            className="bg-grunge-ink text-grunge-paper font-display px-4 py-2 -rotate-1 hover:rotate-1 transition-transform"
          >
            Switch to Sepolia
          </button>
        </div>
      ) : null}

      {/* ─── Permit triggers ─────────────────────────────────────── */}
      <section className="mb-10">
        <div className="text-xs uppercase tracking-widest text-grunge-sepia mb-3">
          Test A · Permit signature (EIP-2612 typed data v4)
        </div>
        <p className="font-serif text-sm mb-4 max-w-2xl">
          MM&rsquo;s <code className="font-mono">onSignature</code> insight
          API fires for typed-data v4. drain&rsquo;t reads the Permit spender
          and runs it through the classifier.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <TriggerCard
            severity="ok"
            disabled={!onSepolia || busy !== null}
            busy={busy === "permit-safe"}
            label="Sign Permit · spender = USDC (safe)"
            help="Self-spending Permit. Expect drain't to stay silent or show 'safe'."
            onClick={() => signPermit("permit-safe", USDC_SEPOLIA)}
          />
          <TriggerCard
            severity="danger"
            disabled={!onSepolia || busy !== null}
            busy={busy === "permit-drainer"}
            label="Sign Permit · spender = CrimeEnjoyorMock 🚨"
            help={`Spender = ${shortAddr(CRIME_ENJOYOR_MOCK)}. Expect critical warning panel.`}
            onClick={() => signPermit("permit-drainer", CRIME_ENJOYOR_MOCK)}
          />
        </div>
      </section>

      {/* ─── Generic tx triggers (no 7702 needed) ────────────────── */}
      <section className="mb-10">
        <div className="text-xs uppercase tracking-widest text-grunge-sepia mb-3">
          Test B · Plain transaction to a target
        </div>
        <p className="font-serif text-sm mb-4 max-w-2xl">
          Sends a value-0 tx to a target contract. MM&rsquo;s{" "}
          <code className="font-mono">onTransaction</code> insight fires;
          drain&rsquo;t classifies <code className="font-mono">tx.to</code>{" "}
          and warns if it&rsquo;s a known drainer-shaped contract. Value=0
          so nothing actually drains even on the &ldquo;malicious&rdquo; run.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <TriggerCard
            severity="ok"
            disabled={!onSepolia || busy !== null}
            busy={busy === "tx-safe"}
            label="Call drain't enforcer (safe)"
            help={`tx.to = ${shortAddr(DRAINT_ENFORCER)} — our verified caveat enforcer. Expect 'drain't verified ✓'.`}
            onClick={() => sendTx("tx-safe", DRAINT_ENFORCER)}
          />
          <TriggerCard
            severity="danger"
            disabled={!onSepolia || busy !== null}
            busy={busy === "tx-drainer"}
            label="Call CrimeEnjoyorMock 🚨"
            help={`tx.to = ${shortAddr(CRIME_ENJOYOR_MOCK)}. Expect drain't critical: 'Drainer contract suspected'.`}
            onClick={() => sendTx("tx-drainer", CRIME_ENJOYOR_MOCK)}
          />
        </div>
      </section>

      {/* ─── Experimental 7702 ───────────────────────────────────── */}
      <section className="mb-10">
        <div className="text-xs uppercase tracking-widest text-grunge-sepia mb-3">
          Test B&apos; · EIP-7702 SET_CODE (experimental)
        </div>
        <div className="p-3 bg-grunge-mustard/30 border border-grunge-ink/40 mb-4 font-serif text-xs">
          ⚠ EIP-7702 authorization signing from a JSON-RPC wallet (MetaMask)
          isn&rsquo;t stable yet — viem requires a local privateKey account,
          and MM Flask hasn&rsquo;t exposed{" "}
          <code className="font-mono">wallet_signAuthorization</code>{" "}
          publicly. drain&rsquo;t&rsquo;s{" "}
          <code className="font-mono">onTransaction</code> handler already
          inspects <code className="font-mono">authorizationList</code>{" "}
          (see <code className="font-mono">snap/src/eip7702.ts</code>) — the
          buttons below will start working the moment MM ships the RPC.
        </div>
        <div className="grid sm:grid-cols-2 gap-3 opacity-70">
          <TriggerCard
            severity="ok"
            disabled={!onSepolia || busy !== null}
            busy={busy === "7702-safe"}
            label="Send 7702 tx · target = drain't enforcer"
            help={`Delegating to ${shortAddr(DRAINT_ENFORCER)}. Currently expected to error 'json-rpc not supported'.`}
            onClick={() => send7702("7702-safe", DRAINT_ENFORCER)}
          />
          <TriggerCard
            severity="danger"
            disabled={!onSepolia || busy !== null}
            busy={busy === "7702-drainer"}
            label="Send 7702 tx · target = CrimeEnjoyorMock"
            help={`Delegating to ${shortAddr(CRIME_ENJOYOR_MOCK)}. Will work once wallet API stabilizes.`}
            onClick={() => send7702("7702-drainer", CRIME_ENJOYOR_MOCK)}
          />
        </div>
      </section>

      {/* ─── Results log ─────────────────────────────────────────── */}
      <section>
        <div className="text-xs uppercase tracking-widest text-grunge-sepia mb-3">
          Last results
        </div>
        {results.length === 0 ? (
          <p className="font-serif text-sm text-grunge-sepia">
            No tests run yet. Trigger one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {results.map((r, i) => (
              <li
                key={i}
                className={`p-3 border ${
                  r.kind === "ok"
                    ? "border-grunge-olive bg-grunge-olive/10"
                    : r.kind === "blocked"
                      ? "border-grunge-blood bg-grunge-blood/10"
                      : "border-grunge-sepia bg-grunge-sepia/10"
                } font-serif text-sm`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-display text-xs px-2 py-0.5 ${
                      r.kind === "ok"
                        ? "bg-grunge-olive/40"
                        : r.kind === "blocked"
                          ? "bg-grunge-blood text-grunge-paper"
                          : "bg-grunge-sepia/40"
                    }`}
                  >
                    {r.kind.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs">{r.label}</span>
                </div>
                <div className="text-xs break-all">{r.message}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function shortAddr(addr: string): string {
  if (!addr.startsWith("0x") || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function TriggerCard({
  severity,
  label,
  help,
  onClick,
  disabled,
  busy,
}: {
  severity: "ok" | "danger";
  label: string;
  help: string;
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
}) {
  const dangerStyle =
    severity === "danger"
      ? "border-grunge-blood bg-grunge-paper"
      : "border-grunge-olive/60 bg-grunge-paper";
  const btnStyle =
    severity === "danger"
      ? "bg-grunge-blood text-grunge-paper"
      : "bg-grunge-ink text-grunge-paper";
  return (
    <div className={`p-4 border-2 ${dangerStyle} rotate-[-0.3deg]`}>
      <div className="font-display text-base mb-2 leading-tight">{label}</div>
      <p className="font-serif text-xs text-grunge-sepia mb-3 leading-snug">
        {help}
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`${btnStyle} font-display text-sm uppercase px-4 py-2 border-2 border-grunge-ink -rotate-1 hover:rotate-1 transition-transform disabled:opacity-50`}
      >
        {busy ? "…" : "trigger"}
      </button>
    </div>
  );
}
