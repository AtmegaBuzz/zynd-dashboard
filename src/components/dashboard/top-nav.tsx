"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useAtom } from "jotai";
import { LogOut, Menu } from "lucide-react";
import { accessTokenAtom, userAtom, userCredsAtom } from "@/store/global.store";
import { getMe } from "@/apis/registry";
import { formatAddress } from "@/lib/utils";
import { ConnectWalletButton } from "@/components/ui/ConnectWalletButton";

interface TopNavProps {
  onToggleSidebar?: () => void;
}

export function TopNav({ onToggleSidebar }: TopNavProps) {
  const { isConnected } = useAccount();
  const [authToken, setAuthToken] = useAtom(accessTokenAtom);
  const [user, setUser] = useAtom(userAtom);
  const [, setUserCreds] = useAtom(userCredsAtom);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      if (isConnected && authToken) {
        try {
          const fetched = await getMe(authToken);
          setUserCreds(fetched.credentials);
          setUser(fetched.user);
        } catch (error) {
          console.error("Failed to fetch user info", error);
        }
      }
    };

    fetchUser();
  }, [isConnected, authToken, setUser, setUserCreds]);

  useEffect(() => {
    if (authToken === null) {
      router.push("/auth");
    }
  }, [authToken, router]);

  const handleLogout = () => {
    setAuthToken(null);
  };

  return (
    <nav className="flex h-16 items-center justify-between border-b border-white/10 bg-black px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded p-1.5 text-[#f6f6f6]/60 transition-colors hover:text-[#f6f6f6] md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="text-lg font-semibold text-[#f6f6f6]">Dashboard</div>
      </div>

      <div className="flex items-center gap-4">
        {isConnected && user ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-[#f6f6f6]/60">
              {formatAddress(user.walletAddress)}
            </span>
            <button
              onClick={handleLogout}
              className="flex cursor-pointer items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#f6f6f6]/60 transition-colors hover:border-red-500/50 hover:text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        ) : (
          <ConnectWalletButton />
        )}
      </div>
    </nav>
  );
}
