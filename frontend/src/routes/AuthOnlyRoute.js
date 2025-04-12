import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AuthOnlyRoute = () => {
  const { isAuthenticated, user, needsReverification } = useAuth();

  return isAuthenticated && user && needsReverification() ? (
    <Outlet />
  ) : (
    <Navigate to="/" />
  );
};

export default AuthOnlyRoute;
