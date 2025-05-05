import { Card, Button, Spinner, Alert, Container } from "react-bootstrap";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "./ViewProfileCard.module.scss";
import CategoryList from "../CategoryList/CategoryList";

const ProfileCard = ({ userId, setIsEditing, setIsChangingPassword }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const isOwner = user?.id == userId;

  useEffect(() => {
    const loadProfile = async () => {
      console.log("nacitavam");
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
  }, []);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!profile)
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "50vh" }}
      >
        <Spinner animation="border" />
      </Container>
    );

  console.log(profile);

  return (
    <Card className={styles.card}>
      <img
        src={profile.profileImageUrl || "/assets/default-avatar.png"}
        alt="Profil"
        className={styles.avatar}
      />
      <div className={styles.name}>
        {profile.firstName} {profile.lastName}
      </div>
      <div className={styles.email}>{profile.email}</div>

      <CategoryList center categories={profile?.interests} />

      {isOwner && (
        <>
          <Button
            variant="primary"
            className={styles.editButton}
            onClick={() => setIsEditing(true)}
          >
            Upraviť profil
          </Button>
          <Button
            variant="outline-primary mt-3 "
            className={styles.changePasswordButton}
            onClick={() => setIsChangingPassword(true)}
          >
            Zmeniť heslo
          </Button>
        </>
      )}
    </Card>
  );
};

export default ProfileCard;
