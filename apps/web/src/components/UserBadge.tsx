import { useAuth } from "../lib/auth";

export function UserBadge() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <span className="relative flex h-2.5 w-2.5" title="Sessão ativa">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
      </span>
      <span>{user.name}</span>
      <button onClick={logout} className="text-slate-500 underline">
        Sair
      </button>
    </div>
  );
}
