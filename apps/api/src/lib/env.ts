function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: required("DATABASE_URL"),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  keycloak: {
    // e.g. https://fzlbpms.local/auth/realms/fzlbpms — unset disables /auth/keycloak
    issuer: process.env.KEYCLOAK_ISSUER?.replace(/\/$/, "") || undefined,
    jwksUrl: process.env.KEYCLOAK_JWKS_URL || undefined,
    clientId: process.env.KEYCLOAK_CLIENT_ID || "fzl-chamadasonline",
  },
};
