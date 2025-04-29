import { useEffect, useState } from "react";
import { useParams, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "react-bootstrap/Spinner";
import { Container } from "react-bootstrap";

const EditableEventRoute = () => {
  const { id, date } = useParams(); // /events/:id/edit
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const res = await fetch(`/api/events/${id}?date=${date}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();

        if (
          data.organizer?.id === user?.id ||
          data.moderators?.some((m) => m.id === user?.id)
        ) {
          setCanEdit(true);
        }
      } catch (err) {
        console.error("Chyba pri kontrole prístupu na editovanie", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) checkPermission();
    else setLoading(false);
  }, [id, user]);

  if (loading)
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "50vh" }}
      >
        <Spinner animation="border" />
      </Container>
    );
  if (!canEdit) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default EditableEventRoute;
