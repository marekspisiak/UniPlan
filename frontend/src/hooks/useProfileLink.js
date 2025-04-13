import { useAuth } from "../context/AuthContext";

export const useProfileLink = () => {
  const { user } = useAuth();

  const getLink = (targetUserId) => {
    const finalId = targetUserId || user?.id;
    return `/profile/${finalId}`;
  };

  return getLink;
};
