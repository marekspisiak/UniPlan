import { NavLink } from "react-router-dom";
import styles from "./MobileNav.module.scss";
import { useProfileLink } from "../../hooks/useProfileLink";

const MobileNav = () => {
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
        to="/calendar"
        className={({ isActive }) =>
          `${styles.navIcon} ${isActive ? styles.active : ""}`
        }
      >
        📅
      </NavLink>
      <NavLink
        to="/chat"
        className={({ isActive }) =>
          `${styles.navIcon} ${isActive ? styles.active : ""}`
        }
      >
        💬
      </NavLink>
      <NavLink
        to={getProfileLink()}
        className={({ isActive }) =>
          `${styles.navIcon} ${isActive ? styles.active : ""}`
        }
      >
        👤
      </NavLink>
    </nav>
  );
};

export default MobileNav;
