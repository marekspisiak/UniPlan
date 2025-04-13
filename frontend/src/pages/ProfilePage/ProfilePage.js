import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ViewProfile from "./ViewProfile";
import EditProfile from "./EditProfile";
import MobileLayout from "../../layouts/MobileLayout";

const ProfilePage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const isOwnProfile = !id || Number(id) === user?.id;

  return (
    <MobileLayout>
      <ViewProfile userId={id} />
    </MobileLayout>
  );
};

export default ProfilePage;
