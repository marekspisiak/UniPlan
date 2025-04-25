import { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import styles from "./UserAvatar.module.scss";
import ClickMenuWrapper from "../ClickMenuWrapper/ClickMenuWrapper";

const UserAvatar = ({
  user: providedUser,
  userId,
  size = "normal",
  interactive = false,
}) => {
  const [user, setUser] = useState(providedUser || null);
  const [loading, setLoading] = useState(!providedUser);

  useEffect(() => {
    const fetchUser = async () => {
      if (!providedUser && userId) {
        try {
          const res = await fetch(`/api/user/${userId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          const data = await res.json();
          if (res.ok) setUser(data);
        } catch (err) {
          console.error("Chyba pri načítaní používateľa:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUser();
  }, [providedUser, userId]);

  const sizeClass = size === "mini" ? styles.mini : styles.normal;

  if (loading) {
    return <Spinner size="sm" />;
  }

  if (!user) {
    return null;
  }

  const avatarImg = (
    <img
      src={`/uploads/profile/user_${user.id}.png`}
      alt="Avatar"
      className={`${styles.avatar} ${sizeClass}`}
    />
  );

  if (!interactive) {
    return avatarImg;
  }

  return <ClickMenuWrapper user={user}>{avatarImg}</ClickMenuWrapper>;
};

export default UserAvatar;
