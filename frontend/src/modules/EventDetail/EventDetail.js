import styles from "./EventDetail.module.scss";
import { Button, Alert, Spinner } from "react-bootstrap";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import UserAvatarList from "../../components/UserAvatarList/UserAvatarList";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const EventDetail = ({ eventId }) => {
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  console.log("wtf");

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
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
  }, []);

  const handleJoin = async () => {
    setMessage(null);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/events/${eventId}/join`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri prihlasovaní.");
      setMessage("Úspešne prihlásený.");
      fetchEvent();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLeave = async () => {
    setMessage(null);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/events/${eventId}/leave`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri odhlasovaní.");
      setMessage("Úspešne odhlásený.");
      fetchEvent();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubscribe = async () => {
    setMessage(null);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/events/${eventId}/subscribe`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri subscribnutí.");
      setMessage(data.message);
      fetchEvent(); // obnov data
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUnsubscribe = async () => {
    setMessage(null);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/events/${eventId}/unsubscribe`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri zrušení odberu.");
      setMessage(data.message);
      fetchEvent(); // obnov event s novými dátami
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading || !event) return <Spinner animation="border" />;

  const {
    title,
    mainImage,
    description,
    date,
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

  console.log(event);
  console.log("wtf");

  const occupied = participants.length;
  const available = capacity ? capacity - occupied : null;
  const isParticipant = participants.some((p) => p.id === user?.id);

  const isOrganizer = event.organizer?.id === user?.id;
  const isModerator = event.moderators?.some((m) => m.id === user?.id);

  return (
    <div className={styles.eventDetails}>
      {mainImage && (
        <div className={styles.header}>
          {mainImage && (
            <PhotoProvider>
              <PhotoView src={`http://localhost:5000${mainImage}`}>
                <img
                  src={`http://localhost:5000${mainImage}`}
                  alt={title}
                  className={styles.mainImage}
                />
              </PhotoView>
            </PhotoProvider>
          )}
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
              const url = `${window.location.origin}/event/${eventId}`;
              navigator.clipboard.writeText(url);
            }}
          >
            📋
          </button>
        </OverlayTrigger>
        {isOrganizer || isModerator ? (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => navigate(`/edit-event/${event.id}`)}
            className="ms-auto "
          >
            ✏️ Upraviť
          </Button>
        ) : (
          ""
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
            <b>📅</b> {new Date(date).toLocaleDateString()}
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
          <div className="d-flex flex-column align-items-center gap-1">
            {moderators.length > 0 && (
              <UserAvatarList
                users={moderators}
                size="mini"
                interactive
                maxVisible={4}
                header="Moderátori"
              ></UserAvatarList>
            )}
            {moderators.length > 0 && (
              <div className={styles.organizatorTag}>Moderátori</div>
            )}
          </div>
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
            <UserAvatarList
              users={participants}
              size="mini"
              interactive
              maxVisible={4}
              header="Účastníci"
            ></UserAvatarList>
          )}
          {moderators.length > 0 && (
            <div className={styles.organizatorTag}>Účastníci</div>
          )}
        </div>
        <div className="d-flex flex-row justify-content-end align-items-center gap-3  w-100">
          <div className={styles.spotsLeft}>
            {capacity ? `Voľných miest: ${available}` : ""}
          </div>
          {isParticipant ? (
            <Button variant="danger" onClick={handleLeave}>
              Odhlásiť sa
            </Button>
          ) : available > 0 || !capacity ? (
            <Button variant="primary" onClick={handleJoin}>
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
        <div className="d-flex flex-column align-items-stsart gap-1">
          {event.subscribers?.length > 0 && (
            <UserAvatarList
              users={event.subscribers}
              size="mini"
              interactive
              maxVisible={4}
              header="Odberatelia"
            />
          )}
          {event.subscribers?.length > 0 && (
            <div className={styles.organizatorTag}>Odberatelia</div>
          )}
        </div>

        <div className="d-flex flex-row justify-content-end align-items-center gap-3 w-100">
          <div className={styles.spotsLeft}>
            {capacity
              ? `Zostáva miest na odber: ${Math.max(
                  capacity - event.subscribers.length,
                  0
                )}`
              : ""}
          </div>

          {event.subscribers.some((s) => s.id === user?.id) ? (
            <Button variant="outline-danger" onClick={handleUnsubscribe}>
              Zrušiť odber
            </Button>
          ) : event.subscribers.length < capacity ? (
            <Button variant="secondary" onClick={handleSubscribe}>
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
