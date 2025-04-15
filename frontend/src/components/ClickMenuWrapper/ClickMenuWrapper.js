import { useState, useRef, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import styles from "./ClickMenuWrapper.module.scss";

const ClickMenuWrapper = ({ user, children }) => {
  const [showMenu, setShowMenu] = useState(false);
  const avatarRef = useRef(null);

  const handleClickOutside = (e) => {
    if (avatarRef.current && !avatarRef.current.contains(e.target)) {
      setShowMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={avatarRef}
      className={styles.avatarWrapper}
      onClick={() => setShowMenu((prev) => !prev)}
    >
      {children}
      {showMenu && (
        <div className={styles.menu}>
          <div
            className={styles.menuItem}
            onClick={() => alert("Zobraziť profil")}
          >
            Zobraziť profil
          </div>
          {/* Môžeš pridať aj ďalšie akcie */}
        </div>
      )}
    </div>
  );
};

export default ClickMenuWrapper;
