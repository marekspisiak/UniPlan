import { NavLink } from "react-router-dom";
import styles from "./MobileNav.module.scss";

const MobileNav = () => {
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
        to="/profile"
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
