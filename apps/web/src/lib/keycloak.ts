import Keycloak from "keycloak-js";

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL;
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM || "fzlbpms";
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "fzl-chamadasonline";

export const isKeycloakConfigured = Boolean(keycloakUrl);

let keycloakInstance: Keycloak | null = null;

export function getKeycloakInstance(): Keycloak | null {
  if (!isKeycloakConfigured) return null;
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak({
      url: keycloakUrl,
      realm: keycloakRealm,
      clientId: keycloakClientId,
    });
  }
  return keycloakInstance;
}

export interface KeycloakAuthResult {
  token: string;
  username: string;
  name: string;
  email?: string;
  roles: string[];
}

export async function initKeycloak(): Promise<KeycloakAuthResult | null> {
  const kc = getKeycloakInstance();
  if (!kc) return null;

  const authenticated = await kc.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });

  if (authenticated && kc.token) {
    const tokenParsed = kc.tokenParsed as any;
    const realmRoles: string[] = tokenParsed?.realm_access?.roles || [];
    const clientRoles: string[] = tokenParsed?.resource_access?.[keycloakClientId]?.roles || [];
    const allRoles = Array.from(new Set([...realmRoles, ...clientRoles]));

    return {
      token: kc.token,
      username: tokenParsed?.preferred_username || tokenParsed?.sub,
      name: tokenParsed?.name || tokenParsed?.preferred_username || "Usuário Keycloak",
      email: tokenParsed?.email,
      roles: allRoles,
    };
  }

  return null;
}

export function keycloakLogin() {
  const kc = getKeycloakInstance();
  if (!kc) {
    console.warn("Keycloak is not configured (missing VITE_KEYCLOAK_URL).");
    return;
  }
  return kc.login({
    redirectUri: window.location.origin + window.location.pathname,
  });
}

export function keycloakLogout() {
  const kc = getKeycloakInstance();
  if (kc && kc.authenticated) {
    return kc.logout({ redirectUri: window.location.origin });
  }
}
