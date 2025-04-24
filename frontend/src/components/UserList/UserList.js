import styles from "./UserList.module.scss";
import UserAvatar from "../UserAvatar/UserAvatar";
import ClickMenuWrapper from "../ClickMenuWrapper/ClickMenuWrapper";

const UserList = ({ users = [], header = "", onDelete }) => {
  return (
    <div>
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.list}>
        {users.map((user) => (
          <div className="d-flex">
            <ClickMenuWrapper key={user.id} user={user}>
              <div className={styles.userItem}>
                <UserAvatar user={user} interactive={false} />
                <div className={styles.name}>
                  {user.firstName} {user.lastName}
                </div>
                <div className={styles.email}>{user.email}</div>
              </div>
            </ClickMenuWrapper>
            {onDelete && (
              <button
                className="border border-none background-none"
                onClick={() => onDelete({ userId: user.id })}
                title="Odstrániť používateľa"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;
