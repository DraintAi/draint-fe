import type { Metadata } from "next";
import "@fontsource/permanent-marker/400.css";
import "@fontsource/special-elite/400.css";
import "@fontsource/courier-prime/400.css";
import "@fontsource/courier-prime/700.css";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "drain't — Wallet drain? Didn't happen.",
  description:
    "AI security agent that protects wallets from EIP-7702 delegation drainer attacks. Built on MetaMask Smart Accounts Kit, Venice AI, and 1Shot Permissionless Relayer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
