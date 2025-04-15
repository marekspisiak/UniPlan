import { useEffect, useState } from "react";
import { Spinner, Alert, Button } from "react-bootstrap";
import styles from "./EventDetail.module.scss";

const EventDetail = ({ event, eventId }) => {
  const [data, setData] = useState(event || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (event || !eventId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        setData(json);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [event, eventId]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return <Spinner animation="border" />;

  const { title, description, date, time, location, categories, organizer } =
    data;

  return (
    <div className={styles.container}>
      <h5 className={styles.title}>{title}</h5>
      <div className={styles.info}>
        <p>
          <strong>Dátum:</strong> {new Date(date).toLocaleDateString()}
        </p>
        <p>
          <strong>Čas:</strong> {time}
        </p>
        <p>
          <strong>Miesto:</strong> {location}
        </p>
        {description && <p>{description}</p>}
        {categories?.length > 0 && (
          <p>
            {categories.map((cat) => (
              <span key={cat.id} className={styles.category}>
                {cat.icon} {cat.label}
              </span>
            ))}
          </p>
        )}
        <p>
          <strong>Organizátor:</strong> {organizer.firstName}{" "}
          {organizer.lastName}
        </p>
      </div>

      <Button variant="primary" className="w-100 mt-3">
        Zaregistrovať sa
      </Button>
    </div>
  );
};

export default EventDetail;
