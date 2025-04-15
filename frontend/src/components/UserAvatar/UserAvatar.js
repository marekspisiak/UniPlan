import { useState, useRef, useEffect } from "react";
import { Dropdown } from "react-bootstrap";
import styles from "./UserAvatar.module.scss";
import ClickMenuWrapper from "../ClickMenuWrapper/ClickMenuWrapper";

const UserAvatar = ({ user, size = "normal", interactive = false }) => {
  const sizeClass = size === "mini" ? styles.mini : styles.normal;

  if (!interactive) {
    return (
      <img
        src={`http://localhost:5000/uploads/profile/user_${user.id}.png`}
        alt="Avatar"
        className={`${styles.avatar} ${sizeClass}`}
      />
    );
  }
  return (
    <ClickMenuWrapper user={user}>
      <img
        src={`http://localhost:5000/uploads/profile/user_${user.id}.png`}
        alt="Avatar"
        className={`${styles.avatar} ${sizeClass}`}
      />
    </ClickMenuWrapper>
  );
};

export default UserAvatar;
