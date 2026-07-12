import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-400 text-sm animate-pulse">Verifying session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
