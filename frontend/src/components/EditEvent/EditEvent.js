import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import EventForm from "../../components/EventForm/EventForm";
import { Form } from "react-bootstrap";
import { fixNumbers, isEmpty, resolveEventData } from "../../utils/eventUtils";
import { Watch } from "lucide-react";

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
        const res = await fetch(`/api/events/${eventId}?date=${date}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        console.log(data);

        if (!res.ok)
          throw new Error(data.message || "Chyba pri načítaní eventu");

        const newData = { ...data, ...resolveEventData(data, scope) };

        const cleanedData = {};

        console.log(data);

        for (const key in newData) {
          if (Object.prototype.hasOwnProperty.call(newData, key)) {
            cleanedData[key] = isEmpty(newData[key]) ? "" : newData[key];
          }
        }
        setInitialData({
          ...cleanedData,

          categoryIds: newData.categories.map((cat) => cat.id),

          repeat: newData.repeatInterval > 0,
          repeatDays: groupEventDaysByWeek(newData.eventDays),
          repeatUntil: isEmpty(newData.repeatUntil)
            ? ""
            : newData.repeatUntil.split("T")[0],
          previousMainImage: newData.mainImage,
          capacity: fixNumbers(newData.capacity),
          attendancyLimit: fixNumbers(newData.attendancyLimit),

          joinDaysBeforeStart: fixNumbers(newData.joinDaysBeforeStart),
          repeatInterval: fixNumbers(newData.repeatInterval),
        });

        if (fixNumbers(newData.repeatInterval) === "") {
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

      console.log(console.log(initialData));

      const token = localStorage.getItem("token");
      const formData = new FormData();

      const eventChange = [
        "title",
        "description",
        "startTime",
        "endTime",
        "repeatUntil",
        "repeatDays",
        "location",
        "capacity",
        "joinDaysBeforeStart",
        "categoryIds",
        "mainImage",
        "mainImageChanged",
        "previousMainImage",
        "deletedGallery",
        "gallery",
        "attendancyLimit",
      ];

      const eventDayChange = [
        "title",
        "description",
        "startTime",
        "endTime",
        "location",
        "capacity",
        "joinDaysBeforeStart",
      ];

      const eventOccurrenceChange = [
        "title",
        "description",
        "startDate",
        "startTime",
        "endTime",
        "location",
        "capacity",
        "joinDaysBeforeStart",
      ];

      const eventSingleChange = [
        "title",
        "description",
        "startDate",
        "startTime",
        "endTime",
        "location",
        "capacity",
        "joinDaysBeforeStart",
        "categoryIds",
        "mainImage",
        "mainImageChanged",
        "previousMainImage",
        "deletedGallery",
        "gallery",
      ];

      let keysToUse = [];

      if (scope === "event") {
        keysToUse = eventChange;
      } else if (scope === "eventDay") {
        keysToUse = eventDayChange;
      } else if (scope === "occurrence" && initialData.repeatInterval === "") {
        keysToUse = eventSingleChange;
      } else if (scope === "occurrence") {
        keysToUse = eventOccurrenceChange;
      }

      const filtered = {};

      console.log(form);

      for (const key of keysToUse) {
        console.log(key);
        console.log(form[key]);
        console.log(initialData[key]);
        console.log(form[key] !== initialData[key]);
        console.log(key in form);

        if (key in form && form[key] !== initialData[key]) {
          console.log("pridavam", key);
          filtered[key] = form[key];
        }
      }

      console.log(filtered);

      const entries = {
        ...filtered,
        id: initialData.id,
        date: initialData.date,
        previousMainImage: initialData.previousMainImage,
        eventDayId: initialData.eventDayId,
        repeatInterval:
          initialData.repeatInterval === "" ? 0 : initialData.repeatInterval,
      };
      console.log(entries);
      console.log(form);

      Object.entries(entries).forEach(([key, value]) => {
        if (key === "categoryIds") {
          value.forEach((cat) => {
            formData.append("categoryIds", cat); // ⬅️ iba id
          });
        } else if (key === "repeatDays") {
          formData.append("repeatDays", JSON.stringify(filtered.repeatDays));
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

      const res = await fetch(`/api/events/${eventId}/edit-details`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri editovaní");

      setSuccess("Akcia bola úspešne upravená.");
      navigate(`/event/${eventId}/${initialData.date}`);
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
          heading="Upraviť event"
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
    </>
  );
};

export default EditEvent;
