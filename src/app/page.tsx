import Link from "next/link";

const ENFORCER_SEPOLIA =
  process.env.NEXT_PUBLIC_ALLOWLIST_ENFORCER_SEPOLIA ??
  "0x2187D61279a8A54dc8907865959ef6cC8beBDa14";

export default function Home() {
  return (
    <main className="flex flex-col">
      {/* ─── Hero ──────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-20 md:py-32 max-w-5xl mx-auto w-full">
        <div className="inline-block bg-grunge-mustard/80 -rotate-1 px-3 py-1 mb-6 border border-grunge-ink/40 text-xs uppercase tracking-widest">
          Issue 01 · Underground Security Agent
        </div>
        <h1 className="text-5xl md:text-7xl leading-[1.05] mb-6 -rotate-[0.5deg]">
          Wallet drain?
          <br />
          <span className="bg-grunge-ink text-grunge-paper px-2 inline-block rotate-1 mt-2">
            Didn&rsquo;t happen.
          </span>
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mb-8 leading-relaxed">
          drain&rsquo;t is an AI security agent that stops wallet drainers —{" "}
          <strong>EIP-7702 delegations</strong>, <strong>Permit phishing</strong>,
          and <strong>malicious approvals</strong> — before your funds move.
          Built on MetaMask Smart Accounts Kit, Venice AI, and 1Shot
          Permissionless Relayer.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/onboard"
            className="bg-grunge-blood text-grunge-paper font-display text-lg uppercase px-6 py-3 border-2 border-grunge-ink -rotate-1 hover:rotate-1 hover:translate-y-[-2px] transition-transform duration-200 inline-block"
          >
            Get protected
          </Link>
          <Link
            href="/dashboard"
            className="bg-transparent text-grunge-ink font-sans px-4 py-2 border-b-2 border-dashed border-grunge-ink hover:bg-grunge-mustard transition-colors duration-200 inline-block"
          >
            → Read the manifesto
          </Link>
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-16 max-w-5xl mx-auto w-full">
        <div className="text-xs uppercase tracking-widest text-grunge-sepia mb-6">
          Why drain&rsquo;t exists
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              stat: "97%",
              copy: "of EIP-7702 delegations in the wild point at malicious sweeper contracts — the CrimeEnjoyor family.",
              rot: "-rotate-1",
            },
            {
              stat: "450K+",
              copy: "wallets drained since Pectra. Same bytecode, copy-pasted across attackers.",
              rot: "rotate-1",
            },
            {
              stat: "1 block",
              copy: "is all it takes. CrimeEnjoyor variants forward any incoming asset to the attacker on contact.",
              rot: "-rotate-1",
            },
          ].map((c) => (
            <article
              key={c.stat}
              className={`bg-grunge-paper p-6 border border-grunge-ink/30 shadow-[2px_2px_0_0_rgba(0,0,0,0.1),0_8px_24px_-8px_rgba(0,0,0,0.3)] ${c.rot} relative`}
            >
              <div className="font-display text-4xl md:text-5xl mb-3 text-grunge-blood">
                {c.stat}
              </div>
              <p className="font-sans text-sm leading-relaxed">{c.copy}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── How it works ──────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-16 max-w-5xl mx-auto w-full">
        <div className="text-xs uppercase tracking-widest text-grunge-sepia mb-3">
          Defense in depth
        </div>
        <h2 className="text-3xl md:text-4xl mb-8 -rotate-[0.3deg]">
          Three lines of defense
        </h2>
        <div className="space-y-6">
          {[
            {
              n: "01",
              title: "Pre-sign warning (MetaMask Snap)",
              copy: "drain't intercepts every signature and transaction request. If you&rsquo;re about to sign a Permit or a type-0x04 7702 authorization that points to a known drainer, we block the prompt with a critical warning before the damage is done.",
            },
            {
              n: "02",
              title: "Autonomous monitor (reference AI agent)",
              copy: "Delegate emergency permissions to drain&rsquo;t via ERC-7710 and we&rsquo;ll watch your address 24/7. The moment your wallet&rsquo;s code changes to point at a fresh CrimeEnjoyor copycat, our agent reasons (Venice AI) and queues a response.",
            },
            {
              n: "03",
              title: "Gasless rescue (1Shot relayer)",
              copy: "When critical risk is detected, drain&rsquo;t broadcasts a revocation authorization through the 1Shot Permissionless Relayer — gas paid in USDC, zero ETH needed. Proven with a real on-chain rescue on Arbitrum One.",
            },
          ].map((s) => (
            <div
              key={s.n}
              className="flex flex-col md:flex-row gap-4 md:gap-8 border-l-4 border-grunge-blood pl-4 md:pl-8 py-2"
            >
              <div className="font-display text-3xl md:text-5xl text-grunge-sepia">
                {s.n}
              </div>
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl mb-2">{s.title}</h3>
                <p
                  className="font-sans text-base leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: s.copy }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Tech roll call ────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-16 max-w-5xl mx-auto w-full">
        <div className="text-xs uppercase tracking-widest text-grunge-sepia mb-6">
          Built on
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-serif">
          {[
            "MetaMask Smart Accounts Kit",
            "ERC-7702 / 7710 / 7715",
            "Venice AI",
            "1Shot Permissionless Relayer",
          ].map((t) => (
            <div
              key={t}
              className="bg-grunge-paper p-4 border border-dashed border-grunge-ink/40 text-center text-sm"
            >
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Network info ──────────────────────────────────────── */}
      <section className="px-6 md:px-10 py-16 max-w-5xl mx-auto w-full">
        <blockquote className="border-l-4 border-grunge-blood pl-6 py-2 font-serif text-xl italic text-grunge-sepia">
          &ldquo;The protocol forgets you. drain&rsquo;t does not.&rdquo;
          <footer className="mt-2 text-sm uppercase tracking-widest text-grunge-olive not-italic">
            — anonymous, 2026
          </footer>
        </blockquote>
      </section>

      {/* ─── Footer ────────────────────────────────────────────── */}
      <footer className="bg-grunge-ink text-grunge-paper px-6 md:px-10 py-12 mt-auto relative">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="max-w-5xl mx-auto relative grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="font-display text-2xl mb-4 -rotate-1">
              drain&rsquo;t
            </div>
            <p className="font-sans text-sm opacity-80 leading-relaxed">
              Wallet drain? Didn&rsquo;t happen.
            </p>
          </div>
          <div>
            <div className="font-serif text-xs uppercase tracking-widest mb-3 text-grunge-mustard">
              Network
            </div>
            <ul className="space-y-2 font-sans text-sm opacity-80">
              <li>Sepolia: live</li>
              <li>
                <a
                  href={`https://sepolia.etherscan.io/address/${ENFORCER_SEPOLIA}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs underline"
                >
                  {ENFORCER_SEPOLIA.slice(0, 10)}…
                  {ENFORCER_SEPOLIA.slice(-6)}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="font-serif text-xs uppercase tracking-widest mb-3 text-grunge-mustard">
              Repo
            </div>
            <ul className="space-y-2 font-sans text-sm opacity-80">
              <li>
                <a
                  href="https://github.com/DraintAi"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  github.com/DraintAi
                </a>
              </li>
              <li>MetaMask Smart Accounts Kit x 1Shot Hackathon · 2026</li>
            </ul>
          </div>
        </div>
      </footer>
    </main>
  );
}
