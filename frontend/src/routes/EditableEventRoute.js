import { useEffect, useState } from "react";
import { useParams, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "react-bootstrap/Spinner";

const EditableEventRoute = () => {
  const { id } = useParams(); // /events/:id/edit
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/events/${id}`, {
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

  if (loading) return <Spinner animation="border" />;
  if (!canEdit) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default EditableEventRoute;
