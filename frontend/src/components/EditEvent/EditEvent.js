import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EventForm from "../../components/EventForm/EventForm";

const EditEvent = ({ eventId }) => {
  const navigate = useNavigate();
  console.log(eventId);
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
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
          categoryIds: data.categories.map((cat) => cat.id),
          moderators: data.moderators,
          mainImage: data.mainImage,
          gallery: data.gallery,
          id: data.id,
        });
      } catch (err) {
        setError(err.message);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleEdit = async (form) => {
    try {
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem("token");
      const formData = new FormData();

      console.log(form);

      Object.entries(form).forEach(([key, value]) => {
        if (key === "categoryIds") {
          value.forEach((cat) => {
            formData.append("categoryIds", cat); // ⬅️ iba id
          });
        } else if (key === "moderators") {
          value.forEach((mod) => {
            formData.append("moderators", JSON.stringify(mod)); // ⬅️ celý objekt
          });
        } else if (key === "gallery") {
          value.forEach((img) => formData.append("gallery", img));
        } else if (key === "mainImage" && value) {
          formData.append("mainImage", value[0]);
        } else {
          formData.append(key, value);
        }
      });

      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [file] ${value.name}`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const res = await fetch(
        `http://localhost:5000/api/events/${eventId}/edit-details`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri editovaní");

      setSuccess("Akcia bola úspešne upravená.");
      navigate(`/event/${eventId}`);
    } catch (err) {
      setError(err.message);
      throw err; // Rethrow the error to be caught by the parent component
    }
  };

  console.log(initialData);

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
