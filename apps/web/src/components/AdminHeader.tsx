import { Link, useLocation } from "react-router-dom";
import { UserBadge } from "./UserBadge";

export function AdminHeader({ title }: { title: string }) {
  const location = useLocation();
  const isEvents = location.pathname.startsWith("/admin/events");
  const isEnroll = location.pathname.startsWith("/admin/enroll");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
        <UserBadge />
      </div>

      <nav className="flex items-center gap-2 border-b border-slate-700/80 pb-3">
        <Link
          to="/admin/events"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
            isEvents
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Eventos & Telão
        </Link>

        <Link
          to="/admin/enroll"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
            isEnroll
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          Celulares Vinculados (Secretaria)
        </Link>
      </nav>
    </div>
  );
}
