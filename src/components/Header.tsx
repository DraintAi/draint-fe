"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <nav className="border-b border-dashed border-grunge-ink/40 px-6 md:px-10 py-4 flex items-center justify-between bg-grunge-paper/80 backdrop-blur-sm sticky top-0 z-50">
      <Link
        href="/"
        className="font-display text-2xl -rotate-[2deg] inline-block hover:rotate-[1deg] transition-transform"
      >
        drain<span className="bg-grunge-mustard/60 px-0.5">&rsquo;</span>t
      </Link>
      <div className="flex items-center gap-4 md:gap-6 font-sans text-sm uppercase tracking-widest">
        <Link
          href="/onboard"
          className="hidden sm:inline-block hover:bg-grunge-mustard/60 px-1 transition-colors"
        >
          Onboard
        </Link>
        <Link
          href="/dashboard"
          className="hidden sm:inline-block hover:bg-grunge-mustard/60 px-1 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/honeypot"
          className="hidden md:inline-block text-grunge-blood hover:bg-grunge-mustard/60 px-1 transition-colors"
        >
          honeypot
        </Link>
        <Link
          href="/snap-test"
          className="hidden md:inline-block text-grunge-sepia hover:bg-grunge-mustard/60 px-1 transition-colors"
        >
          dev
        </Link>
        <ConnectButton
          chainStatus="icon"
          accountStatus="address"
          showBalance={false}
        />
      </div>
    </nav>
  );
}
