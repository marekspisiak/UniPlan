import { Card, Badge, Row, Col, Button } from "react-bootstrap";
import { useState, memo } from "react";
import Popup from "../Popup/Popup";
import EventDetail from "../../modules/EventDetail/EventDetail";
import {
  formatDateUTC,
  formatTimeUTC,
  formatDateSlovak,
  formatDateWithWeekday,
} from "../../utils/dateUtils";
import CategoryList from "../CategoryList/CategoryList";
import {
  BsPeopleFill,
  BsGeoAltFill,
  BsCalendar2EventFill,
  BsClockFill,
} from "react-icons/bs";
import styles from "./EventCard.module.scss";

const EventCard = ({ event, refetch }) => {
  const {
    title,
    location,
    date,
    categories = [],
    id,
    startDate,
    endDate,
    hasStartTime,
    hasEndTime,
    participants,
  } = event;

  const capacity = event.capacity === 0 ? null : event.capacity;

  console.log("neviem");

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <EventDetail
          key={`${id}${date}`}
          eventId={id}
          date={date}
          refetch={refetch}
        />
      </Popup>

      <Card className={`shadow-sm border ${styles.card}`}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h5 className={`${styles.title}`}>{title}</h5>
            {capacity && (
              <div className={styles.capacity}>
                <b className="me-1">👥</b>
                {participants?.length
                  ? participants?.length
                  : capacity
                  ? 0
                  : null}
                /{capacity}
              </div>
            )}
          </div>

          <CategoryList categories={categories} />

          {location && (
            <div
              className={`text-muted mt-2 d-flex align-items-center ${styles.infoRow}`}
            >
              <b className="me-2">📍</b>
              <span>{location}</span>
            </div>
          )}

          <div
            className={`text-muted mt-2 d-flex align-items-center ${styles.infoRow}`}
          >
            <b className="me-2">📅</b>
            <span>{formatDateSlovak(formatDateUTC(startDate))}</span>
          </div>

          {hasStartTime && (
            <div
              className={`text-muted mt-2 d-flex align-items-center ${styles.infoRow}`}
            >
              {" "}
              <b className="me-2">⏰</b>
              <span>
                {formatTimeUTC(startDate)}
                {hasEndTime ? ` - ${formatTimeUTC(endDate)}` : ""}
              </span>
            </div>
          )}

          <div className="d-flex justify-content-end mt-3">
            <Button size="sm" onClick={() => setIsOpen(true)}>
              Zobraziť
            </Button>
          </div>
        </Card.Body>
      </Card>
    </>
  );
};

export default memo(EventCard);
