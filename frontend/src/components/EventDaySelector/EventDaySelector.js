import React, { useState, useEffect } from "react";
import styles from "./EventDaySelector.module.scss";
import { useAuth } from "../../context/AuthContext";
import { Button, Spinner, Table, Container, Card, Form } from "react-bootstrap";
import Toast from "../Toast/Toast";
import { Users } from "lucide-react";

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
    <Container className="my-4">
      <Card>
        <Card.Body className="border-none">
          <Card.Title>Vyber dni, na ktoré sa chceš prihlásiť</Card.Title>

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
                    const shouldDisable =
                      isFull || (reachedLimit && !isSelected);

                    return (
                      <tr key={ed.id}>
                        <td>{`${ed.day.name} (Týždeň ${ed.week + 1})`}</td>
                        <td>
                          {maxCapacity !== null && (
                            <span className="d-flex align-items-center gap-1">
                              <Users size={16} /> {currentCount}/{maxCapacity}
                            </span>
                          )}
                        </td>
                        <td>
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
            <p className="text-muted mt-2">
              Môžeš sa prihlásiť maximálne na <strong>{attendancyLimit}</strong>{" "}
              dní. Vybrané: <strong>{selected.length}</strong>
            </p>
          )}

          {error && <Toast error={error} onClose={() => setError("")} />}
          {message && (
            <Toast success={message} onClose={() => setMessage("")} />
          )}

          <div className="d-flex justify-content-end mt-3">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Potvrdiť výber"
              )}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EventDaySelector;
