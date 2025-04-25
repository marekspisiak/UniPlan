import { Card, Button, Spinner, Alert } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "./ViewProfileCard.module.scss";

const ProfileCard = ({ userId, setIsEditing }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const isOwner = user?.id == userId;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`/api/user/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Chyba pri načítaní profilu.");
        setProfile(data);
      } catch (err) {
        setError(err.message);
      }
    };

    loadProfile();
  }, [userId]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!profile) return <Spinner animation="border" />;

  console.log(profile);

  return (
    <Card className={styles.card}>
      <img
        src={`/uploads/profile/user_${profile.id}.png`}
        alt="Profil"
        className={styles.avatar}
      />
      <div className={styles.name}>
        {profile.firstName} {profile.lastName}
      </div>
      <div className={styles.email}>{profile.email}</div>

      {profile.interests?.length > 0 && (
        <div className={styles.interests}>
          {profile.interests.map((interest) => (
            <span key={interest.id} className={styles.interest}>
              {interest.icon && (
                <span className={styles.icon}>{interest.icon}</span>
              )}
              {interest.label}
            </span>
          ))}
        </div>
      )}

      {isOwner && (
        <Button
          variant="outline-primary"
          className={styles.editButton}
          onClick={() => setIsEditing(true)}
        >
          Upraviť profil
        </Button>
      )}
    </Card>
  );
};

export default ProfileCard;
