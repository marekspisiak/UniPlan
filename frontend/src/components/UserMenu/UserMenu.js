import { Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useProfileLink } from "../../hooks/useProfileLink";
import UserAvatar from "../UserAvatar/UserAvatar";
import styles from "./UserMenu.module.scss";
import React from "react"; // dôležité pre forwardRef

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
  <div
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick?.(e);
    }}
    style={{ cursor: "pointer", display: "inline-block" }}
  >
    {children}
  </div>
));

const UserMenu = () => {
  const { logout, user } = useAuth();
  const getProfileLink = useProfileLink();
  const navigate = useNavigate();

  return (
    <Dropdown align="end" className={styles.userMenu}>
      <Dropdown.Toggle as={CustomToggle} id="user-menu-dropdown">
        <div className={styles.avatarWrapper}>
          <UserAvatar user={user} size="mini" />
        </div>
      </Dropdown.Toggle>

      <Dropdown.Menu className={styles.dropdownMenu}>
        <Dropdown.Item onClick={() => navigate(getProfileLink())}>
          Môj profil
        </Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={logout} className={styles.logoutItem}>
          Odhlásiť sa
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default UserMenu;
