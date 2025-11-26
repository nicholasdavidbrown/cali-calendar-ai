import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading, needsSetup } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // If no users exist, redirect to register, otherwise to login
    return <Navigate to={needsSetup ? "/register" : "/login"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
