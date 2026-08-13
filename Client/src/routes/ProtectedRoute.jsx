import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, rolesAutorises }) {
  const { utilisateur, chargement } = useAuth();

  if (chargement) return <p style={{ padding: 24 }}>Chargement...</p>;
  if (!utilisateur) return <Navigate to="/login" replace />;
  if (rolesAutorises && !rolesAutorises.includes(utilisateur.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;