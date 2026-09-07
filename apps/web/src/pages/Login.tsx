import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError } from "../lib/api";

export function Login() {
  const { login } = useAuth();
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
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center">Chamada Online</h1>
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
  );
}
