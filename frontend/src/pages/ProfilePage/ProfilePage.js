import MobileLayout from "../../layouts/MobileLayout";
import "./ProfilePage.scss";

const ProfilePage = () => {
  return (
    <MobileLayout>
      <div className="profile-page">
        <h4>Môj profil</h4>
        <div className="profile-info">
          <p>
            <strong>Meno:</strong> Ján Študent
          </p>
          <p>
            <strong>Email:</strong> jan.student@uniza.sk
          </p>
          <p>
            <strong>Študijný program:</strong> Informatika
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ProfilePage;
