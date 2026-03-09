"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useSignMessage, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { useSetAtom } from "jotai";
import { z } from "zod";
import { User, Mail, Globe, Loader2, Fingerprint, Wallet } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ConnectWalletButton } from "@/components/ui/ConnectWalletButton";
import { AccentCorners } from "@/components/ui/AccentCorners";
import { GridTripod } from "@/components/ui/GridTripod";
import { DIDDocumentCreator } from "@/lib/did";
import { sha256Hash } from "@/lib/utils";
import { contractConfig } from "@/config/contract";
import { login, createUser } from "@/apis/registry";
import { accessTokenAtom, userAtom } from "@/store/global.store";

const UserRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type UserRegistration = z.infer<typeof UserRegisterSchema>;
type FormErrors = Partial<Record<keyof UserRegistration, string>>;
type AuthStep = "connect" | "form" | "registering" | "confirming";

const wrapStyle: React.CSSProperties = {
  position: "relative",
  top: "auto",
  padding: 0,
};
const cardStyle: React.CSSProperties = {
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
};

export default function AuthPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const setAccessToken = useSetAtom(accessTokenAtom);
  const setUser = useSetAtom(userAtom);

  const [step, setStep] = useState<AuthStep>("connect");
  const [formData, setFormData] = useState<UserRegistration>({
    name: "",
    email: "",
    website: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [didStr, setDIDStr] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  const {
    data: txHash,
    writeContractAsync,
    isPending: isWritePending,
  } = useWriteContract();

  const { isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const { data: resolveDIDData, isError: isResolveDIDError } = useReadContract({
    abi: contractConfig.abi,
    address: contractConfig.address,
    functionName: "resolveDID",
    args: address ? [`did:zynd:user:${address}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  useEffect(() => {
    if (isConnected) {
      setStep("form");
    } else {
      setStep("connect");
    }
  }, [isConnected]);

  const loginAndRedirect = useCallback(async () => {
    if (!address) return;

    try {
      const message = process.env.NEXT_PUBLIC_MESSAGE ?? "Sign in to ZyndAI";
      const signature = await signMessageAsync({ message });

      const loginResp = await login({
        wallet_address: address,
        signature,
        message,
      });

      setAccessToken(loginResp.access_token);
      router.push("/dashboard");
    } catch {
      setGlobalError("Login failed. Please try again.");
    }
  }, [address, signMessageAsync, setAccessToken, router]);

  useEffect(() => {
    if (!isResolveDIDError && resolveDIDData && address) {
      loginAndRedirect();
    }
  }, [isResolveDIDError, resolveDIDData, address, loginAndRedirect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const createUserOnRegistry = useCallback(async () => {
    if (!address || !didStr) return;

    try {
      setStep("confirming");
      const message = process.env.NEXT_PUBLIC_MESSAGE ?? "Sign in to ZyndAI";
      const signature = await signMessageAsync({ message });

      const user = await createUser({
        name: formData.name,
        walletAddress: address,
        signature,
        message,
      });

      const loginResp = await login({
        wallet_address: address,
        signature,
        message,
      });

      setAccessToken(loginResp.access_token);
      setUser(user);
      router.push("/dashboard");
    } catch {
      setGlobalError("Failed to create account. Please try again.");
      setStep("form");
    }
  }, [address, didStr, signMessageAsync, formData.name, setAccessToken, setUser, router]);

  useEffect(() => {
    if (isTxConfirmed && didStr) {
      createUserOnRegistry();
    }
  }, [isTxConfirmed, didStr, createUserOnRegistry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");

    const result = UserRegisterSchema.safeParse(formData);
    if (!result.success) {
      const formErrors = result.error.errors.reduce<FormErrors>((acc, curr) => {
        if (curr.path.length > 0) {
          acc[curr.path[0] as keyof UserRegistration] = curr.message;
        }
        return acc;
      }, {});
      setErrors(formErrors);
      return;
    }

    if (!isConnected || !address) {
      setGlobalError("Please connect your wallet first.");
      return;
    }

    try {
      setStep("registering");

      const didDocument = DIDDocumentCreator.createDIDDocument(address, false);
      DIDDocumentCreator.validateDIDDocument(didDocument);
      const didJson = JSON.stringify(didDocument, null, 2);
      setDIDStr(didJson);

      const didHash = await sha256Hash(didJson);

      await writeContractAsync({
        abi: contractConfig.abi,
        address: contractConfig.address,
        functionName: "registerUserDID",
        args: [didHash],
      });
    } catch {
      setGlobalError("On-chain registration failed. You may already be registered.");
      setStep("form");
    }
  };

  const isSubmitting = step === "registering" || step === "confirming" || isWritePending;

  const inputClass =
    "w-full border border-white/[0.08] bg-black/40 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[var(--color-accent)]/40 disabled:opacity-40";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-black">
        <div className="padding-global">
          <div className="container">
            <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>

              <div className="w-full max-w-lg">
                {/* Main card */}
                <div className="solution-card-wrap" style={wrapStyle}>
                  <div className="solution-card" style={cardStyle}>
                    <div style={{ padding: "2.5rem" }}>

                      <div className="mb-8 text-center">
                        <p style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, color: "white", margin: 0, lineHeight: 1.2 }}>
                          Get your <span style={{ color: "var(--color-accent)" }}>AI Identity</span>
                        </p>
                        <p className="mt-2 text-sm text-white/40">
                          Connect your wallet and register on-chain
                        </p>
                      </div>

                      {/* Error */}
                      {globalError && (
                        <div className="mb-5 border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                          {globalError}
                        </div>
                      )}

                      {/* Connect state */}
                      {step === "connect" && (
                        <div className="py-10 text-center">
                          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white/[0.04]">
                            <Wallet className="size-5 text-white/20" />
                          </div>
                          <p className="text-sm text-white/40">
                            Connect your wallet to get started.
                          </p>
                        </div>
                      )}

                      {/* Form */}
                      {(step === "form" || step === "registering" || step === "confirming") && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-white/40">
                              Full Name
                            </label>
                            <div className="relative">
                              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                                <User className="h-4 w-4 text-white/30" />
                              </div>
                              <input
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className={inputClass}
                              />
                            </div>
                            {errors.name && (
                              <p className="mt-1.5 text-xs text-red-400">{errors.name}</p>
                            )}
                          </div>

                          <div>
                            <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-white/40">
                              Email
                            </label>
                            <div className="relative">
                              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                                <Mail className="h-4 w-4 text-white/30" />
                              </div>
                              <input
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className={inputClass}
                              />
                            </div>
                            {errors.email && (
                              <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
                            )}
                          </div>

                          <div>
                            <label className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-white/40">
                              <span>Website / GitHub</span>
                              <span className="normal-case tracking-normal text-white/20">Optional</span>
                            </label>
                            <div className="relative">
                              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                                <Globe className="h-4 w-4 text-white/30" />
                              </div>
                              <input
                                name="website"
                                type="text"
                                autoComplete="url"
                                placeholder="https://github.com/yourprofile"
                                value={formData.website ?? ""}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                className={inputClass}
                              />
                            </div>
                            {errors.website && (
                              <p className="mt-1.5 text-xs text-red-400">{errors.website}</p>
                            )}
                          </div>

                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={isSubmitting || !isConnected}
                              className="flex w-full items-center justify-center gap-2 bg-[var(--color-accent)] py-3.5 text-sm font-bold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
                            >
                              {step === "registering" && (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Registering on-chain...</>
                              )}
                              {step === "confirming" && (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
                              )}
                              {step === "form" && (
                                <><Fingerprint className="h-4 w-4" /> Get my AI Identity</>
                              )}
                            </button>
                          </div>
                        </form>
                      )}

                      <p className="mt-6 text-center text-xs text-white/20">
                        Your DID is registered on Polygon Amoy via the ZyndAI registry contract.
                      </p>
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

              {/* Page-level grid lines */}
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
