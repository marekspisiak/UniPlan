import { useParams } from "react-router-dom";
import { useState } from "react";
import MobileLayout from "../../layouts/MobileLayout";
import EditProfileCard from "../../components/EditProfileCard/EditProfileCard";
import ViewProfileCard from "../../components/ViewProfileCard/ViewProfileCard";
import ChangePasswordForm from "../../components/ChangePasswordForm/ChangePasswordForm ";

const ProfilePage = () => {
  const { userId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  return (
    <MobileLayout>
      {isEditing ? (
        <EditProfileCard
          userId={userId}
          setIsEditing={(p) => setIsEditing(p)}
        />
      ) : isChangingPassword ? (
        <ChangePasswordForm
          userId={userId}
          setIsChangingPassword={(p) => setIsChangingPassword(p)}
        />
      ) : (
        <ViewProfileCard
          userId={userId}
          setIsEditing={(p) => setIsEditing(p)}
          setIsChangingPassword={(p) => setIsChangingPassword(p)}
        />
      )}
    </MobileLayout>
  );
};

export default ProfilePage;
