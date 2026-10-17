type AuthenticationClaims = {
  amr?: Array<string | { method?: string; timestamp?: number } | null> | null;
};

export function hasPasswordAuthentication(
  claims: AuthenticationClaims | null | undefined,
): boolean {
  const methods = Array.isArray(claims?.amr)
    ? claims.amr.map((entry) =>
      typeof entry === "string" ? entry : entry?.method
    )
    : [];

  // AMR descreve toda a sessão, não apenas o método com maior timestamp.
  // A recuperação continua bloqueada mesmo se houver refresh ou outro método.
  return methods.includes("password") && !methods.includes("recovery");
}

export function isAuthorizedInstagramUser(
  userId: string,
  ownerId: string | undefined,
): boolean {
  return Boolean(ownerId) && userId === ownerId;
}
