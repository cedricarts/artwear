import { Navigate } from "react-router-dom";
import { useAuth }  from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { currentUser, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isAdmin)     return <Navigate to="/" replace />;
  return children;
}
