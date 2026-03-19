# Privy Auth Migration Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current wallet-only auth system (wagmi + Jotai + manual signature login) with Privy, enabling Google, X (Twitter), email, and wallet login — while keeping the existing registry backend API contract intact.

**Architecture:** Privy handles all authentication (social + wallet). On successful Privy login, the frontend gets the user's wallet address (from embedded wallet for social users, or external wallet for wallet users) and calls the existing registry `POST /auth/login` endpoint with a signed message. The registry access token is stored via Privy's `getAccessToken()` persistence (cookie-based, survives refresh). Jotai atoms remain for user/creds state but `accessTokenAtom` is replaced by Privy's auth state.

**Tech Stack:** `@privy-io/react-auth`, `@privy-io/wagmi`, Polygon Amoy (existing chain), Next.js 16 App Router

---

## File Structure

### Files to Create
| File | Responsibility |
|------|---------------|
| `src/hooks/useAuth.ts` | Central auth hook — wraps Privy + registry login into one interface. All components consume this instead of raw Privy/Jotai |

### Files to Modify
| File | Change |
|------|--------|
| `package.json` | Add `@privy-io/react-auth`, `@privy-io/wagmi`. Remove `wagmi/connectors` usage |
| `src/config/wagmi.ts` | Switch to `createConfig` from `@privy-io/wagmi`, remove explicit connectors (Privy manages them) |
| `src/components/providers.tsx` | Wrap with `PrivyProvider` > `QueryClientProvider` > `WagmiProvider` (from `@privy-io/wagmi`) |
| `src/store/global.store.ts` | Remove `accessTokenAtom`. Keep `userAtom` and `userCredsAtom` |
| `src/app/auth/page.tsx` | Complete rewrite — simple page that calls `privy.login()`, no registration form, no on-chain DID step |
| `src/components/Navbar.tsx` | Replace wagmi connect/sign logic with `useAuth()` hook |
| `src/components/ui/ConnectWalletButton.tsx` | Replace wagmi hooks with Privy `login()`/`logout()` |
| `src/components/dashboard/top-nav.tsx` | Replace wagmi `useAccount` + Jotai atoms with `useAuth()` hook |
| `src/app/dashboard/layout.tsx` | Replace `accessTokenAtom` guard with Privy `authenticated` state |
| `src/app/dashboard/page.tsx` | Replace `accessTokenAtom` with `useAuth()` |
| `src/app/dashboard/settings/page.tsx` | Replace `accessTokenAtom` with `useAuth()` |
| `src/app/dashboard/agents/page.tsx` | Replace `accessTokenAtom` with `useAuth()` |
| `src/app/dashboard/agents/[id]/page.tsx` | Replace `accessTokenAtom` with `useAuth()` |
| `src/app/dashboard/agents/[id]/edit/page.tsx` | Replace `accessTokenAtom` with `useAuth()` |
| `src/components/agents/agent-form.tsx` | Replace `accessTokenAtom` with `useAuth()` |
| `src/app/registry/[id]/page.tsx` | Keep wagmi `useWalletClient` for x402 payments (Privy-managed wallets work with wagmi hooks) |

### Files to Delete
| File | Reason |
|------|--------|
| `src/lib/did.ts` | On-chain DID registration removed from frontend auth flow |
| `src/config/contract.ts` | DID registry contract no longer called from auth page |
| `src/lib/abi.ts` (if exists) | Contract ABI no longer needed for auth |

### Files Unchanged
| File | Why |
|------|-----|
| `src/apis/registry/auth.ts` | `login()` API stays — still called with wallet_address + signature |
| `src/apis/registry/users.ts` | `getMe()`, `createUser()` stay unchanged |
| `src/apis/registry/client.ts` | Axios client stays unchanged |
| `src/apis/registry/types.ts` | Types stay unchanged |

---

## Chunk 1: Install Dependencies and Setup Privy Provider

### Task 1: Install Privy packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Privy packages**

```bash
cd /Users/sahil/work/zyndai/zyndai-website
pnpm add @privy-io/react-auth @privy-io/wagmi
```

- [ ] **Step 2: Verify installation**

```bash
pnpm ls @privy-io/react-auth @privy-io/wagmi
```

Expected: Both packages listed with versions.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add Privy auth SDK packages"
```

---

### Task 2: Update wagmi config for Privy

**Files:**
- Modify: `src/config/wagmi.ts`

- [ ] **Step 1: Rewrite wagmi config**

Replace the entire file. Key changes:
- Import `createConfig` from `@privy-io/wagmi` instead of `wagmi`
- Remove explicit connectors (Privy injects them)
- Keep `polygonAmoy` chain

```typescript
import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { polygonAmoy } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(),
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/config/wagmi.ts
git commit -m "feat: switch wagmi config to Privy-managed connectors"
```

---

### Task 3: Update Providers with PrivyProvider

**Files:**
- Modify: `src/components/providers.tsx`

- [ ] **Step 1: Rewrite providers**

Nesting order: `PrivyProvider` > `QueryClientProvider` > `WagmiProvider` (from `@privy-io/wagmi`).

```typescript
"use client";

import { type ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { polygonAmoy } from "wagmi/chains";
import { wagmiConfig } from "@/config/wagmi";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["google", "twitter", "email", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#8B5CF6",
          logo: "/zynd.png",
          landingHeader: "Welcome to ZyndAI",
          loginMessage: "Sign in to access the agent network",
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: polygonAmoy,
        supportedChains: [polygonAmoy],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
```

- [ ] **Step 2: Add env var to `.env.local`**

```bash
echo "NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here" >> .env.local
```

User must create a Privy app at https://dashboard.privy.io and paste the real app ID.

- [ ] **Step 3: Verify app compiles**

```bash
pnpm dev
```

Expected: App starts without errors. Privy SDK initializes (check browser console for no Privy errors).

- [ ] **Step 4: Commit**

```bash
git add src/components/providers.tsx
git commit -m "feat: wrap app with PrivyProvider for social + wallet auth"
```

---

## Chunk 2: Create useAuth Hook and Update Store

### Task 4: Update global store — remove accessTokenAtom

**Files:**
- Modify: `src/store/global.store.ts`

- [ ] **Step 1: Remove accessTokenAtom**

The new auth state comes from Privy's `usePrivy()` hook (cookie-persisted). We still need `userAtom` and `userCredsAtom` for registry-specific data.

```typescript
import { UserResponse, VCResponse } from "@/apis/registry/types";
import { atom } from "jotai";

export const registryTokenAtom = atom<string | null>(null);
export const userAtom = atom<UserResponse | null>(null);
export const userCredsAtom = atom<VCResponse[]>([]);
```

Rename `accessTokenAtom` → `registryTokenAtom` to clarify it's the registry backend token, not the Privy auth token.

- [ ] **Step 2: Commit**

```bash
git add src/store/global.store.ts
git commit -m "refactor: rename accessTokenAtom to registryTokenAtom"
```

---

### Task 5: Create useAuth hook

**Files:**
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: Write the hook**

This hook is the single interface for auth across the app. It:
1. Reads Privy auth state (`authenticated`, `user`, `login`, `logout`, `ready`)
2. Gets the user's wallet address (embedded or external)
3. After Privy login, auto-signs a message and calls registry `POST /auth/login`
4. Stores the registry token in `registryTokenAtom`
5. Fetches user profile via `getMe()` on successful registry login

```typescript
"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAtom } from "jotai";
import { registryTokenAtom, userAtom, userCredsAtom } from "@/store/global.store";
import { login } from "@/apis/registry";
import { getMe } from "@/apis/registry/users";

const SIGN_MESSAGE = process.env.NEXT_PUBLIC_MESSAGE || "Sign in to ZyndAI";

export function useAuth() {
  const { ready, authenticated, user: privyUser, login: privyLogin, logout: privyLogout, signMessage, getAccessToken } = usePrivy();
  const { wallets } = useWallets();
  const [registryToken, setRegistryToken] = useAtom(registryTokenAtom);
  const [user, setUser] = useAtom(userAtom);
  const [, setUserCreds] = useAtom(userCredsAtom);
  const loginAttemptedRef = useRef(false);

  const walletAddress = wallets[0]?.address ?? null;

  const loginToRegistry = useCallback(async () => {
    if (!walletAddress || loginAttemptedRef.current) return;
    loginAttemptedRef.current = true;

    try {
      const wallet = wallets[0];
      const signature = await signMessage(SIGN_MESSAGE, { uiOptions: { title: "Sign in to ZyndAI", description: "This signature verifies your identity." } });

      const response = await login({
        wallet_address: walletAddress,
        signature,
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
  }, [walletAddress, wallets, signMessage, setRegistryToken, setUser, setUserCreds]);

  // Auto-login to registry when Privy auth completes and wallet is available
  useEffect(() => {
    if (authenticated && walletAddress && !registryToken) {
      loginToRegistry();
    }
  }, [authenticated, walletAddress, registryToken, loginToRegistry]);

  // Reset on logout
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
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: create useAuth hook bridging Privy and registry login"
```

---

## Chunk 3: Update Navbar and Auth Page

### Task 6: Rewrite Navbar auth logic

**Files:**
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: Replace wagmi/Jotai auth with useAuth**

Changes:
- Remove imports: `useAccount`, `useConnect`, `useSignMessage` from wagmi, `metaMask` from wagmi/connectors, `useAtomValue`/`useSetAtom` from jotai, `accessTokenAtom`/`userAtom`, `login` from apis, `formatAddress` from utils
- Add import: `useAuth` from `@/hooks/useAuth`, `formatAddress` from `@/lib/utils`
- Replace `handleGetStarted` with simple: if authenticated → go to dashboard, else → call `login()`
- Replace `buttonLabel` logic with Privy state

The navbar keeps its GSAP animations, mobile menu, and nav links unchanged. Only the auth-related code changes.

Replace lines 7-14 imports with:
```typescript
import { useAuth } from "@/hooks/useAuth";
import { formatAddress } from "@/lib/utils";
```

Remove `useAccount`, `useConnect`, `useSignMessage`, `metaMask`, `useAtomValue`, `useSetAtom`, `login` from `@/apis/registry`, `accessTokenAtom`, `userAtom`.

Replace the auth state block (lines 37-42) with:
```typescript
const { ready, authenticated, registryToken, walletAddress, login: privyLogin } = useAuth();
```

Replace `handleGetStarted` (lines 44-100) with:
```typescript
const handleGetStarted = useCallback(() => {
  if (authenticated && registryToken) {
    router.push("/dashboard");
    return;
  }
  privyLogin();
}, [authenticated, registryToken, router, privyLogin]);
```

Replace `buttonLabel` (lines 102-112) with:
```typescript
const buttonLabel = !ready
  ? "GET STARTED"
  : authenticated && registryToken
    ? formatAddress(walletAddress || "")
    : "GET STARTED";
```

Remove `isConnecting`, `isLoggingIn`, `mounted` state variables and their effects. Remove `SIGN_MESSAGE` constant.

Update the button `disabled` prop: remove `isConnecting || isLoggingIn`, just use `!ready`.

- [ ] **Step 2: Verify navbar renders and login modal opens**

```bash
pnpm dev
```

Click GET STARTED → Privy modal should open with Google, X, email, and wallet options.

- [ ] **Step 3: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: replace Navbar auth with Privy login"
```

---

### Task 7: Rewrite auth page

**Files:**
- Modify: `src/app/auth/page.tsx`

- [ ] **Step 1: Rewrite auth page**

The auth page becomes a simple redirect page:
- If already authenticated → redirect to dashboard
- If not → show the Privy login modal automatically

No more registration form, no on-chain DID step, no wallet connect step.

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AccentCorners } from "@/components/ui/AccentCorners";
import { GridTripod } from "@/components/ui/GridTripod";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const router = useRouter();
  const { ready, authenticated, registryToken, login } = useAuth();

  useEffect(() => {
    if (ready && authenticated && registryToken) {
      router.push("/dashboard");
    }
  }, [ready, authenticated, registryToken, router]);

  useEffect(() => {
    if (ready && !authenticated) {
      login();
    }
  }, [ready, authenticated, login]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        <div className="padding-global">
          <div className="container">
            <div
              className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center"
              style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}
            >
              <div className="w-full max-w-lg">
                <div
                  className="solution-card-wrap"
                  style={{ position: "relative", top: "auto", padding: 0 }}
                >
                  <div
                    className="solution-card"
                    style={{
                      display: "block",
                      gridTemplateColumns: "none",
                      minHeight: "auto",
                      gap: 0,
                      padding: 0,
                      position: "relative",
                      zIndex: 5,
                      backgroundColor: "transparent",
                      border: "none",
                      borderRadius: 0,
                    }}
                  >
                    <div style={{ padding: "2.5rem" }}>
                      <div className="mb-8 text-center">
                        <p
                          style={{
                            fontSize: "clamp(1.5rem, 3vw, 2rem)",
                            fontWeight: 700,
                            color: "white",
                            margin: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          Welcome to{" "}
                          <span style={{ color: "var(--color-accent)" }}>
                            ZyndAI
                          </span>
                        </p>
                        <p className="mt-2 text-sm text-white/40">
                          Sign in with Google, X, email, or your wallet
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-4 py-8">
                        {!ready ? (
                          <div className="flex items-center gap-2 text-white/40">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-[var(--color-accent)]" />
                            Loading...
                          </div>
                        ) : authenticated && registryToken ? (
                          <p className="text-sm text-white/60">
                            Redirecting to dashboard...
                          </p>
                        ) : (
                          <button
                            onClick={login}
                            className="flex w-full items-center justify-center gap-2 bg-[var(--color-accent)] py-3.5 text-sm font-bold text-white transition-all hover:brightness-110"
                          >
                            Sign In
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="accent-border-overlay" />
                  <div className="accent-background" />
                  <div className="events-none absolute">
                    <AccentCorners />
                  </div>
                  <GridTripod corner="left-top-corner" />
                  <GridTripod corner="right-top-corner" />
                  <GridTripod corner="left-bottom-corner" />
                  <GridTripod corner="right-bottom-corner" />
                  <div className="main-hero-bottom-line" />
                  <div className="main-hero-top-line" />
                </div>
              </div>

              <div className="middle-hero-right-second-line is-hide-mb" />
              <div className="middle-hero-second-line is-hide-mb" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/auth/page.tsx
git commit -m "feat: rewrite auth page to use Privy login modal"
```

---

## Chunk 4: Update Dashboard Components

### Task 8: Update dashboard layout auth guard

**Files:**
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Replace accessTokenAtom with useAuth**

```typescript
"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopNav } from "@/components/dashboard/top-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, authenticated, registryToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/auth");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(
    () => setSidebarOpen((prev) => !prev),
    []
  );

  if (!ready || !authenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-black">
      <Sidebar />

      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={closeSidebar}
          />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar mobile onLinkClick={closeSidebar} />
          </div>
        </>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/layout.tsx
git commit -m "feat: use Privy auth guard in dashboard layout"
```

---

### Task 9: Update top-nav

**Files:**
- Modify: `src/components/dashboard/top-nav.tsx`

- [ ] **Step 1: Replace wagmi + Jotai with useAuth**

```typescript
"use client";

import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatAddress } from "@/lib/utils";

interface TopNavProps {
  onToggleSidebar?: () => void;
}

export function TopNav({ onToggleSidebar }: TopNavProps) {
  const { authenticated, user, walletAddress, logout } = useAuth();

  return (
    <nav className="flex h-16 items-center justify-between border-b border-white/10 bg-black px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded p-1.5 text-[#E0E7FF]/60 transition-colors hover:text-[#E0E7FF] md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="text-lg font-semibold text-[#E0E7FF]">Dashboard</div>
      </div>

      <div className="flex items-center gap-4">
        {authenticated && (user || walletAddress) ? (
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-[#E0E7FF]/60">
              {user ? formatAddress(user.walletAddress) : formatAddress(walletAddress || "")}
            </span>
            <button
              onClick={logout}
              className="flex cursor-pointer items-center gap-1.5 rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#E0E7FF]/60 transition-colors hover:border-red-500/50 hover:text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/top-nav.tsx
git commit -m "feat: update top-nav to use Privy auth"
```

---

### Task 10: Update ConnectWalletButton

**Files:**
- Modify: `src/components/ui/ConnectWalletButton.tsx`

- [ ] **Step 1: Replace wagmi hooks with useAuth**

```typescript
"use client";

import { useAuth } from "@/hooks/useAuth";
import { formatAddress } from "@/lib/utils";

export function ConnectWalletButton(): React.ReactNode {
  const { ready, authenticated, walletAddress, login, logout } = useAuth();

  if (authenticated && walletAddress) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-[#8B5CF6]">
          {formatAddress(walletAddress)}
        </span>
        <button
          onClick={logout}
          className="cursor-pointer rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#E0E7FF] transition-colors hover:border-red-500/50 hover:text-red-400"
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
      className="cursor-pointer rounded border border-[#8B5CF6]/40 bg-black px-5 py-2.5 text-sm font-medium text-[#8B5CF6] transition-all hover:border-[#8B5CF6] hover:shadow-[0_0_16px_rgba(139,92,246,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {!ready ? "Loading..." : "Connect Wallet"}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/ConnectWalletButton.tsx
git commit -m "feat: update ConnectWalletButton with Privy auth"
```

---

## Chunk 5: Update Dashboard Pages (accessTokenAtom → useAuth)

### Task 11: Update all dashboard pages

Every dashboard page that reads `accessTokenAtom` needs to switch to `useAuth().registryToken`.

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/settings/page.tsx`
- Modify: `src/app/dashboard/agents/page.tsx`
- Modify: `src/app/dashboard/agents/[id]/page.tsx`
- Modify: `src/app/dashboard/agents/[id]/edit/page.tsx`
- Modify: `src/components/agents/agent-form.tsx`

- [ ] **Step 1: Update each file**

For each file, the change is mechanical:

1. Remove: `import { accessTokenAtom } from "@/store/global.store"` and `import { useAtomValue } from "jotai"`
2. Add: `import { useAuth } from "@/hooks/useAuth"`
3. Replace: `const accessToken = useAtomValue(accessTokenAtom)` → `const { registryToken: accessToken } = useAuth()`

For files that also use `userAtom`:
1. Remove: `import { userAtom } from "@/store/global.store"`
2. Get user from: `const { registryToken: accessToken, user } = useAuth()`

**`src/app/dashboard/page.tsx`** — also replace `userCredsAtom` usage. The `useAuth` hook populates `userCredsAtom` automatically, so this page can keep reading it from Jotai OR get it from useAuth. Keep the Jotai read for now since `useAuth` doesn't expose creds directly:

```typescript
// Keep: import { useAtomValue } from "jotai"
// Keep: import { userCredsAtom } from "@/store/global.store"
// The useAuth hook auto-populates userCredsAtom on login
```

- [ ] **Step 2: Verify all dashboard pages compile**

```bash
pnpm build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/ src/components/agents/agent-form.tsx
git commit -m "feat: migrate all dashboard pages from accessTokenAtom to useAuth"
```

---

## Chunk 6: Cleanup Old Auth Code

### Task 12: Remove dead auth code

**Files:**
- Delete: `src/lib/did.ts`
- Delete: `src/config/contract.ts`
- Modify: `src/apis/registry/users.ts` (keep as-is, `createUser` may still be called from useAuth in the future)

- [ ] **Step 1: Check if contract.ts and did.ts are used anywhere else**

```bash
grep -rn "contract\|contractConfig\|DIDDocumentCreator" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "auth/page.tsx"
```

If no other references, safe to delete. If registry `[id]` page uses contract for x402, keep `contract.ts`.

- [ ] **Step 2: Delete unused files**

Only delete if Step 1 confirms no other references:

```bash
rm src/lib/did.ts
# Only delete contract.ts if NOT used by registry/[id] for x402
```

- [ ] **Step 3: Remove unused wagmi connector imports**

Check if any file still imports from `wagmi/connectors`:

```bash
grep -rn "wagmi/connectors" src/ --include="*.ts" --include="*.tsx"
```

If none, the old MetaMask connector import is already gone.

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

Expected: Clean build, no unused import errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove dead DID registration and contract code"
```

---

### Task 13: Final verification

- [ ] **Step 1: Test full auth flow**

```bash
pnpm dev
```

Manual test checklist:
1. Open homepage → Click GET STARTED → Privy modal opens
2. Sign in with Google → Embedded wallet created → Auto-login to registry → Redirected to dashboard
3. Sign in with email → Same flow
4. Sign in with MetaMask → External wallet used → Auto-login → Dashboard
5. Dashboard shows wallet address in top-nav
6. Logout → Redirected to /auth
7. Refresh page while logged in → Session persists (Privy cookies)
8. Visit /dashboard without auth → Redirected to /auth
9. Registry page x402 payments still work with wallet

- [ ] **Step 2: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete Privy auth migration"
```

---

## Environment Variables Required

| Variable | Where | Value |
|----------|-------|-------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | `.env.local` | From https://dashboard.privy.io |
| `NEXT_PUBLIC_MESSAGE` | `.env.local` | Keep existing (used for registry login signature) |
| `NEXT_PUBLIC_REGISTRY_API_URL` | `.env.local` | Keep existing |

## Migration Notes

- **Privy free tier**: 5,000 MAU — sufficient for current scale
- **Token persistence**: Privy uses cookies (`privy-token`, `privy-session`) — sessions survive page refresh (fixing a major current bug)
- **Embedded wallets**: Social login users (Google/X/email) automatically get an Ethereum wallet — this wallet address is used for registry login
- **External wallets**: MetaMask/WalletConnect users connect their own wallet — works exactly like before
- **Registry backend**: Zero changes needed. The `POST /auth/login` endpoint receives `wallet_address + signature` regardless of how the user authenticated
- **x402 payments**: Continue working via wagmi hooks, which operate on Privy-managed wallets seamlessly
- **DID on-chain registration**: Removed from the frontend auth flow. If needed later, can be added as a separate step in the dashboard
