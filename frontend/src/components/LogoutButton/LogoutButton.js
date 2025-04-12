import { Button } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

const LogoutButton = () => {
  const { logout } = useAuth();

  return (
    <Button variant="danger" onClick={logout} className="w-100 mt-2">
      Odhlásiť sa
    </Button>
  );
};

export default LogoutButton;
