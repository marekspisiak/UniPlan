import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = () => {
  const { isAuthenticated, user, needsReverification } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  if (needsReverification()) {
    return <Navigate to="/email-reverify" />;
  }

  return <Outlet />;
};

export default PrivateRoute;
