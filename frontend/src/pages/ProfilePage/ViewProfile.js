import { useEffect, useState } from "react";
import { Spinner, Alert } from "react-bootstrap";

const ViewProfile = ({ userId }) => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/user/${userId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await res.json();

        console.log(data);

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

  return (
    <div>
      <h4>
        {profile.firstName} {profile.lastName}
      </h4>
      <p>
        <strong>Email:</strong> {profile.email}
      </p>
      {/* zobraz záujmy a fotku */}
      <img
        src={`http://localhost:5000/uploads/profile/user_${profile.id}.png`}
        alt="Profil"
        width="150"
      />
    </div>
  );
};

export default ViewProfile;
