"use client";

import { useEffect, useState } from "react";

const DEV_SNAP_ID = "local:http://localhost:8080";
const PROD_SNAP_ID = "npm:@draint/snap";

type Severity = "safe" | "unknown" | "warning" | "critical";

interface Verdict {
  chainId: number;
  target: `0x${string}`;
  riskScore: number;
  severity: Severity;
  matchedPattern: string | null;
  reasons: string[];
  classifierVersion: string;
}

interface AlertEntry {
  id: string;
  at: string;
  kind: "permit" | "tx-7702" | "manual";
  origin: string | null;
  verdict: {
    target: string;
    chainId: number;
    riskScore: number;
    severity: Severity;
    matchedPattern: string | null;
  };
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string;
        params?: Record<string, unknown>;
      }) => Promise<unknown>;
    };
  }
}

export default function SnapTestPage() {
  const [snapId, setSnapId] = useState(DEV_SNAP_ID);
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [chainId, setChainId] = useState(1);
  const [target, setTarget] = useState(
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  );
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);

  useEffect(() => {
    void detectInstalled(snapId).then(setInstalled);
  }, [snapId]);

  async function detectInstalled(id: string): Promise<boolean> {
    if (typeof window === "undefined" || !window.ethereum) return false;
    try {
      const result = (await window.ethereum.request({
        method: "wallet_getSnaps",
      })) as Record<string, unknown>;
      return Object.keys(result ?? {}).includes(id);
    } catch {
      return false;
    }
  }

  async function installSnap() {
    setError(null);
    setBusy(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask not detected");
      await window.ethereum.request({
        method: "wallet_requestSnaps",
        params: { [snapId]: {} },
      });
      setInstalled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function invokeSnap<T = unknown>(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<T> {
    if (!window.ethereum) throw new Error("MetaMask not detected");
    return (await window.ethereum.request({
      method: "wallet_invokeSnap",
      params: { snapId, request: { method, params } },
    })) as T;
  }

  async function classify() {
    setError(null);
    setVerdict(null);
    setBusy(true);
    try {
      if (!/^0x[a-fA-F0-9]{40}$/.test(target)) {
        throw new Error("Target must be a 0x-prefixed 40-char address");
      }
      const v = await invokeSnap<Verdict>("classify", { chainId, target });
      setVerdict(v);
      await refreshAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function refreshAlerts() {
    try {
      const list = await invokeSnap<AlertEntry[]>("getAlerts");
      setAlerts(Array.isArray(list) ? list : []);
    } catch {
      setAlerts([]);
    }
  }

  async function clearAlerts() {
    setBusy(true);
    try {
      await invokeSnap("clearAlerts");
      setAlerts([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-20">
      <div className="inline-block bg-grunge-mustard/80 -rotate-1 px-3 py-1 mb-6 border border-grunge-ink/40 text-xs uppercase tracking-widest">
        Dev harness · Snap testing
      </div>
      <h1 className="text-5xl md:text-6xl leading-[1.05] mb-3 -rotate-[0.5deg]">
        drain&rsquo;t snap
      </h1>
      <p className="text-lg max-w-2xl mb-8 leading-relaxed">
        Manual test bench for the drain&rsquo;t MetaMask Snap. Install,
        invoke the <code className="font-serif">classify</code> RPC method,
        and watch alerts pile up.
      </p>

      {/* Step 1: install */}
      <section className="mb-10 p-6 bg-grunge-paper border border-grunge-ink/30 rotate-[-0.5deg]">
        <div className="text-xs uppercase tracking-widest text-grunge-sepia mb-3">
          Step 1 · Install Snap
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={snapId}
            onChange={(e) => setSnapId(e.target.value)}
            className="bg-transparent border border-grunge-ink/40 px-3 py-2 font-serif text-sm"
          >
            <option value={DEV_SNAP_ID}>{DEV_SNAP_ID} (dev / mm-snap serve)</option>
            <option value={PROD_SNAP_ID}>{PROD_SNAP_ID} (published)</option>
          </select>
          <button
            type="button"
            onClick={installSnap}
            disabled={busy}
            className="bg-grunge-blood text-grunge-paper font-display text-lg uppercase px-6 py-3 border-2 border-grunge-ink -rotate-1 hover:rotate-1 transition-transform duration-200 disabled:opacity-50"
          >
            {installed ? "Re-install" : "Install Snap"}
          </button>
          <span className="text-sm font-serif">
            Status:{" "}
            <span
              className={
                installed
                  ? "text-grunge-olive"
                  : installed === false
                    ? "text-grunge-blood"
                    : "text-grunge-sepia"
              }
            >
              {installed === null
                ? "checking..."
                : installed
                  ? "installed ✓"
                  : "not installed"}
            </span>
          </span>
        </div>
        <p className="font-serif text-xs mt-3 text-grunge-sepia leading-relaxed">
          Dev build requires <code>cd snap && bun run start</code> from
          DraintAi/draint-fe, then connect via MetaMask Flask.
        </p>
      </section>

      {/* Step 2: classify */}
      <section className="mb-10 p-6 bg-grunge-paper border border-grunge-ink/30 rotate-[0.3deg]">
        <div className="text-xs uppercase tracking-widest text-grunge-sepia mb-3">
          Step 2 · Classify a target
        </div>
        <div className="flex flex-col gap-3">
          <label className="font-serif text-sm">
            Chain ID
            <input
              type="number"
              value={chainId}
              onChange={(e) => setChainId(Number(e.target.value))}
              className="block w-full mt-1 bg-transparent border border-grunge-ink/40 px-3 py-2 font-mono"
            />
          </label>
          <label className="font-serif text-sm">
            Target address
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="0x..."
              className="block w-full mt-1 bg-transparent border border-grunge-ink/40 px-3 py-2 font-mono text-sm"
            />
          </label>
          <button
            type="button"
            onClick={classify}
            disabled={busy || !installed}
            className="self-start bg-grunge-ink text-grunge-paper font-display px-4 py-2 -rotate-1 hover:rotate-1 transition-transform disabled:opacity-50"
          >
            → invoke classify
          </button>
        </div>

        {error ? (
          <div className="mt-4 p-3 bg-grunge-blood/10 border border-grunge-blood text-grunge-blood font-serif text-sm">
            {error}
          </div>
        ) : null}

        {verdict ? (
          <div className="mt-6 p-4 border border-grunge-ink/40 bg-grunge-paper/60 rotate-[-0.3deg]">
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`font-display text-lg px-2 ${
                  verdict.severity === "critical"
                    ? "bg-grunge-blood text-grunge-paper"
                    : verdict.severity === "warning"
                      ? "bg-grunge-mustard"
                      : verdict.severity === "unknown"
                        ? "bg-grunge-sepia/40"
                        : "bg-grunge-olive/40"
                }`}
              >
                {verdict.severity.toUpperCase()}
              </span>
              <span className="font-mono text-sm">
                {(verdict.riskScore * 100).toFixed(0)}%
              </span>
              {verdict.matchedPattern ? (
                <span className="font-serif text-xs text-grunge-sepia">
                  · {verdict.matchedPattern}
                </span>
              ) : null}
            </div>
            <div className="font-mono text-xs break-all mb-3">
              {verdict.target}
            </div>
            <ul className="space-y-1 font-serif text-sm">
              {verdict.reasons.slice(0, 5).map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-grunge-sepia font-serif">
              v{verdict.classifierVersion}
            </div>
          </div>
        ) : null}
      </section>

      {/* Step 3: alert log */}
      <section className="p-6 bg-grunge-paper border border-grunge-ink/30 rotate-[-0.2deg]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs uppercase tracking-widest text-grunge-sepia">
            Step 3 · Alert log (snap state)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={refreshAlerts}
              disabled={busy || !installed}
              className="font-serif text-xs underline disabled:opacity-50"
            >
              refresh
            </button>
            <button
              type="button"
              onClick={clearAlerts}
              disabled={busy || !installed}
              className="font-serif text-xs underline text-grunge-blood disabled:opacity-50"
            >
              clear
            </button>
          </div>
        </div>

        {alerts.length === 0 ? (
          <p className="font-serif text-sm text-grunge-sepia">
            No alerts yet. Classify a few targets above to populate.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="border border-grunge-ink/20 p-3 flex items-start gap-3"
              >
                <span
                  className={`font-display text-xs px-2 py-0.5 ${
                    a.verdict.severity === "critical"
                      ? "bg-grunge-blood text-grunge-paper"
                      : a.verdict.severity === "warning"
                        ? "bg-grunge-mustard"
                        : "bg-grunge-sepia/30"
                  }`}
                >
                  {a.verdict.severity}
                </span>
                <div className="flex-1">
                  <div className="font-mono text-xs break-all">
                    {a.verdict.target}
                  </div>
                  <div className="font-serif text-xs text-grunge-sepia mt-1">
                    {a.kind} · chain {a.verdict.chainId} ·{" "}
                    {new Date(a.at).toLocaleString()}
                    {a.origin ? ` · ${a.origin}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
