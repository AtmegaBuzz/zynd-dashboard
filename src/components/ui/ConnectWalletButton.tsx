"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { formatAddress } from "@/lib/utils";

export function ConnectWalletButton(): React.ReactNode {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-[#8B5CF6]">
          {formatAddress(address)}
        </span>
        <button
          onClick={() => disconnect()}
          className="cursor-pointer rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#E0E7FF] transition-colors hover:border-red-500/50 hover:text-red-400"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
      className="cursor-pointer rounded border border-[#8B5CF6]/40 bg-black px-5 py-2.5 text-sm font-medium text-[#8B5CF6] transition-all hover:border-[#8B5CF6] hover:shadow-[0_0_16px_rgba(191, 64, 255,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
