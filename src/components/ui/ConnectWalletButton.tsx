"use client";

import { useAuth } from "@/hooks/useAuth";
import { formatAddress } from "@/lib/utils";

export function ConnectWalletButton(): React.ReactNode {
  const { ready, authenticated, walletAddress, login, logout } = useAuth();

  if (authenticated && walletAddress) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-[var(--color-accent)]">
          {formatAddress(walletAddress)}
        </span>
        <button
          onClick={logout}
          className="cursor-pointer border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white transition-colors hover:border-red-500/30 hover:text-red-400"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      disabled={!ready}
      className="cursor-pointer border border-[var(--color-accent)]/40 bg-black px-5 py-2.5 text-sm font-medium text-[var(--color-accent)] transition-all hover:border-[var(--color-accent)] hover:shadow-[0_0_16px_rgba(139,92,246,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {!ready ? "Loading..." : "Connect Wallet"}
    </button>
  );
}
