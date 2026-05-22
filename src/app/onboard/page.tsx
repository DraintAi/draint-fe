"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import {
  detectSnapInstalled,
  installSnap,
  postWatch,
  SNAP_ID_DEV,
  SNAP_ID_PROD,
  shortAddress,
} from "@/lib/draint";

const SUPPORTED_CHAINS = [
  { id: 11155111, name: "Ethereum Sepolia" },
  { id: 1, name: "Ethereum Mainnet" },
];

type StepState = "idle" | "active" | "done" | "skipped";

interface WalletState {
  hasCode: boolean;
  is7702Delegated: boolean;
  delegationTarget: `0x${string}` | null;
  codeSize: number;
}

export default function OnboardPage() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const [snapId, setSnapId] = useState(SNAP_ID_DEV);
  const [snapInstalled, setSnapInstalled] = useState<boolean | null>(null);
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [watchSubmitted, setWatchSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Detect Snap state when snapId or connection changes.
  useEffect(() => {
    if (!isConnected) {
      setSnapInstalled(null);
      return;
    }
    void detectSnapInstalled(snapId).then(setSnapInstalled);
  }, [snapId, isConnected]);

  // Probe wallet bytecode when connected
  useEffect(() => {
    if (!isConnected || !address || !publicClient) {
      setWalletState(null);
      return;
    }
    void (async () => {
      try {
        const code = await publicClient.getCode({ address });
        if (!code || code === "0x") {
          setWalletState({
            hasCode: false,
            is7702Delegated: false,
            delegationTarget: null,
            codeSize: 0,
          });
          return;
        }
        const is7702 =
          code.toLowerCase().startsWith("0xef0100") && code.length === 48;
        setWalletState({
          hasCode: true,
          is7702Delegated: is7702,
          delegationTarget: is7702
            ? (("0x" + code.slice(8)) as `0x${string}`)
            : null,
          codeSize: (code.length - 2) / 2,
        });
      } catch {
        setWalletState(null);
      }
    })();
  }, [isConnected, address, publicClient, chainId]);

  // Step machine
  const step1: StepState = isConnected ? "done" : "active";
  const step2: StepState = !isConnected
    ? "idle"
    : snapInstalled === null
      ? "active"
      : snapInstalled
        ? "done"
        : "active";
  const step3: StepState =
    !isConnected || snapInstalled !== true
      ? "idle"
      : watchSubmitted
        ? "done"
        : "active";

  async function handleInstallSnap() {
    setBusy(true);
    setError(null);
    try {
      await installSnap(snapId);
      const ok = await detectSnapInstalled(snapId);
      setSnapInstalled(ok);
      if (!ok) setError("Snap was rejected or install failed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleWatch() {
    if (!address || !chainId) return;
    if (!SUPPORTED_CHAINS.some((c) => c.id === chainId)) {
      setError(
        `Chain ${chainId} not supported yet. Switch to Sepolia or Mainnet.`,
      );
      return;
    }
    setBusy(true);
    setError(null);
    const res = await postWatch({
      address,
      chainId,
      autoRescue: false, // safe default; users opt in later
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Failed to add watch.");
      return;
    }
    setWatchSubmitted(true);
  }

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-20">
      <div className="inline-block bg-grunge-mustard/80 -rotate-1 px-3 py-1 mb-6 border border-grunge-ink/40 text-xs uppercase tracking-widest">
        Setup
      </div>
      <h1 className="text-4xl md:text-6xl leading-[1.05] mb-3 -rotate-[0.3deg]">
        Get protected
      </h1>
      <p className="text-base md:text-lg max-w-2xl mb-10 leading-relaxed text-grunge-sepia">
        Three steps. Two minutes. Wallet drain? Didn&rsquo;t happen.
      </p>

      {/* Snap source selector */}
      <div className="mb-8 flex items-center gap-3 text-sm font-serif">
        <label htmlFor="snap-src">Source:</label>
        <select
          id="snap-src"
          value={snapId}
          onChange={(e) => setSnapId(e.target.value)}
          className="bg-transparent border border-grunge-ink/40 px-2 py-1"
        >
          <option value={SNAP_ID_DEV}>local dev ({SNAP_ID_DEV})</option>
          <option value={SNAP_ID_PROD}>{SNAP_ID_PROD}</option>
        </select>
        <span className="text-xs text-grunge-sepia">
          (use local while testing in MetaMask Flask; npm after publish)
        </span>
      </div>

      <ol className="space-y-6">
        <Step
          n="01"
          state={step1}
          title="Connect your wallet"
          body={
            <div>
              {isConnected ? (
                <div className="font-serif text-sm">
                  Connected as{" "}
                  <code className="font-mono">
                    {address ? shortAddress(address) : "—"}
                  </code>
                  {chainId ? (
                    <>
                      {" "}
                      on{" "}
                      <span className="font-mono">
                        {SUPPORTED_CHAINS.find((c) => c.id === chainId)?.name ??
                          `chainId ${chainId}`}
                      </span>
                    </>
                  ) : null}
                  .
                  {walletState ? (
                    <div className="mt-3 font-mono text-xs text-grunge-sepia leading-relaxed">
                      • bytecode size: {walletState.codeSize} B
                      <br />
                      • 7702-delegated:{" "}
                      {walletState.is7702Delegated ? "yes" : "no"}
                      {walletState.delegationTarget ? (
                        <>
                          {" "}
                          →{" "}
                          <span className="font-mono">
                            {shortAddress(walletState.delegationTarget)}
                          </span>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="font-serif text-sm">
                  Use the <strong>Connect Wallet</strong> button in the header.
                  MetaMask Flask is required for the dev Snap.
                </p>
              )}
            </div>
          }
        />

        <Step
          n="02"
          state={step2}
          title="Install drain't Snap"
          body={
            <div className="space-y-3">
              <p className="font-serif text-sm">
                Adds pre-sign warnings to MetaMask for Permit phishing and
                EIP-7702 delegation drainer transactions.
              </p>
              {snapInstalled === true ? (
                <p className="font-serif text-sm text-grunge-olive">
                  ✓ Snap installed.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallSnap}
                  disabled={busy || !isConnected}
                  className="bg-grunge-blood text-grunge-paper font-display text-base uppercase px-5 py-2 border-2 border-grunge-ink -rotate-1 hover:rotate-1 transition-transform disabled:opacity-50"
                >
                  Install Snap
                </button>
              )}
            </div>
          }
        />

        <Step
          n="03"
          state={step3}
          title="Watch your wallet"
          body={
            <div className="space-y-3">
              <p className="font-serif text-sm">
                Tells drain&rsquo;t&rsquo;s reference agent to monitor your
                address for EIP-7702 delegation changes. Updates every minute
                via Vercel Cron.
              </p>
              {watchSubmitted ? (
                <p className="font-serif text-sm text-grunge-olive">
                  ✓ drain&rsquo;t is now watching this wallet.{" "}
                  <Link href="/dashboard" className="underline">
                    View dashboard →
                  </Link>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleWatch}
                  disabled={busy || step3 !== "active"}
                  className="bg-grunge-ink text-grunge-paper font-display px-5 py-2 -rotate-1 hover:rotate-1 transition-transform disabled:opacity-50"
                >
                  Enable monitoring
                </button>
              )}
            </div>
          }
        />
      </ol>

      {error ? (
        <div className="mt-8 p-3 bg-grunge-blood/10 border border-grunge-blood text-grunge-blood font-serif text-sm">
          {error}
        </div>
      ) : null}

      <div className="mt-12 text-xs text-grunge-sepia font-serif">
        Already set up?{" "}
        <Link href="/dashboard" className="underline">
          Go to dashboard
        </Link>
        .
      </div>
    </main>
  );
}

function Step({
  n,
  state,
  title,
  body,
}: {
  n: string;
  state: StepState;
  title: string;
  body: React.ReactNode;
}) {
  const ring =
    state === "done"
      ? "border-grunge-olive bg-grunge-olive/10"
      : state === "active"
        ? "border-grunge-blood bg-grunge-paper rotate-[-0.3deg]"
        : "border-grunge-ink/20 bg-grunge-paper/40 opacity-60";

  return (
    <li
      className={`border-l-4 ${ring} pl-5 md:pl-8 py-4 transition-all`}
    >
      <div className="flex items-baseline gap-3 md:gap-5">
        <div className="font-display text-3xl md:text-4xl text-grunge-sepia">
          {n}
        </div>
        <div className="flex-1">
          <h3 className="text-xl md:text-2xl mb-1">
            {title}
            {state === "done" ? (
              <span className="ml-2 font-serif text-sm text-grunge-olive">
                ✓ done
              </span>
            ) : null}
          </h3>
          <div className="text-grunge-ink">{body}</div>
        </div>
      </div>
    </li>
  );
}
