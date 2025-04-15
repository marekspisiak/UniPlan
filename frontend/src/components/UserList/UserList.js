import styles from "./UserList.module.scss";
import UserAvatar from "../UserAvatar/UserAvatar";
import ClickMenuWrapper from "../ClickMenuWrapper/ClickMenuWrapper";

const UserList = ({ users = [], header = "ahoj" }) => {
  return (
    <div>
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.list}>
        {users.map((user) => (
          <ClickMenuWrapper key={user.id} user={user}>
            <div key={user.id} className={styles.userItem}>
              <UserAvatar user={user} interactive={false} />
              <div className={styles.name}>
                {user.firstName} {user.lastName}
              </div>
              <div className={styles.email}>{user.email}</div>
            </div>
          </ClickMenuWrapper>
        ))}
      </div>
    </div>
  );
};

export default UserList;
