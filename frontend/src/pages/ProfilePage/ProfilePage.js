import MobileLayout from "../../layouts/MobileLayout";
import styles from "./ProfilePage.module.scss";

import { Button } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

const ProfilePage = () => {
  const { user, logout } = useAuth();

  return (
    <MobileLayout>
      <div className={styles.profilePage}>
        <h4 className={styles.heading}>Môj profil</h4>
        <div className={styles.info}>
          <p>
            <strong>Meno:</strong> {user?.firstName} {user?.lastName}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
        </div>

        <Button variant="danger" className="mt-4 w-100" onClick={logout}>
          Odhlásiť sa
        </Button>
      </div>
    </MobileLayout>
  );
};

export default ProfilePage;
