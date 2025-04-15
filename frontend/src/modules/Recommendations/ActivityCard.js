import { useState } from "react";
import { Card, Button } from "react-bootstrap";
import styles from "./ActivityCard.module.scss";
import Popup from "../../components/Popup/Popup";
import EventDetail from "../EventDetail/EventDetail";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import UserList from "../../components/UserList/UserList";
import { User } from "lucide-react";

const ActivityCard = ({ activity }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Card className={styles.card}>
      <Card.Body>
        <div className={styles.header}>
          <h5 className={styles.title}>{activity.title}</h5>
          <div className={styles.datetime}>
            {activity.date} o {activity.time}
          </div>
        </div>
        <div className={styles.location}>{activity.location}</div>
        <p className={styles.description}>{activity.description}</p>
        <Button variant="primary" className={styles.button}>
          Zúčastniť sa
        </Button>
        <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <UserList
            users={[
              activity.organizer,
              activity.organizer,
              activity.organizer,
              activity.organizer,
              activity.organizer,
              activity.organizer,
              activity.organizer,
              activity.organizer,
              activity.organizer,
              activity.organizer,
              activity.organizer,
              activity.organizer,
              activity.organizer,
              activity.organizer,
            ]}
          />
        </Popup>
        <Button
          onClick={() => setIsOpen(true)}
          variant="link"
          className={styles.detailsButton}
        >
          Text
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ActivityCard;
