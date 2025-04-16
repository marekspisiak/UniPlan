import { useState } from "react";
import styles from "./UserAvatarList.module.scss";
import UserList from "../UserList/UserList";
import Popup from "../Popup/Popup";
import UserAvatar from "../UserAvatar/UserAvatar";

const UserAvatarList = ({
  users = [],
  maxVisible = 4,
  header = "Všetci užívatelia",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const visibleUsers = users.slice(0, maxVisible);
  const extraCount = users.length - maxVisible;

  return (
    <>
      <div className={styles.avatarList}>
        {visibleUsers.map((user) => (
          <UserAvatar key={user.id} user={user} size="mini" interactive />
        ))}
        {extraCount > 0 && (
          <div className={styles.extra} onClick={() => setIsOpen(true)}>
            +{extraCount}
          </div>
        )}
      </div>

      <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <UserList users={users} header={header} />
      </Popup>
    </>
  );
};

export default UserAvatarList;
