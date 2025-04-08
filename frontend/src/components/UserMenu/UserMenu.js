import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./UserMenu.scss";

const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Dropdown align="end" className="user-menu">
      <Dropdown.Toggle variant="light" id="dropdown-basic">
        👤
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item onClick={() => navigate("/profile")}>
          Môj profil
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={logout} className="text-danger ">
          Odhlásiť sa
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default UserMenu;
