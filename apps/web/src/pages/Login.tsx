import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";
import { ShareApp } from "../components/ShareApp";

export function Login() {
  const { user, loading, logout, login, loginWithKeycloak, isKeycloakEnabled } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(3);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(user.role === "STAFF" ? "/admin/events" : "/", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedUser = await login(identifier, pin);
      navigate(loggedUser.role === "STAFF" ? "/admin/events" : "/", { replace: true });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-400 border-r-transparent" />
          <p className="text-slate-400 text-sm">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (user) {
    const isStaff = user.role === "STAFF";
    const targetUrl = isStaff ? "/admin/events" : "/";
    const targetLabel = isStaff ? "Painel de Eventos (Staff)" : "Área de Presença (Aluno)";

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-2xl font-semibold text-center">Chamada Online</h1>

          <div className="rounded-2xl bg-slate-800 border border-slate-700 p-6 space-y-5 shadow-xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-2xl border border-emerald-500/30">
              {user.name.trim().charAt(0).toUpperCase() || "?"}
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Você já está conectado
              </div>
              <h2 className="text-xl font-bold text-slate-100 mt-2">{user.name}</h2>
              <p className="text-xs text-slate-400 font-mono">
                {isStaff ? "Perfil: Professor / Equipe (STAFF)" : "Perfil: Aluno"}
              </p>
            </div>

            <p className="text-xs text-slate-400">
              Redirecionando automaticamente em {secondsRemaining}s...
            </p>

            <div className="pt-1 space-y-2.5">
              <button
                type="button"
                onClick={() => navigate(targetUrl, { replace: true })}
                className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 py-2.5 font-medium text-slate-900 transition flex items-center justify-center gap-2 shadow"
              >
                Acessar {targetLabel}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full rounded-lg bg-slate-700/80 hover:bg-slate-700 py-2 text-sm text-slate-300 hover:text-white transition border border-slate-600/50"
              >
                Entrar com outra conta (Sair)
              </button>
            </div>
          </div>

          <ShareApp />
        </div>
      </div>
    );
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

        <ShareApp />
      </div>
    </div>
  );
}
