import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button, Spinner, Table, Container, Form } from "react-bootstrap";
import Toast from "../Toast/Toast";
import { Users } from "lucide-react";
import LoadingButton from "../LoadingButton/LoadingButton";
import { isObjectLike } from "lodash";

const EventDaySelector = ({
  eventId,
  eventDays,
  capacity: eventCapacity,
  fetchEvent,
  attendancyLimit,
}) => {
  const { user } = useAuth();
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

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

  const reachedLimit = attendancyLimit && selected.length >= attendancyLimit;

  return (
    <Container className="mt-3">
      <h2 className="fs-4 fw-semibold mb-3">
        Vyber dni, na ktoré sa chceš prihlásiť
      </h2>

      <div className="table-responsive">
        <Table hover bordered className="align-middle mt-3">
          <thead className="table-light">
            <tr>
              <th>Deň</th>
              <th>Kapacita</th>
              <th>Výber</th>
            </tr>
          </thead>
          <tbody>
            {eventDays
              .slice()
              .sort((a, b) =>
                a.week !== b.week ? a.week - b.week : a.day.id - b.day.id
              )
              .map((ed) => {
                const currentCount = ed.users.length;
                const maxCapacity =
                  ed.eventChange?.capacity ?? eventCapacity ?? null;
                const isFull =
                  maxCapacity !== null && currentCount >= maxCapacity;

                const isSelected = selected.includes(ed.id);
                const shouldDisable = isFull || (reachedLimit && !isSelected);

                return (
                  <tr key={ed.id}>
                    <td className="text-start">
                      {`${ed.day.name} (Týždeň ${ed.week + 1})`}
                    </td>
                    <td>
                      {maxCapacity !== null && (
                        <span className="d-flex align-items-center justify-content-center gap-1 fw-medium">
                          <Users size={16} /> {currentCount}/{maxCapacity}
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(ed.id)}
                        disabled={shouldDisable}
                      />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      </div>

      {attendancyLimit && (
        <p className="text-muted mt-2 small text-center">
          Môžeš sa prihlásiť maximálne na <strong>{attendancyLimit}</strong>{" "}
          dní. Vybrané: <strong>{selected.length}</strong>
        </p>
      )}

      {error && <Toast error={error} onClose={() => setError("")} />}
      {message && <Toast success={message} onClose={() => setMessage("")} />}

      <div className="d-flex justify-content-end mt-4">
        <LoadingButton onClick={handleSubmit} loading={loading}>
          Potvrdiť výber
        </LoadingButton>
      </div>
    </Container>
  );
};

export default EventDaySelector;
