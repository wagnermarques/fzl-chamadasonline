import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { env } from "./env.js";

export type KeycloakClaims = JWTPayload & {
  azp?: string;
  preferred_username?: string;
  name?: string;
  email?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

// Keys are fetched lazily and cached by jose (refetched when Keycloak rotates
// them). The JWKS URL can differ from the issuer so the API can reach
// Keycloak over an internal address (e.g. http://localhost:8083 in dev)
// while tokens keep the public issuer.
const jwks = env.keycloak.issuer
  ? createRemoteJWKSet(
      new URL(env.keycloak.jwksUrl ?? `${env.keycloak.issuer}/protocol/openid-connect/certs`),
    )
  : null;

export const keycloakEnabled = jwks !== null;

// Verifies signature, expiry, issuer and that the token was issued to our
// client (azp). Throws if anything doesn't match.
export async function verifyKeycloakToken(token: string): Promise<KeycloakClaims> {
  if (!jwks) throw new Error("keycloak_not_configured");
  const { payload } = await jwtVerify<KeycloakClaims>(token, jwks, {
    issuer: env.keycloak.issuer,
    algorithms: ["RS256"],
  });
  if (payload.azp !== env.keycloak.clientId) {
    throw new Error("wrong_azp");
  }
  return payload;
}
