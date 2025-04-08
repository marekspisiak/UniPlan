import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = () => {
  const { isAuthenticated, user } = useAuth();

  return isAuthenticated && user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
