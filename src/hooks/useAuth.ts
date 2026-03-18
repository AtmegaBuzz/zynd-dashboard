"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAtom } from "jotai";
import { registryTokenAtom, userAtom, userCredsAtom } from "@/store/global.store";
import { login } from "@/apis/registry";
import { getMe } from "@/apis/registry/users";

const SIGN_MESSAGE = process.env.NEXT_PUBLIC_MESSAGE || "Sign in to ZyndAI";

export function useAuth() {
  const { ready, authenticated, user: privyUser, login: privyLogin, logout: privyLogout } = usePrivy();
  const { ready: walletsReady, wallets } = useWallets();
  const [registryToken, setRegistryToken] = useAtom(registryTokenAtom);
  const [user, setUser] = useAtom(userAtom);
  const [, setUserCreds] = useAtom(userCredsAtom);
  const loginAttemptedRef = useRef(false);

  const wallet = wallets[0];
  const walletAddress = wallet?.address ?? null;

  const loginToRegistry = useCallback(async () => {
    if (!wallet || !walletAddress || loginAttemptedRef.current) return;
    loginAttemptedRef.current = true;

    try {
      const provider = await wallet.getEthereumProvider();
      const signature = await provider.request({
        method: "personal_sign",
        params: [SIGN_MESSAGE, walletAddress],
      });

      const response = await login({
        wallet_address: walletAddress,
        signature: signature as string,
        message: SIGN_MESSAGE,
      });

      setRegistryToken(response.access_token);

      const me = await getMe(response.access_token);
      setUser(me.user);
      setUserCreds(me.credentials);
    } catch (error) {
      console.error("Registry login failed:", error);
      loginAttemptedRef.current = false;
    }
  }, [wallet, walletAddress, setRegistryToken, setUser, setUserCreds]);

  useEffect(() => {
    if (authenticated && walletsReady && walletAddress && !registryToken) {
      loginToRegistry();
    }
  }, [authenticated, walletsReady, walletAddress, registryToken, loginToRegistry]);

  useEffect(() => {
    if (!authenticated) {
      loginAttemptedRef.current = false;
      setRegistryToken(null);
      setUser(null);
      setUserCreds([]);
    }
  }, [authenticated, setRegistryToken, setUser, setUserCreds]);

  const handleLogin = useCallback(() => {
    privyLogin();
  }, [privyLogin]);

  const handleLogout = useCallback(async () => {
    await privyLogout();
    setRegistryToken(null);
    setUser(null);
    setUserCreds([]);
  }, [privyLogout, setRegistryToken, setUser, setUserCreds]);

  return {
    ready,
    authenticated,
    registryToken,
    user,
    walletAddress,
    login: handleLogin,
    logout: handleLogout,
    privyUser,
  };
}
