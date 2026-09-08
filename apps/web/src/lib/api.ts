const TOKEN_KEY = "chamadas.accessToken";

// In local dev this is empty and requests go through the Vite proxy to
// http://localhost:3333 (see vite.config.ts). In the GitHub Pages build,
// VITE_API_URL is baked in at build time and points at the hosted API
// (e.g. Render), since a static site has nothing of its own to proxy to.
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`API error ${status}`);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body);
  }
  return body as T;
}
