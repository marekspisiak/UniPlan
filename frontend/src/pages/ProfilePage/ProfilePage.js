import MobileLayout from "../../layouts/MobileLayout";
import "./ProfilePage.scss";

import { Button } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

const ProfilePage = () => {
  const { user, logout } = useAuth();

  return (
    <MobileLayout>
      <div className="profile-page">
        <h4>Môj profil</h4>
        <div className="profile-info">
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
