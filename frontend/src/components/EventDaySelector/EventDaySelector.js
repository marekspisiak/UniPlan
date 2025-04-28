import React, { useState, useEffect } from "react";
import styles from "./EventDaySelector.module.scss";
import { useAuth } from "../../context/AuthContext";
import { Button, Alert, Spinner, Container } from "react-bootstrap";
import Toast from "../Toast/Toast";
import { Users } from "lucide-react";

const EventDaySelector = ({
  eventId,
  eventDays,
  capacity: eventCapacity,
  fetchEvent,
}) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  console.log(eventDays);

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
      const res = await fetch(`/api/events/${eventId}/attend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ eventDayIds: selected }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri prihlasovaní.");

      setMessage("Úspešne prihlásený na vybrané dni.");
      fetchEvent();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h5>Vyber dni, na ktoré sa chceš prihlásiť:</h5>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Deň</th>
              <th>Kapacita</th>
              <th>Výber</th>
            </tr>
          </thead>
          <tbody>
            {eventDays
              .slice() // urobíme kopiu, aby sme nemenili pôvodné pole
              .sort((a, b) => {
                if (a.week !== b.week) {
                  return a.week - b.week;
                }
                return a.day.id - b.day.id;
              })
              .map((ed) => {
                const currentCount = ed.users.length;
                const maxCapacity =
                  ed.eventChange?.capacity ?? eventCapacity ?? null;
                const isFull =
                  maxCapacity !== null && currentCount >= maxCapacity;

                return (
                  <tr key={ed.id}>
                    <td>{`${ed.day.name} (Týždeň ${ed.week + 1})`}</td>
                    <td>
                      {maxCapacity !== null ? (
                        <span className={styles.capacity}>
                          <Users size={16} className={styles.icon} />{" "}
                          {currentCount}/{maxCapacity}
                        </span>
                      ) : (
                        ""
                      )}
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(ed.id)}
                        onChange={() => toggle(ed.id)}
                        disabled={isFull}
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {error && <Toast error={error} onClose={() => setError("")} />}
      {message && <Toast success={message} onClose={() => setMessage("")} />}

      <Button onClick={handleSubmit} disabled={loading} className="mt-3">
        {loading ? <Spinner animation="border" /> : "Potvrdiť výber"}
      </Button>
    </div>
  );
};

export default EventDaySelector;
