import { Link, NavLink } from "react-router-dom";
import styles from "./MobileNav.module.scss";
import { useProfileLink } from "../../hooks/useProfileLink";
import { useAuth } from "../../context/AuthContext";
import { Plus } from "lucide-react";

const MobileNav = () => {
  const { logout } = useAuth();
  const getProfileLink = useProfileLink();
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
        💬
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
