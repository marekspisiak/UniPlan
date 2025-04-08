import { NavLink } from "react-router-dom";
import "./MobileNav.scss";

const MobileNav = () => {
  return (
    <nav className="mobile-nav">
      <NavLink to="/" className="nav-icon">
        🏠
      </NavLink>
      <NavLink to="/calendar" className="nav-icon">
        📅
      </NavLink>
      <NavLink to="/chat" className="nav-icon">
        💬
      </NavLink>
      <NavLink to="/profile" className="nav-icon">
        👤
      </NavLink>
    </nav>
  );
};

export default MobileNav;
