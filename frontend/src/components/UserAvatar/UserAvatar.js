import { useState, useRef, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import styles from "./UserAvatar.module.scss";

const UserAvatar = ({ user, size = "normal" }) => {
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

  const sizeClass = size === "mini" ? styles.mini : styles.normal;

  return (
    <div ref={avatarRef} className={styles.avatarWrapper}>
      <img
        src={`http://localhost:5000/uploads/profile/user_${user.id}.png`}
        alt="Avatar"
        className={`${styles.avatar} ${sizeClass}`}
        onClick={() => setShowMenu((prev) => !prev)}
      />

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

export default UserAvatar;
