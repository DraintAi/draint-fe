// src/lib/wagmi.ts
//
// drain't — EIP-7702-aware wagmi config.
// Primary chain: Ethereum Sepolia (full Pectra/7702 support).
// Mainnet enabled for 1Shot Permissionless Relayer demo (Best 1Shot track).

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { mainnet, sepolia } from "wagmi/chains";

// Placeholder used only when env var missing (e.g. build-time on CI without secrets).
// Real projectId set via Vercel env: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
// Register at https://cloud.walletconnect.com (free).
const FALLBACK_PROJECT_ID = "draint_placeholder_replace_in_production";

// Explicit transports — viem's default public RPCs include eth.merkle.io
// which is heavily rate-limited (429s) + missing CORS headers. publicnode
// works reliably from browsers.
const MAINNET_RPC =
  process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_RPC_URL ||
  "https://ethereum-rpc.publicnode.com";
const SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";

export const config = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME || "drain't",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || FALLBACK_PROJECT_ID,
  chains: [sepolia, mainnet],
  transports: {
    [mainnet.id]: http(MAINNET_RPC),
    [sepolia.id]: http(SEPOLIA_RPC),
  },
  ssr: true,
});
