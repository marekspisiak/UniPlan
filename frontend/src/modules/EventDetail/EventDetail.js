import styles from "./EventDetail.module.scss";
import {
  Button,
  Alert,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Dropdown,
  DropdownButton,
} from "react-bootstrap";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import UserAvatarList from "../../components/UserAvatarList/UserAvatarList";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import EventDaySelector from "../../components/EventDaySelector/EventDaySelector";
import Popup from "../../components/Popup/Popup";
import { resolveEventData } from "../../utils/eventUtils";
import ModeratorSelector from "../../components/ModeratorSelector/ModeratorSelector";
import UserList from "../../components/UserList/UserList";
import { formatDateSlovak } from "../../utils/dateUtils";
import CategoryList from "../../components/CategoryList/CategoryList";

const EventDetail = ({ eventId: parEventId, date: parDate }) => {
  let { eventId, date } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [editModerators, setEditModerators] = useState(false);
  const [editModeratorsValue, setEditModeratorsValue] = useState({});
  const [editUsers, setEditUsers] = useState(false);
  const [editAttendees, setEditAttendees] = useState(false);

  eventId = parEventId || eventId;
  date = parDate || date;

  const onSubmitModerators = async (moderators) => {
    try {
      const response = await fetch(`/api/events/${eventId}/edit-moderators`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(moderators),
      });

      if (!response.ok) {
        throw new Error(`Chyba ${response.status}`);
      }

      const data = await response.json();
      setEditModerators(false);
      fetchEvent();
      console.log("Moderátori boli úspešne uložený:", data);
      // Tu môžeš dať redirect, toast, atď.
    } catch (error) {
      console.error("Chyba pri ukladaní moderátorov:", error);
      // Tu môžeš zobraziť chybu používateľovi
    }
  };

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/events/${eventId}?date=${date}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri načítaní eventu");
      const newData = { ...data, ...resolveEventData(data) };

      setEvent({
        ...newData,
        startDate: newData.hasStartDate
          ? newData.startDate.split("T")[0]
          : undefined,
        startTime: newData.hasStartTime
          ? newData.startDate.split("T")[1]?.substring(0, 5)
          : undefined,
        endTime:
          newData.hasEndTime && newData.endDate
            ? newData.endDate.split("T")[1]?.substring(0, 5)
            : undefined,
      });

      setEditModeratorsValue(
        newData.moderators.map((item) => ({
          ...item,
          profileImageUrl: `/uploads/profile/user_${item.user.id}.png`,
          firstName: item.user.firstName,
          lastName: item.user.lastName,
          email: item.user.emal,
          id: item.user.id,
          moderatorId: item.id,
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId, date]);

  console.log(editModeratorsValue);

  const postAction = async (endpoint) => {
    try {
      setMessage(null);
      setError(null);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/events/${eventId}/${endpoint}?date=${date}`,
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
    time,
    location,
    capacity,
    gallery = [],
    organizer,
    moderators = [],
    participants = [],
    attendants: subscribers = [],
    allowRecurringAttendance = false,

    startDate,
    startTime,
    endTime,
    eventDayId,
    occurrenceId,
    repeatInterval,
  } = event;

  const onUserDelete = async ({ userId, type }) => {
    // type: 'recurring' alebo 'single'
    // attendanceId: eventDayId alebo occurrenceId

    const id = type === "recurring" ? eventDayId : occurrenceId;

    const endpoint = `/api/events/${eventId}/attendance/${type}/${id}/${userId}`;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Chyba pri mazaní: ${response.status}`);
      }

      const result = await response.json();
      fetchEvent();
      console.log("Úspešne odstránené:", result);
      return true;
    } catch (error) {
      console.error("Chyba pri odstraňovaní používateľa:", error);
      return false;
    }
  };

  console.log(subscribers.length);

  const occupied = participants.length;
  const available = capacity ? capacity - occupied : null;
  const isParticipant = participants.some((p) => p.id === user?.id);
  const isOrganizer = event.organizer?.id === user?.id;
  const moderator = event.moderators?.find((m) => m.userId === user?.id);
  return (
    <div className={styles.eventDetails}>
      <Popup isOpen={editUsers} onClose={() => setEditUsers(false)}>
        <UserList
          header="Prihlásení"
          users={participants}
          onDelete={(params) => onUserDelete({ ...params, type: "single" })}
        />
      </Popup>
      <Popup
        isOpen={editAttendees}
        onClose={() => {
          setEditAttendees(false);
          fetchEvent();
        }}
      >
        <UserList
          header="Pravidelne prihlásení"
          users={subscribers}
          onDelete={(params) => onUserDelete({ ...params, type: "recurring" })}
        />
      </Popup>
      <Popup
        isOpen={showPopup}
        onClose={() => {
          setShowPopup(false);
          fetchEvent();
        }}
      >
        <EventDaySelector eventDays={event.eventDays} eventId={event.id} />
      </Popup>
      <Popup isOpen={editModerators} onClose={() => setEditModerators(false)}>
        <ModeratorSelector
          selected={editModeratorsValue}
          onChange={(ids) => setEditModeratorsValue(ids)}
        />
        <div className="d-flex  justify-content-center mt-2">
          <Button
            variant="btn btn-primary"
            size="sm"
            onClick={() => onSubmitModerators(editModeratorsValue)}
          >
            Potvrdiť
          </Button>
        </div>
      </Popup>
      {mainImage && (
        <div className={styles.header}>
          <PhotoProvider>
            <PhotoView src={`${mainImage}`}>
              <img
                src={`${mainImage}`}
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
              const url = `${window.location.origin}/event/${eventId}/${date}`;
              navigator.clipboard.writeText(url);
            }}
          >
            📋
          </button>
        </OverlayTrigger>
        {(isOrganizer || moderator) && (
          <DropdownButton
            variant="outline-secondary"
            title="⚙️ Správa eventu"
            size="sm"
            className="ms-auto"
          >
            {(isOrganizer || moderator?.canEditEvent) && (
              <Dropdown.Item
                onClick={() => navigate(`/edit-event/${event.id}/${date}`)}
              >
                ✏️ Upraviť event
              </Dropdown.Item>
            )}
            {(isOrganizer || moderator?.canManageModerators) && (
              <Dropdown.Item onClick={() => setEditModerators((prev) => !prev)}>
                ✏️ Upraviť moderátorov
              </Dropdown.Item>
            )}
            {(isOrganizer || moderator?.canManageParticipants) && (
              <Dropdown.Item onClick={() => setEditUsers((prev) => !prev)}>
                ✏️ Upraviť prihlásených
              </Dropdown.Item>
            )}
            {(isOrganizer || moderator?.canManageAttendees) && (
              <Dropdown.Item onClick={() => setEditAttendees((prev) => !prev)}>
                ✏️ Upraviť pravidelných
              </Dropdown.Item>
            )}
          </DropdownButton>
        )}
      </div>

      <CategoryList categories={event.categories} />

      <div className="d-flex fex-row justify-content-between align-items-start gap-2 w-100">
        <div className={styles.details}>
          <div>
            <b>📍</b> {location}
          </div>
          <div>
            <b>📅</b> {formatDateSlovak(startDate)}
          </div>
          <div>
            <b>⏰</b> {startTime}
            {endTime ? ` - ${endTime}` : ""}
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
                users={moderators.map((mod) => mod.user)}
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
                <PhotoView key={index} src={`${img.url}`}>
                  <img
                    src={`${img.url}`}
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
          {participants.length > 0 && (
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
                header="Pravidelní uchádzači"
              />
              <div className={styles.organizatorTag}>Pravidelní uchádzači</div>
            </>
          )}
        </div>
        {allowRecurringAttendance && (
          <div className="d-flex flex-row justify-content-end align-items-center gap-3 w-100">
            <div className={styles.spotsLeft}>
              {capacity
                ? `Zostáva miest na odber: ${Math.max(
                    capacity - event.attendants.length,
                    0
                  )}`
                : ""}
            </div>
            {console.log(subscribers.length, capacity)}

            {subscribers.length < capacity || !capacity ? (
              <Button variant="secondary" onClick={() => setShowPopup(true)}>
                Manažovať pravidelné
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                Plný počet odberateľov
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
