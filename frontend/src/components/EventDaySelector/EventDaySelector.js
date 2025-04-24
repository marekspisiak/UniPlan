import React, { useState, useEffect } from "react";
import styles from "./EventDaySelector.module.scss";
import { useAuth } from "../../context/AuthContext";
import { Button, Alert, Spinner } from "react-bootstrap";

const EventDaySelector = ({ eventId, eventDays }) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  console.log(selected);

  useEffect(() => {
    if (!user) return;

    const preselected = eventDays
      .filter((ed) => ed.users.some((u) => u.id === user.id))
      .map((ed) => ed.id);

    setSelected(preselected);
  }, [eventDays, user]);

  const toggle = (eventDayId) => {
    setSelected((prev) =>
      prev.includes(eventDayId)
        ? prev.filter((id) => id !== eventDayId)
        : [...prev, eventDayId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:5000/api/events/${eventId}/attend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ eventDayIds: selected }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri prihlasovaní.");

      setMessage("Úspešne prihlásený na vybrané dni.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h5>Vyber dni, na ktoré sa chceš prihlásiť:</h5>
      {eventDays.map((ed) => (
        <label key={ed.id} className={styles.checkbox}>
          <input
            type="checkbox"
            checked={selected.includes(ed.id)}
            onChange={() => toggle(ed.id)}
          />
          {`${ed.day.name} (Týždeň ${ed.week + 1})`}
        </label>
      ))}

      {message && (
        <Alert variant="success" className="mt-2">
          {message}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="mt-2">
          {error}
        </Alert>
      )}

      <Button onClick={handleSubmit} disabled={loading} className="mt-3">
        {loading ? <Spinner animation="border" size="sm" /> : "Potvrdiť výber"}
      </Button>
    </div>
  );
};

export default EventDaySelector;
