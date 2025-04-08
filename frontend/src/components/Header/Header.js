import "./Header.scss";

const Header = ({ minimal = false }) => {
  return (
    <header className={`header ${minimal ? "header--minimal" : ""}`}>
      <div className="header__content">
        <div className="header__logo">📘 UniPlan</div>
        {!minimal && (
          <div className="header__right">
            {/* napr. profil, notifikácie, menu... */}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
