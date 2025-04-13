import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./UserMenu.module.scss";

const UserMenu = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <Dropdown align="end" className={styles.userMenu}>
      <Dropdown.Toggle
        variant="light"
        id="dropdown-basic"
        className={styles.dropdownToggle}
      >
        👤
      </Dropdown.Toggle>

      <Dropdown.Menu className={styles.dropdownMenu}>
        <Dropdown.Item onClick={() => navigate(`/profile/${user?.id}`)}>
          Môj profil
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={logout} className="text-danger">
          Odhlásiť sa
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default UserMenu;
