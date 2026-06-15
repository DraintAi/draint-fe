"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  fetchIncidents,
  fetchWatched,
  severityClass,
  shortAddress,
  triggerOneShotRescue,
  type AgentIncident,
  type OneShotRescueResult,
  type WatchedAddress,
} from "@/lib/draint";

const REFRESH_INTERVAL_MS = 10_000;

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [incidents, setIncidents] = useState<AgentIncident[]>([]);
  const [watched, setWatched] = useState<WatchedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [rescueState, setRescueState] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const [rescueResult, setRescueResult] = useState<OneShotRescueResult | null>(
    null,
  );

  async function runRescue() {
    setRescueState("running");
    setRescueResult(null);
    const r = await triggerOneShotRescue();
    setRescueResult(r);
    setRescueState(r.ok ? "done" : "error");
  }

  async function refresh() {
    const [i, w] = await Promise.all([fetchIncidents(20), fetchWatched()]);
    setIncidents(i);
    setWatched(w);
    setLastFetch(new Date());
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    const t = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  const mine = address
    ? watched.find((w) => w.address.toLowerCase() === address.toLowerCase())
    : null;

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16">
      <div className="flex items-baseline justify-between mb-8 flex-wrap gap-3">
        <div>
          <div className="inline-block bg-grunge-mustard/80 -rotate-1 px-3 py-1 mb-3 border border-grunge-ink/40 text-xs uppercase tracking-widest">
            Status
          </div>
          <h1 className="text-4xl md:text-5xl leading-tight -rotate-[0.3deg]">
            Dashboard
          </h1>
        </div>
        <div className="text-xs font-serif text-grunge-sepia">
          {lastFetch
            ? `last refresh: ${lastFetch.toLocaleTimeString()}`
            : "syncing…"}
        </div>
      </div>

      {/* ─── Your wallet ─────────────────────────────────────── */}
      <section className="mb-12 p-6 bg-grunge-paper border border-grunge-ink/30 rotate-[-0.2deg]">
        <div className="text-xs uppercase tracking-widest text-grunge-sepia mb-3">
          Your wallet
        </div>
        {!isConnected ? (
          <p className="font-serif text-sm">
            Connect your wallet using the header button to see protection
            status.
          </p>
        ) : !address ? (
          <p className="font-serif text-sm">…</p>
        ) : mine ? (
          <div className="space-y-2">
            <div className="font-mono text-sm break-all">{mine.address}</div>
            <div className="flex flex-wrap items-center gap-3 font-serif text-sm">
              <span className="font-display text-xs px-2 py-0.5 bg-grunge-olive/40">
                MONITORED
              </span>
              <span className="text-grunge-sepia">
                chain {mine.chainId} · auto-rescue{" "}
                {mine.autoRescue ? "on" : "off"} · last checked{" "}
                {new Date(mine.lastCheckedAt).toLocaleString()}
              </span>
            </div>
            {mine.lastDelegationTarget ? (
              <div className="font-mono text-xs text-grunge-sepia mt-2">
                7702 delegation → {shortAddress(mine.lastDelegationTarget)}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="font-mono text-sm break-all">{address}</div>
            <p className="font-serif text-sm">
              <span className="font-display text-xs px-2 py-0.5 bg-grunge-sepia/30 mr-2">
                NOT MONITORED
              </span>
              This wallet isn&rsquo;t under drain&rsquo;t&rsquo;s watch yet.
            </p>
            <Link
              href="/onboard"
              className="inline-block bg-grunge-blood text-grunge-paper font-display text-sm uppercase px-4 py-2 border-2 border-grunge-ink -rotate-1 hover:rotate-1 transition-transform"
            >
              Enable monitoring
            </Link>
          </div>
        )}
      </section>

      {/* ─── Gasless Rescue ──────────────────────────────────── */}
      <section className="mb-12 p-6 bg-grunge-paper border border-grunge-ink/30 rotate-[0.2deg]">
        <div className="text-xs uppercase tracking-widest text-grunge-sepia mb-3">
          Gasless Rescue · 1Shot
        </div>
        <p className="font-serif text-sm leading-relaxed mb-2">
          When drain&rsquo;t detects a critical threat, its agent sweeps your
          funds to a safe recovery wallet — gas paid in{" "}
          <strong>USDC via the 1Shot Permissionless Relayer</strong>, with{" "}
          <strong>zero ETH</strong> needed. Even a wallet with no gas can rescue
          itself.
        </p>
        <p className="font-serif text-xs text-grunge-sepia mb-4">
          Demo: this triggers a real gasless rescue on drain&rsquo;t&rsquo;s
          demo wallet (0x7428…eBb1) to show the 1Shot flow end-to-end — no
          wallet connection needed. In production, drain&rsquo;t fires this
          autonomously on YOUR monitored wallet via a delegation you
          pre-authorize.
        </p>

        <button
          type="button"
          onClick={runRescue}
          disabled={rescueState === "running"}
          className="bg-grunge-blood text-grunge-paper font-display text-sm uppercase px-5 py-2.5 border-2 border-grunge-ink -rotate-1 hover:rotate-1 transition-transform disabled:opacity-60 disabled:rotate-0"
        >
          {rescueState === "running"
            ? "Rescuing… building delegation → 1Shot → confirming"
            : "Run rescue now"}
        </button>

        {rescueState === "done" && rescueResult?.ok ? (
          <div className="mt-4 p-4 bg-grunge-olive/20 border border-grunge-olive/50 font-serif text-sm space-y-1">
            <div className="font-display uppercase text-xs">
              ✓ Wallet rescued
            </div>
            {rescueResult.sweepAmount ? (
              <div>
                Swept{" "}
                <strong>
                  {(Number(rescueResult.sweepAmount) / 1e6).toFixed(4)} USDC
                </strong>{" "}
                to recovery{" "}
                {rescueResult.recovery
                  ? shortAddress(rescueResult.recovery)
                  : ""}
                .
              </div>
            ) : null}
            <div className="text-grunge-sepia text-xs">
              gas paid in USDC · zero ETH spent
            </div>
            {rescueResult.explorer ? (
              <a
                href={rescueResult.explorer}
                target="_blank"
                rel="noreferrer"
                className="inline-block underline break-all"
              >
                View on Arbiscan ↗
              </a>
            ) : null}
          </div>
        ) : null}

        {rescueState === "error" ? (
          <div className="mt-4 p-4 bg-grunge-blood/15 border border-grunge-blood/50 font-serif text-sm break-all">
            Rescue failed: {rescueResult?.error ?? "unknown error"}
          </div>
        ) : null}
      </section>

      {/* ─── Incidents ───────────────────────────────────────── */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-4">
          <div className="text-xs uppercase tracking-widest text-grunge-sepia">
            Incident log
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="font-serif text-xs underline text-grunge-ink disabled:opacity-50"
          >
            refresh
          </button>
        </div>
        {loading ? (
          <p className="font-serif text-sm text-grunge-sepia">syncing…</p>
        ) : incidents.length === 0 ? (
          <div className="p-6 bg-grunge-paper border border-dashed border-grunge-ink/30 font-serif text-sm">
            <p>
              No incidents recorded. drain&rsquo;t&rsquo;s reference agent
              hasn&rsquo;t observed a malicious delegation change on any
              watched address.
            </p>
            <p className="text-grunge-sepia mt-2 text-xs">
              The agent ticks every 60 seconds via Vercel Cron.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {incidents.map((i) => (
              <li
                key={i.id}
                className="bg-grunge-paper border border-grunge-ink/30 p-4 rotate-[-0.2deg]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-display text-xs px-2 py-0.5 ${severityClass(i.severity)}`}
                    >
                      {i.severity.toUpperCase()}
                    </span>
                    <span className="font-serif text-sm">{i.kind}</span>
                  </div>
                  <span className="font-serif text-xs text-grunge-sepia">
                    {new Date(i.at).toLocaleString()}
                  </span>
                </div>
                <div className="font-mono text-xs break-all">
                  wallet: {i.address}
                </div>
                {i.delegationTarget ? (
                  <div className="font-mono text-xs break-all text-grunge-sepia">
                    delegated to: {i.delegationTarget}
                  </div>
                ) : null}
                {i.matchedPattern ? (
                  <div className="font-serif text-sm mt-2">
                    pattern: <strong>{i.matchedPattern}</strong> · risk{" "}
                    {(i.riskScore * 100).toFixed(0)}%
                  </div>
                ) : null}
                <ul className="mt-2 space-y-1 font-serif text-sm">
                  {i.reasoning.slice(0, 5).map((r, idx) => (
                    <li key={idx}>• {r}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ─── Watched wallets ─────────────────────────────────── */}
      <section>
        <div className="text-xs uppercase tracking-widest text-grunge-sepia mb-4">
          Watched wallets ({watched.length})
        </div>
        {watched.length === 0 ? (
          <p className="font-serif text-sm text-grunge-sepia">
            No wallets under monitor.{" "}
            <Link href="/onboard" className="underline">
              Add one
            </Link>
            .
          </p>
        ) : (
          <ul className="grid md:grid-cols-2 gap-3">
            {watched.map((w) => (
              <li
                key={`${w.chainId}:${w.address}`}
                className="bg-grunge-paper border border-dashed border-grunge-ink/40 p-3"
              >
                <div className="font-mono text-xs break-all">{w.address}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 font-serif text-xs text-grunge-sepia">
                  <span>chain {w.chainId}</span>
                  {w.autoRescue ? (
                    <span className="bg-grunge-blood/20 px-1">auto-rescue</span>
                  ) : null}
                </div>
                {w.lastDelegationTarget ? (
                  <div className="font-mono text-[10px] mt-2 text-grunge-sepia">
                    7702 → {shortAddress(w.lastDelegationTarget)}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
