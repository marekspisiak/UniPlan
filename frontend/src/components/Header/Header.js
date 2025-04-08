import "./Header.scss";

const Header = () => {
  return (
    <header className="header">
      <div className="header__content">
        <div className="header__logo">📘 UniPlan</div>
        {/* Prípadné ikony vpravo napr. <div className="header__right">👤</div> */}
      </div>
    </header>
  );
};

export default Header;
