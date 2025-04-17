// CreateEvent.js
import EventForm from "../../components/EventForm/EventForm";
import { useState, useRef } from "react";

const CreateEvent = () => {
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleCreateEvent = async (form) => {
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      console.log(form);

      Object.entries(form).forEach(([key, value]) => {
        if (key === "categoryIds") {
          value.forEach((v) => formData.append(key, v));
        } else if (key === "moderators") {
          value.forEach((mod) => {
            formData.append("moderators", JSON.stringify(mod));
          });
        } else if (key === "gallery") {
          value.forEach((img) => formData.append("gallery", img));
        } else if (key === "mainImage" && value) {
          formData.append("mainImage", value);
        } else {
          formData.append(key, value);
        }
      });

      const res = await fetch("http://localhost:5000/api/events/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Nepodarilo sa vytvoriť akciu");
      }

      setSuccess("Akcia bola úspešne vytvorená.");
    } catch (err) {
      setError(err.message);
      throw err; // Rethrow the error to be caught by the parent component
    }
  };

  return (
    <EventForm
      onSubmit={handleCreateEvent}
      heading="Vytvoriť novú akciu"
      submitLabel="Vytvoriť"
      successMessage={success}
      errorMessage={error}
    />
  );
};

export default CreateEvent;
