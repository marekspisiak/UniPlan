import { Card, Button } from "react-bootstrap";
import "./ActivityCard.scss";

const ActivityCard = ({ activity }) => {
  return (
    <Card className="activity-card">
      <Card.Body>
        <div className="activity-card__header">
          <h5 className="activity-card__title">{activity.title}</h5>
          <div className="activity-card__datetime">
            {activity.date} o {activity.time}
          </div>
        </div>
        <div className="activity-card__location">{activity.location}</div>
        <p className="activity-card__description">{activity.description}</p>
        <Button variant="primary" className="activity-card__button">
          Zúčastniť sa
        </Button>
      </Card.Body>
    </Card>
  );
};

export default ActivityCard;
