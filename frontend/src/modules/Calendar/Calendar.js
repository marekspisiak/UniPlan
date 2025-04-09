import { Card } from "react-bootstrap";
import styles from "./Calendar.module.scss";

const Calendar = () => {
  return (
    <Card className={styles.calendar}>
      <Card.Body>
        <h5 className={styles.title}>Kalendár</h5>
        <div className={styles.grid}>
          <div className={styles.weekdays}>
            {["Po", "Ut", "St", "Št", "Pi", "So", "Ne"].map((day, i) => (
              <div key={i} className={styles.day}>
                {day}
              </div>
            ))}
          </div>
          <div className={styles.dates}>
            {[...Array(30)].map((_, i) => (
              <div key={i} className={styles.date}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default Calendar;
