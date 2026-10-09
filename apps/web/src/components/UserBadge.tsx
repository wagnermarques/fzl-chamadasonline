import { useAuth } from "../lib/auth";

export function UserBadge() {
  const { user, logout } = useAuth();
  if (!user) return null;

  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center gap-3 rounded-full bg-slate-800 border border-slate-700 pl-1.5 pr-3 py-1.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-semibold">
        {initial}
      </span>
      <div className="text-left leading-tight">
        <p className="text-sm font-medium text-slate-100">{user.name}</p>
        <p className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="relative flex h-1.5 w-1.5" title="Sessão ativa">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          Conectado
        </p>
      </div>
      <button onClick={logout} className="text-xs text-slate-500 underline">
        Sair
      </button>
    </div>
  );
}
