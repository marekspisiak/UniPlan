import "./Header.scss";
import UserMenu from "../UserMenu/UserMenu";

const Header = ({ minimal = false }) => {
  return (
    <header className={`header ${minimal ? "header--minimal" : ""}`}>
      <div className="header__content">
        <div className="header__logo">📘 UniPlan</div>

        {!minimal && (
          <div className="header__right d-none d-md-block">
            <UserMenu />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
