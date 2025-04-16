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
        console.log(data);
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
          mainImage: data.mainImage,
          gallery: data.gallery,
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
        if (key === "categoryIds" || key === "moderators") {
          value.forEach((v) => formData.append(key, v));
        } else if (key === "gallery") {
          value.forEach((img) => formData.append("gallery", img));
        } else if (key === "deletedGallery" && Array.isArray(value)) {
          value.forEach((url) => formData.append("deletedGallery", url));
        } else if (key === "mainImage" && value?.[0] instanceof File) {
          formData.append("mainImage", value[0]); // ⬅️ použijeme prvý súbor z poľa
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
        `http://localhost:5000/api/events/${eventId}/edit`,
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
