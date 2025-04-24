import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import EventForm from "../../components/EventForm/EventForm";
import { Form } from "react-bootstrap";
import { resolveEventData } from "../../utils/eventUtils";

function groupEventDaysByWeek(eventDays) {
  const grouped = {};

  eventDays.forEach(({ week, dayId }) => {
    if (!grouped[week]) {
      grouped[week] = [];
    }
    grouped[week].push(dayId);
  });

  return grouped;
}

const EditEvent = ({ eventId, date }) => {
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [scope, setScope] = useState("event");

  const handleChange = (e) => {
    setScope(e.target.value);
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `http://localhost:5000/api/events/${eventId}?date=${date}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.message || "Chyba pri načítaní eventu");

        console.log(data.date);
        console.log(data.endDate);

        const newData = { ...data, ...resolveEventData(data, scope) };
        console.log(data);

        setInitialData({
          ...newData,

          startDate: newData.hasStartDate
            ? newData.date.split("T")[0]
            : undefined,
          startTime: newData.hasStartTime
            ? newData.startDate.split("T")[1]?.substring(0, 5)
            : undefined,
          endTime:
            newData.hasEndTime && newData.endDate
              ? newData.endDate.split("T")[1]?.substring(0, 5)
              : undefined,

          categoryIds: newData.categories.map((cat) => cat.id),

          previousMainImage: newData.mainImage,
          repeat: newData.repeatInterval > 0,
          repeatDays: groupEventDaysByWeek(newData.eventDays),
        });

        if (newData.repeatInterval === 0) {
          setScope("occurrence");
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchEvent();
  }, [eventId, scope]);

  console.log(initialData);

  const handleEdit = async (form) => {
    try {
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem("token");
      const formData = new FormData();

      const repeatDaysJSON = JSON.stringify(form.repeatDays);

      const entries = {
        ...form,
        moderators: form.moderators.map((mod) => JSON.stringify(mod)),
        repeatDays: repeatDaysJSON,
      };

      console.log(form);

      Object.entries(entries).forEach(([key, value]) => {
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

      formData.append("scope", scope); // napr. "event" alebo "eventDay"

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

  return (
    <>
      {initialData && (
        <EventForm
          initialData={initialData}
          onSubmit={handleEdit}
          heading="Upraviť akciu"
          submitLabel="Uložiť zmeny"
          successMessage={success}
          scope={scope}
        >
          {initialData.repeatInterval > 0 && (
            <Form.Group controlId="scopeSelect" className="mb-3">
              <Form.Label>Zmeniť pre</Form.Label>
              <Form.Select value={scope} onChange={handleChange}>
                <option value="event">Všetko</option>
                <option value="eventDay">Opakovaný deň</option>
                <option value="occurrence">Konkrétny dátum</option>
              </Form.Select>
            </Form.Group>
          )}
        </EventForm>
      )}
      {error && <p className="text-danger">{error}</p>}
    </>
  );
};

export default EditEvent;
