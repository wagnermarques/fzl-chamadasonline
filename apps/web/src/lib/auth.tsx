import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearToken, setToken as persistToken, getToken } from "./api";
import { getOrCreateClientToken } from "./device";
import {
  isKeycloakConfigured,
  initKeycloak,
  keycloakLogin,
  keycloakLogout,
} from "./keycloak";

export interface AuthUser {
  id: string;
  name: string;
  role: "STUDENT" | "STAFF";
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, pin: string) => Promise<AuthUser>;
  loginWithKeycloak: () => void;
  logout: () => void;
  isKeycloakEnabled: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      // 1. Tenta inicializar SSO do Keycloak se configurado
      if (isKeycloakConfigured) {
        try {
          const kcResult = await initKeycloak();
          if (kcResult) {
            const clientToken = getOrCreateClientToken();
            const res = await api<{ accessToken: string; user: AuthUser }>("/auth/keycloak", {
              method: "POST",
              body: JSON.stringify({ keycloakToken: kcResult.token, clientToken }),
            });
            persistToken(res.accessToken);
            setUser(res.user);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Keycloak SSO auto-login check failed:", err);
        }
      }

      // 2. Se já possui token salvo no localStorage
      if (getToken()) {
        api<AuthUser>("/auth/me")
          .then(setUser)
          .catch(() => clearToken())
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  async function login(identifier: string, pin: string) {
    const clientToken = getOrCreateClientToken();
    const res = await api<{ accessToken: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, pin, clientToken }),
    });
    persistToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }

  function loginWithKeycloak() {
    keycloakLogin();
  }

  function logout() {
    clearToken();
    setUser(null);
    if (isKeycloakConfigured) {
      keycloakLogout();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithKeycloak,
        logout,
        isKeycloakEnabled: isKeycloakConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
