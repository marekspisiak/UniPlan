import styles from "./EventDetail.module.scss";
import {
  Button,
  Alert,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import UserAvatarList from "../../components/UserAvatarList/UserAvatarList";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";

const EventDetail = ({ eventId: parEventId, date: parDate }) => {
  let { eventId, date } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  eventId = parEventId || eventId;
  date = parDate || date;

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/events/${eventId}?date=${date}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri načítaní eventu");
      setEvent(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId, date]);

  const postAction = async (endpoint) => {
    try {
      setMessage(null);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/events/${eventId}/${endpoint}?date=${date}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message);
      fetchEvent();
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (loading || !event) return <Spinner animation="border" />;

  const {
    title,
    mainImage,
    description,
    date: eventDate,
    time,
    endTime,
    location,
    capacity,
    gallery = [],
    organizer,
    moderators = [],
    participants = [],
    subscribers = [],
  } = event;

  console.log(eventDate);

  const occupied = participants.length;
  const available = capacity ? capacity - occupied : null;
  const isParticipant = participants.some((p) => p.id === user?.id);
  const isOrganizer = event.organizer?.id === user?.id;
  const isModerator = event.moderators?.some((m) => m.id === user?.id);

  return (
    <div className={styles.eventDetails}>
      {mainImage && (
        <div className={styles.header}>
          <PhotoProvider>
            <PhotoView src={`http://localhost:5000${mainImage}`}>
              <img
                src={`http://localhost:5000${mainImage}`}
                alt={title}
                className={styles.mainImage}
              />
            </PhotoView>
          </PhotoProvider>
        </div>
      )}
      <div className="d-flex flex-row justify-content-start align-items-center w-100">
        <div className={styles.title}>{title}</div>
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id="copy-tooltip">Skopírovať odkaz</Tooltip>}
        >
          <button
            className={styles.copyButton}
            onClick={() => {
              const url = `${window.location.origin}/event/${eventId}/${eventDate}`;
              navigator.clipboard.writeText(url);
            }}
          >
            📋
          </button>
        </OverlayTrigger>
        {(isOrganizer || isModerator) && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate(`/edit-event/${event.id}`)}
            className="ms-auto"
          >
            ✏️ Upraviť
          </Button>
        )}
      </div>

      {event.categories.length > 0 && (
        <div className="d-flex justify-content-between align-items-center ">
          <div className={styles.tags}>
            {event.categories.map((cat) => (
              <span key={cat.id} className={styles.tag}>
                <span className={styles.tagIcon}>{cat.icon}</span>
                {cat.label || cat.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="d-flex fex-row justify-content-between align-items-start gap-2 w-100">
        <div className={styles.details}>
          <div>
            <b>📍</b> {location}
          </div>
          <div>
            <b>📅</b> {new Date(eventDate).toISOString().slice(0, 10)}
          </div>
          <div>
            <b>⏰</b> {time}
            {endTime ? ` – ${endTime}` : ""}
          </div>
          {capacity && (
            <div>
              <b>👥 </b> {occupied} / {capacity} miest obsadených
            </div>
          )}
        </div>
        <div className="d-flex flex-column gap-3 align-items-center">
          <div className="d-flex flex-row gap-2 align-items-center">
            <UserAvatar user={organizer} interactive></UserAvatar>
            <div className="flex flex-column">
              <div
                className={styles.organizatorName}
              >{`${organizer.firstName} ${organizer.lastName}`}</div>
              <div className={styles.organizatorTag}>Organizátor</div>
            </div>
          </div>
          {moderators.length > 0 && (
            <>
              <UserAvatarList
                users={moderators}
                size="mini"
                interactive
                maxVisible={4}
                header="Moderátori"
              />
              <div className={styles.organizatorTag}>Moderátori</div>
            </>
          )}
        </div>
      </div>

      <div className=" my-2">{description}</div>
      {gallery.length > 0 && (
        <PhotoProvider>
          <div className={styles.gallery}>
            {gallery.map((img, index) => (
              <div className={styles.galleryImageWrapper}>
                <PhotoView key={index} src={`http://localhost:5000${img.url}`}>
                  <img
                    src={`http://localhost:5000${img.url}`}
                    alt={`gallery-${index}`}
                    className={styles.galleryImage}
                  />
                </PhotoView>
              </div>
            ))}
          </div>
        </PhotoProvider>
      )}

      <div className="d-flex flex-row justify-content-between align-items-center gap-2 w-100 mt-3">
        <div className="d-flex flex-column align-items-start gap-1">
          {moderators.length > 0 && (
            <>
              <UserAvatarList
                users={participants}
                size="mini"
                interactive
                maxVisible={4}
                header="Účastníci"
              />
              <div className={styles.organizatorTag}>Účastníci</div>
            </>
          )}
        </div>
        <div className="d-flex flex-row justify-content-end align-items-center gap-3  w-100">
          <div className={styles.spotsLeft}>
            {capacity ? `Voľných miest: ${available}` : ""}
          </div>
          {isParticipant ? (
            <Button variant="danger" onClick={() => postAction("leave")}>
              Odhlásiť sa
            </Button>
          ) : available > 0 || !capacity ? (
            <Button variant="primary" onClick={() => postAction("join")}>
              Prihlásiť sa
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Už nie sú voľné miesta
            </Button>
          )}
        </div>
      </div>

      <div className="d-flex flex-row justify-content-between align-items-center gap-2 w-100 mt-3">
        <div className="d-flex flex-column align-items-start gap-1">
          {subscribers.length > 0 && (
            <>
              <UserAvatarList
                users={subscribers}
                size="mini"
                interactive
                maxVisible={4}
                header="Odberatelia"
              />
              <div className={styles.organizatorTag}>Odberatelia</div>
            </>
          )}
        </div>
        <div className="d-flex flex-row justify-content-end align-items-center gap-3 w-100">
          <div className={styles.spotsLeft}>
            {capacity
              ? `Zostáva miest na odber: ${Math.max(
                  capacity - subscribers.length,
                  0
                )}`
              : ""}
          </div>
          {subscribers.some((s) => s.id === user?.id) ? (
            <Button
              variant="outline-danger"
              onClick={() => postAction("unsubscribe")}
            >
              Zrušiť odber
            </Button>
          ) : subscribers.length < capacity ? (
            <Button variant="secondary" onClick={() => postAction("subscribe")}>
              Prihlásiť sa na odber
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Plný počet odberateľov
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
