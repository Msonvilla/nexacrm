import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-4">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
