import styles from "./UserList.module.scss";
import UserAvatar from "../UserAvatar/UserAvatar";
import ClickMenuWrapper from "../ClickMenuWrapper/ClickMenuWrapper";

const UserList = ({ users = [], header = "", onDelete }) => {
  return (
    <div>
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.list}>
        {users.map((user) => (
          <div className="d-flex align-items-center justify-content-center">
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
                className="btn btn-sm text-danger bg-transparent border-0 p-0 ms-2"
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
