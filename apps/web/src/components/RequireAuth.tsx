import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function RequireAuth({
  role,
  children,
}: {
  role: "STUDENT" | "STAFF" | Array<"STUDENT" | "STAFF">;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (loading) return <div className="p-6 text-center">Carregando...</div>;
  if (!user) {
    const staffOnly = allowedRoles.length === 1 && allowedRoles[0] === "STAFF";
    return <Navigate to={staffOnly ? "/admin/login" : "/login"} replace />;
  }
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
