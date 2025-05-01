import EventForm from "../../components/EventForm/EventForm";
import { useState } from "react";

const CreateEvent = () => {
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleCreateEvent = async (form) => {
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // repeatDays je už vo formáte: { 0: [1, 3], 1: [4] }
      const repeatDaysJSON = JSON.stringify(form.repeatDays);

      const entries = {
        ...form,
        moderators: form.moderators.map((mod) => JSON.stringify(mod)),
        repeatDays: repeatDaysJSON,
      };

      // Odstráni všetky "" hodnoty (prázdne stringy)
      const cleanedEntries = Object.fromEntries(
        Object.entries(entries).filter(
          ([_, value]) =>
            !(typeof value === "string" && value.trim() === "") &&
            !(Array.isArray(value) && value.every((v) => v === ""))
        )
      );

      Object.entries(cleanedEntries).forEach(([key, value]) => {
        if (key === "categoryIds") {
          value.forEach((cat) => {
            formData.append("categoryIds", cat); // ⬅️ iba id
          });
        } else if (key === "gallery" && Array.isArray(value)) {
          value.forEach((img) => formData.append("gallery", img));
        } else if (key === "moderators") {
          value.forEach((mod) => formData.append("moderators", mod));
        } else if (key === "mainImage" && value) {
          formData.append("mainImage", value[0]);
        } else {
          if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        }
      });

      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Nepodarilo sa vytvoriť akciu");
      }

      setSuccess("Akcia bola úspešne vytvorená.");
    } catch (err) {
      setError(err.message);
      throw err;
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
