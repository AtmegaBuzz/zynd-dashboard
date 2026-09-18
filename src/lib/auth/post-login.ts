export type PostLoginInput = {
  cookieNext: string | null;
  queryNext: string | null;
  intent: string | undefined;
  cardHandle: string | null;
  cardLookupFailed: boolean;
  hasDeveloperUsername: boolean;
};

function isAgentCardHome(path: string): boolean {
  return path === "/agent-card" || path.startsWith("/agent-card?");
}

export function destinationAfterLogin(input: PostLoginInput): string {
  const explicit = input.cookieNext ?? input.queryNext;
  const profile = input.cardHandle ? `/p/${encodeURIComponent(input.cardHandle)}` : null;
  const noCardCreate = input.cardLookupFailed
    ? "/create?notice=lookup-failed"
    : "/create?notice=no-profile";

  if (explicit) {
    if (input.intent === "card" && isAgentCardHome(explicit)) {
      if (profile) return profile;
      return noCardCreate;
    }
    return explicit;
  }

  if (input.intent === "card") {
    if (profile) return profile;
    return noCardCreate;
  }

  if (profile && !input.hasDeveloperUsername) return profile;
  return "/dashboard";
}
