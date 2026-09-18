import { destinationAfterLogin } from "./post-login";
import { safeNextPath } from "./next-cookie";

function eq(name: string, got: string, want: string) {
  if (got !== want) throw new Error(`${name}: got ${got} want ${want}`);
  console.log("ok", name);
}

eq(
  "already-have + card → profile",
  destinationAfterLogin({
    cookieNext: "/agent-card",
    queryNext: null,
    intent: "card",
    cardHandle: "chandan",
    cardLookupFailed: false,
    hasDeveloperUsername: false,
  }),
  "/p/chandan",
);

eq(
  "already-have + no card → create notice",
  destinationAfterLogin({
    cookieNext: "/agent-card",
    queryNext: null,
    intent: "card",
    cardHandle: null,
    cardLookupFailed: false,
    hasDeveloperUsername: false,
  }),
  "/create?notice=no-profile",
);

eq(
  "already-have + lookup failed → soft notice",
  destinationAfterLogin({
    cookieNext: "/agent-card",
    queryNext: null,
    intent: "card",
    cardHandle: null,
    cardLookupFailed: true,
    hasDeveloperUsername: false,
  }),
  "/create?notice=lookup-failed",
);

eq(
  "create flow next wins even without card",
  destinationAfterLogin({
    cookieNext: "/create?url=https://github.com/x",
    queryNext: null,
    intent: "card",
    cardHandle: null,
    cardLookupFailed: false,
    hasDeveloperUsername: false,
  }),
  "/create?url=https://github.com/x",
);

eq(
  "claim next to /p/foo wins",
  destinationAfterLogin({
    cookieNext: "/p/foo",
    queryNext: null,
    intent: "card",
    cardHandle: null,
    cardLookupFailed: false,
    hasDeveloperUsername: false,
  }),
  "/p/foo",
);

eq(
  "no cookie, card intent, has card",
  destinationAfterLogin({
    cookieNext: null,
    queryNext: null,
    intent: "card",
    cardHandle: "maya",
    cardLookupFailed: false,
    hasDeveloperUsername: true,
  }),
  "/p/maya",
);

eq(
  "marketing login, card, no developer → profile",
  destinationAfterLogin({
    cookieNext: null,
    queryNext: null,
    intent: undefined,
    cardHandle: "maya",
    cardLookupFailed: false,
    hasDeveloperUsername: false,
  }),
  "/p/maya",
);

eq(
  "marketing login, card + developer → dashboard",
  destinationAfterLogin({
    cookieNext: null,
    queryNext: null,
    intent: undefined,
    cardHandle: "maya",
    cardLookupFailed: false,
    hasDeveloperUsername: true,
  }),
  "/dashboard",
);

eq(
  "marketing login, no card → dashboard",
  destinationAfterLogin({
    cookieNext: null,
    queryNext: null,
    intent: undefined,
    cardHandle: null,
    cardLookupFailed: false,
    hasDeveloperUsername: false,
  }),
  "/dashboard",
);

eq("safe next relative", safeNextPath("/create") ?? "", "/create");
eq("safe next rejects absolute", String(safeNextPath("https://evil.com")), "null");
eq("safe next decodes", safeNextPath("%2Fcreate") ?? "", "/create");
eq(
  "safe next decodes query",
  safeNextPath(encodeURIComponent("/create?url=https://github.com/x")) ?? "",
  "/create?url=https://github.com/x",
);

console.log("all post-login cases passed");
