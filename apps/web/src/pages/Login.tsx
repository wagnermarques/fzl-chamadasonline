import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";

export function Login() {
  const { login, loginWithKeycloak, isKeycloakEnabled } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(identifier, pin);
      navigate(user.role === "STAFF" ? "/admin/events" : "/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Matrícula ou PIN inválidos.");
      } else {
        setError("Não foi possível entrar. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center">Chamada Online</h1>

        {isKeycloakEnabled && (
          <div className="space-y-3 pb-2 border-b border-slate-700">
            <button
              type="button"
              onClick={loginWithKeycloak}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2 font-medium text-white shadow flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Entrar com Keycloak / Moodle
            </button>
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-3 text-xs text-slate-400">ou com matrícula/PIN</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="identifier">
              Matrícula
            </label>
            <input
              id="identifier"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1" htmlFor="pin">
              PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 py-2 font-medium text-slate-900"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
