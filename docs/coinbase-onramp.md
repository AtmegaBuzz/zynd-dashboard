# Coinbase Onramp — Fiat → USDC Top-Up

The dashboard lets a user fund their own EVM wallet (or any of their agent
wallets) with USDC on Base or Ethereum using fiat — INR via UPI/IMPS/cards,
USD via Apple Pay/cards, EUR/GBP via SEPA/cards. Coinbase handles KYC and
settlement; the dashboard only mints the session URL and watches for
settlement.

## Setup

### 1. Create a Coinbase Developer Platform account

Sign up at <https://portal.cdp.coinbase.com> (2FA required).

### 2. Apply for Onramp full access

Sandbox is capped at ≤ $5 / day per user. Production volumes require full
access — request it at
<https://support.cdp.coinbase.com/onramp-onboarding>. Approval is
typically a few business days.

### 3. Create an API key

Portal → **Settings** (bottom-left) → **API Keys** tab → **Secret API Keys**
sub-tab → **Create API key**.

Choose algorithm: **ECDSA** (default, matches CDP docs samples — JWT alg
becomes `ES256`) or **Ed25519** (JWT alg becomes `EdDSA`). Either works.
The signer in `src/lib/cdp.ts` switches based on `CDP_API_KEY_ALGORITHM`.

The portal returns:
- Key name → `organizations/<org-uuid>/apiKeys/<key-uuid>`
- Private key → PEM block. ECDSA starts with `-----BEGIN EC PRIVATE KEY-----`;
  Ed25519 starts with `-----BEGIN PRIVATE KEY-----`.

The PEM is only shown once. Hit **Download JSON** before closing.

```bash
CDP_API_KEY_NAME="organizations/<org-uuid>/apiKeys/<key-uuid>"
CDP_API_KEY_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----
<base64>
-----END EC PRIVATE KEY-----"
CDP_API_KEY_ALGORITHM=ECDSA
```

Wrap the PEM in double quotes so `dotenv` preserves newlines.

### 4. Get the Project ID

Portal → **Project Settings** → copy the **Project ID** and **Client API
Key**.

```bash
NEXT_PUBLIC_CDP_PROJECT_ID=<project-uuid>
NEXT_PUBLIC_ONCHAINKIT_API_KEY=<client-api-key>
```

### 5. Add your domain to the allowlist

Portal → **Project Settings** → **Allowed Origins** (also surfaced under
**Onramp → CORS / Domain settings** once the product is enabled). Add:

- `http://localhost:3000`
- `https://*.vercel.app` (preview deploys)
- your production origin, e.g. `https://app.zynd.ai`

The `redirectUrl` we send (`<NEXT_PUBLIC_APP_URL>/dashboard/wallet?topup=…`)
must resolve to an allowlisted origin or CDP rejects the session.

### 6. Configure the public app URL

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000   # production: https://app.zynd.ai
```

### 7. Run the Prisma migration

```bash
pnpm prisma migrate deploy
```

This adds the `topups` table and `topup_status` enum.

## Architecture

```
[User] ─click "Add Money"──▶ [AddMoneyModal] ─POST /api/onramp/session──▶ [Next.js]
                                                                              │
                                                                              ├─ insert TopUp row (status=CREATED)
                                                                              │
                                                                              └─ signJwt(ES256|EdDSA) ─▶ POST /v2/onramp/sessions ─▶ [Coinbase]
                                                                                                                                          │
                                                                              ◀───────────── { session.onrampUrl } ────────────────────────┘
[AddMoneyModal] ◀── { onrampUrl, partnerUserRef }
       │
       ├─ window.open(onrampUrl) → user completes payment + KYC inside Coinbase
       │
       └─ poll GET /api/onramp/status/{partnerUserRef} every 4s
              │
              └─ signJwt ─▶ GET /v2/onramp/transactions?partnerUserRef=… ─▶ [Coinbase]
              │
              └─ map ONRAMP_TRANSACTION_STATUS_* → CREATED|IN_PROGRESS|SUCCESS|FAILED
              │
              └─ update TopUp row, return latest status + tx hash to client
```

Trial-mode sessions are flagged by prefixing `partnerUserRef` with
`sandbox-`. Coinbase routes them through test rails and skips real
fund movement. Toggle via `CDP_ONRAMP_SANDBOX=true`.

Settlement on Base takes ~30s. The modal shows the txHash + a Basescan link
on success.

## Files

| File | Role |
|------|------|
| `src/lib/cdp.ts` | JWT signer (ES256 default, EdDSA opt-in) + `createOnrampSession` + `listOnrampTransactions` + `normaliseStatus` |
| `src/app/api/onramp/session/route.ts` | POST — validate destination ownership, insert TopUp, mint session URL |
| `src/app/api/onramp/status/[partnerUserRef]/route.ts` | GET — poll Coinbase, sync TopUp row |
| `src/app/api/onramp/topups/route.ts` | GET — list this user's recent top-ups |
| `src/app/api/wallet/balance/route.ts` | GET — read USDC balance from Base/Ethereum via viem |
| `src/components/wallet/add-money-modal.tsx` | Reusable modal — amount/currency/network picker + popup + poll loop |
| `src/app/(site)/dashboard/wallet/page.tsx` | Wires the modal into the developer card and per-agent rows |

## Security

- The CDP secret private key (ECDSA or Ed25519) never leaves the server.
  It is read from `CDP_API_KEY_PRIVATE_KEY` and used only inside
  `signCdpJwt()` in `src/lib/cdp.ts`.
- `/api/onramp/session` verifies the requested destination address is
  either the caller's own derived EVM address or one of their entities'
  wallet addresses. Other addresses are rejected with 403.
- `/api/onramp/status/[partnerUserRef]` rejects requests for TopUp rows
  the caller does not own.
- The `partner_user_ref` is a fresh UUID per session — it is **not** a
  Coinbase identifier, so leaking it does not let an attacker control the
  session.

## India-specific notes

- **Available payment methods**: UPI, IMPS, NetBanking, RuPay/Visa/Mastercard
  debit and credit cards. The IMPS rail launched on 2026-06-01.
- **KYC**: Coinbase performs PAN + Aadhaar verification inline the first
  time. The user is bounced through Coinbase's KYC flow without leaving
  the popup.
- **Limits**: ₹50,000 / transaction for unverified UPI users, ₹2,00,000 /
  day post-KYC. Limits are enforced by Coinbase, not by this dashboard.
- **Taxes**: 1% TDS is deducted on every purchase per CBDT rules. The
  user sees the post-TDS USDC amount in the Coinbase summary screen.
- **Currencies**: We expose INR, USD, EUR, GBP. India users default to
  INR; other regions default to USD.

## Limitations / not yet built

- **Off-ramp** (USDC → INR bank): Coinbase supports it via
  `POST /offramp/v2/sessions` (same JWT auth pattern, same domain
  allowlist). A `/api/offramp/session` route mirroring the onramp one
  would add it — gated for a v2 release after compliance review.
- **Webhooks**: We poll for status. CDP supports push webhooks at
  `/onramp/v2/webhooks` if poll latency becomes an issue.
- **Headless / native flow**: We use the hosted Coinbase popup. A native
  flow (Indian banking redirects inside our own UI) requires the
  Onramp v2 mobile SDK and additional compliance review.
- **x402 spending**: This branch only handles the funding side. Calling
  another agent and settling via x402 is wired in the CLI side, not in
  this dashboard.

## Testing without real money

Set `CDP_ONRAMP_SANDBOX=true` in `.env`. Every session created by
`/api/onramp/session` will have its `partnerUserRef` prefixed with
`sandbox-`, which Coinbase recognises as a trial-mode session — no
real funds move, payment methods show test cards, and per-user
trial limits apply (currently ~$5/day, subject to change). Flip
the flag to `false` once Onramp full access is approved by Coinbase
support.
