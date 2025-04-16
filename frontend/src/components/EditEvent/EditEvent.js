import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EventForm from "../../components/EventForm/EventForm";

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/events/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Chyba pri načítaní eventu");

        setInitialData({
          title: data.title,
          description: data.description,
          date: data.date.split("T")[0],
          startTime: data.time,
          endTime: data.endTime || "",
          location: data.location,
          capacity: data.capacity || "",
          categoryIds: data.categories.map((c) => c.id),
          moderators: data.moderators.map((m) => m.id),
          mainImage: null,
          gallery: [],
        });
      } catch (err) {
        setError(err.message);
      }
    };
    fetchEvent();
  }, [id]);

  const handleEdit = async (form) => {
    try {
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem("token");
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "categoryIds" || key === "moderators") {
          value.forEach((v) => formData.append(key, v));
        } else if (key === "gallery") {
          value.forEach((img) => formData.append("gallery", img));
        } else if (key === "mainImage" && value) {
          formData.append("mainImage", value);
        } else {
          formData.append(key, value);
        }
      });

      const res = await fetch(`http://localhost:5000/api/events/${id}/edit`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri editovaní");

      setSuccess("Akcia bola úspešne upravená.");
      navigate(`/events/${id}`);
    } catch (err) {
      setError(err.message);
      throw err; // Rethrow the error to be caught by the parent component
    }
  };

  return (
    <>
      {initialData && (
        <EventForm
          initialData={initialData}
          onSubmit={handleEdit}
          heading="Upraviť akciu"
          submitLabel="Uložiť zmeny"
          successMessage={success}
        />
      )}
      {error && <p className="text-danger">{error}</p>}
    </>
  );
};

export default EditEvent;
