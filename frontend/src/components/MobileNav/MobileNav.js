import { Link, NavLink } from "react-router-dom";
import styles from "./MobileNav.module.scss";
import { useProfileLink } from "../../hooks/useProfileLink";
import { useAuth } from "../../context/AuthContext";
import { Plus } from "lucide-react";
import { useRoomContext } from "../../context/RoomContext";

const MobileNav = () => {
  const { logout } = useAuth();
  const getProfileLink = useProfileLink();
  const { newMessage } = useRoomContext();
  return (
    <nav className={styles.mobileNav}>
      <NavLink
        to="/"
        className={({ isActive }) =>
          `${styles.navIcon} ${isActive ? styles.active : ""}`
        }
      >
        🏠
      </NavLink>

      <NavLink
        to="/chat"
        className={({ isActive }) =>
          `${styles.navIcon} ${isActive ? styles.active : ""}`
        }
      >
        <div className={styles.chatButtonWrapper}>
          <div style={{ position: "relative" }}>
            {newMessage && <span className={styles.chatButtonNotification} />}
            <div>💬</div>
          </div>
        </div>
      </NavLink>
      <NavLink to="/create-event">
        <button className={styles.createButton}>
          <Plus size={24} />
        </button>
      </NavLink>
      <NavLink
        to={getProfileLink()}
        className={({ isActive }) =>
          `${styles.navIcon} ${isActive ? styles.active : ""}`
        }
      >
        👤
      </NavLink>
      <div
        className={styles.navIcon}
        onClick={logout}
        style={{ cursor: "pointer" }}
      >
        🔒
      </div>
    </nav>
  );
};

export default MobileNav;
