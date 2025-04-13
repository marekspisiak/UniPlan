import { useParams } from "react-router-dom";
import { useState } from "react";
import MobileLayout from "../../layouts/MobileLayout";
import EditProfileCard from "../../components/EditProfileCard/EditProfileCard";
import ViewProfileCard from "../../components/ViewProfileCard/ViewProfileCard";

const ProfilePage = () => {
  const { userId } = useParams();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <MobileLayout>
      {isEditing ? (
        <EditProfileCard userId={userId} setIsEditing={setIsEditing} />
      ) : (
        <ViewProfileCard userId={userId} setIsEditing={setIsEditing} />
      )}
    </MobileLayout>
  );
};

export default ProfilePage;
