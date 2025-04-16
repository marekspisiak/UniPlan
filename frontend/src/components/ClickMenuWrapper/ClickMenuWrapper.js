import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./ClickMenuWrapper.module.scss";
import { useNavigate } from "react-router-dom";

const ClickMenuWrapper = ({ user, children }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();

  const handleClickOutside = (e) => {
    const menu = document.getElementById("clickMenu");
    if (!menu || !menu.contains(e.target)) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setPosition({ top: e.clientY + window.scrollY, left: e.clientX });
    setShowMenu((prev) => !prev);
  };

  const handleProfileClick = () => {
    navigate(`/profile/${user.id}`);
    setShowMenu(false);
  };

  return (
    <>
      <div onClick={toggleMenu} className={styles.wrapper}>
        {children}
      </div>

      {showMenu &&
        createPortal(
          <div
            id="clickMenu"
            className={styles.menu}
            style={{
              top: position.top,
              left: position.left,
              position: "absolute",
            }}
          >
            <div className={styles.menuItem} onClick={handleProfileClick}>
              Zobraziť profil
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default ClickMenuWrapper;
