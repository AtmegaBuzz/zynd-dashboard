import crypto from "node:crypto";

const CDP_HOST = "api.developer.coinbase.com";
const KEY_NAME = process.env.CDP_API_KEY_NAME;
const PRIVATE_KEY_PEM = process.env.CDP_API_KEY_PRIVATE_KEY;
// Algorithm picked when the key was generated in the CDP portal.
// ECDSA → ES256 (docs sample default). Ed25519 → EdDSA.
const ALGO = (process.env.CDP_API_KEY_ALGORITHM ?? "ECDSA").toUpperCase() as "ECDSA" | "ED25519";

function b64url(buf: Buffer | string): string {
  return (typeof buf === "string" ? Buffer.from(buf) : buf)
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

// CDP JWT per docs.cdp.coinbase.com/api-reference/authentication.
// Max validity is 120s. Each token is single-use per request URI.
function signCdpJwt(method: string, path: string): string {
  if (!KEY_NAME || !PRIVATE_KEY_PEM) {
    throw new Error("CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY must be set");
  }

  const alg = ALGO === "ED25519" ? "EdDSA" : "ES256";
  const header = {
    alg,
    typ: "JWT",
    kid: KEY_NAME,
    nonce: crypto.randomBytes(16).toString("hex"),
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: "cdp",
    sub: KEY_NAME,
    nbf: now,
    exp: now + 120,
    uri: `${method.toUpperCase()} ${CDP_HOST}${path}`,
  };

  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const key = loadPrivateKey(PRIVATE_KEY_PEM, ALGO);

  let sig: Buffer;
  if (ALGO === "ED25519") {
    sig = crypto.sign(null, Buffer.from(signingInput), key);
  } else {
    // dsaEncoding "ieee-p1363" emits raw 64-byte r||s required by JWT/ES256
    // (default DER encoding would be rejected by JWT verifiers).
    sig = crypto.sign("sha256", Buffer.from(signingInput), { key, dsaEncoding: "ieee-p1363" });
  }
  return `${signingInput}.${b64url(sig)}`;
}

// PKCS#8 DER prefix for Ed25519 keys with a 32-byte raw seed payload.
// Const from RFC 8410 §7. Lets us accept raw base64 secrets in addition
// to PEM, which is what the CDP portal currently surfaces for Ed25519.
const ED25519_PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

function loadPrivateKey(raw: string, algo: "ECDSA" | "ED25519"): crypto.KeyObject {
  const trimmed = raw.trim();
  if (trimmed.startsWith("-----BEGIN")) {
    return crypto.createPrivateKey(trimmed);
  }
  if (algo !== "ED25519") {
    throw new Error("ECDSA secret must be supplied as PEM (-----BEGIN ... -----END)");
  }
  // Strip whitespace inside the base64 (the CDP portal sometimes wraps long
  // secrets across lines when copy-pasted from the modal).
  const b64 = trimmed.replace(/\s+/g, "");
  const buf = Buffer.from(b64, "base64");
  let seed: Buffer;
  if (buf.length === 32) {
    seed = buf;
  } else if (buf.length === 64) {
    // libsodium-style "expanded" secret: first 32 bytes = seed, last 32 = pubkey.
    seed = buf.subarray(0, 32);
  } else {
    throw new Error(`Ed25519 raw key must decode to 32 or 64 bytes (got ${buf.length})`);
  }
  const der = Buffer.concat([ED25519_PKCS8_PREFIX, seed]);
  return crypto.createPrivateKey({ key: der, format: "der", type: "pkcs8" });
}

export class CdpError extends Error {
  constructor(public status: number, public body: unknown, message: string) {
    super(message);
  }
}

async function cdpRequest<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const jwt = signCdpJwt(method, path);
  const res = await fetch(`https://${CDP_HOST}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const parsed: unknown = text ? safeParse(text) : null;

  if (!res.ok) {
    const msg =
      (parsed && typeof parsed === "object" && "message" in parsed && typeof parsed.message === "string"
        ? parsed.message
        : null) ?? `CDP ${method} ${path} failed: ${res.status}`;
    throw new CdpError(res.status, parsed, msg);
  }

  return parsed as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ─── Onramp v2 ───────────────────────────────────────────────────────────────
// API ref: docs.cdp.coinbase.com/api-reference/v2/rest-api/onramp/create-an-onramp-session

export type OnrampNetwork = "base" | "ethereum";
export type OnrampPaymentMethod = "CARD" | "ACH" | "APPLE_PAY" | "PAYPAL" | "FIAT_WALLET" | "CRYPTO_WALLET";

export interface CreateOnrampSessionInput {
  destinationAddress: `0x${string}`;
  destinationNetwork: OnrampNetwork;
  purchaseCurrency: string; // ticker, e.g. "USDC"
  paymentAmount?: string;   // fiat amount user pays (fee-inclusive), string per API
  purchaseAmount?: string;  // crypto amount (fee-exclusive)
  paymentCurrency?: string; // ISO 4217 fiat code
  paymentMethod?: OnrampPaymentMethod;
  country?: string;         // ISO 3166-1 alpha-2
  subdivision?: string;     // ISO 3166-2 (required for US)
  partnerUserRef: string;
  redirectUrl: string;
  clientIp?: string;
}

export interface CreateOnrampSessionResponse {
  session: {
    onrampUrl: string;
  };
  quote?: unknown;
}

export async function createOnrampSession(
  input: CreateOnrampSessionInput
): Promise<CreateOnrampSessionResponse> {
  const body: Record<string, unknown> = {
    destinationAddress: input.destinationAddress,
    destinationNetwork: input.destinationNetwork,
    purchaseCurrency: input.purchaseCurrency,
    partnerUserRef: input.partnerUserRef,
    redirectUrl: input.redirectUrl,
  };
  if (input.paymentAmount) body.paymentAmount = input.paymentAmount;
  if (input.purchaseAmount) body.purchaseAmount = input.purchaseAmount;
  if (input.paymentCurrency) body.paymentCurrency = input.paymentCurrency;
  if (input.paymentMethod) body.paymentMethod = input.paymentMethod;
  if (input.country) body.country = input.country;
  if (input.subdivision) body.subdivision = input.subdivision;
  if (input.clientIp) body.clientIp = input.clientIp;

  return cdpRequest<CreateOnrampSessionResponse>("POST", "/onramp/v2/sessions", body);
}

// ─── Transaction status ─────────────────────────────────────────────────────
// Lists transactions for a given partnerUserRef. Status enum per CDP docs.

export interface OnrampTransaction {
  status: "ONRAMP_TRANSACTION_STATUS_CREATED" | "ONRAMP_TRANSACTION_STATUS_IN_PROGRESS" | "ONRAMP_TRANSACTION_STATUS_SUCCESS" | "ONRAMP_TRANSACTION_STATUS_FAILED";
  txHash?: string;
  purchaseAmount?: { value: string; currency: string };
  paymentTotal?: { value: string; currency: string };
  errorMessage?: string;
  createdAt: string;
}

interface ListOnrampTransactionsResponse {
  transactions: OnrampTransaction[];
}

export async function listOnrampTransactions(partnerUserRef: string): Promise<OnrampTransaction[]> {
  const res = await cdpRequest<ListOnrampTransactionsResponse>(
    "GET",
    `/onramp/v2/transactions?partnerUserRef=${encodeURIComponent(partnerUserRef)}`
  );
  return res.transactions ?? [];
}

// Map CDP enum → our internal enum used by Prisma TopUp.status.
export function normaliseStatus(s: OnrampTransaction["status"]): "CREATED" | "IN_PROGRESS" | "SUCCESS" | "FAILED" {
  switch (s) {
    case "ONRAMP_TRANSACTION_STATUS_SUCCESS": return "SUCCESS";
    case "ONRAMP_TRANSACTION_STATUS_FAILED": return "FAILED";
    case "ONRAMP_TRANSACTION_STATUS_IN_PROGRESS": return "IN_PROGRESS";
    default: return "CREATED";
  }
}
