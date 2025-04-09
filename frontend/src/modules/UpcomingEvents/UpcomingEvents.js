import { Card, ListGroup } from "react-bootstrap";
import styles from "./UpcomingEvents.module.scss";

const UpcomingEvents = () => {
  const events = [
    { title: "Stretnutie AI tímu", date: "2025-04-10", time: "14:00" },
    { title: "Workshop UX dizajnu", date: "2025-04-12", time: "10:00" },
    { title: "Prezentácia projektov", date: "2025-04-15", time: "09:30" },
  ];

  return (
    <Card className={styles.upcomingEvents}>
      <Card.Body>
        <h5 className={styles.title}>Blížiace sa akcie</h5>
        <ListGroup variant="flush">
          {events.map((event, index) => (
            <ListGroup.Item key={index} className={styles.item}>
              <div className={styles.eventTitle}>{event.title}</div>
              <div className={styles.eventDatetime}>
                {event.date} o {event.time}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default UpcomingEvents;
