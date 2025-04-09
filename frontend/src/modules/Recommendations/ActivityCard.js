import { Card, Button } from "react-bootstrap";
import styles from "./ActivityCard.module.scss";

const ActivityCard = ({ activity }) => {
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
      </Card.Body>
    </Card>
  );
};

export default ActivityCard;
