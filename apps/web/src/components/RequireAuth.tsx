import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function RequireAuth({
  role,
  children,
}: {
  role: "STUDENT" | "STAFF";
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6 text-center">Carregando...</div>;
  if (!user) return <Navigate to={role === "STAFF" ? "/admin/login" : "/login"} replace />;
  if (user.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}
