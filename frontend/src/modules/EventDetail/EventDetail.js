import styles from "./EventDetail.module.scss";
import {
  Button,
  Alert,
  Spinner,
  OverlayTrigger,
  Tooltip,
  Dropdown,
  DropdownButton,
  Container,
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
import {
  formatDateSlovak,
  formatDateWithWeekday,
  getCurrentUTCDate,
  normalizeDate,
  toUTCZeroTime,
} from "../../utils/dateUtils";
import CategoryList from "../../components/CategoryList/CategoryList";
import JoinRoomButton from "../../components/JoinRoomButton/JoinRoomButton";
import LoadingButton from "../../components/LoadingButton/LoadingButton";

const EventDetail = ({
  eventId: parEventId,
  date: parDate,
  refetch,
  close,
}) => {
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
  const [eventCapacity, setEventCapacity] = useState(null);
  const [firstLoad, setFirstLoad] = useState(false);

  eventId = parEventId || eventId;
  date = parDate || date;

  const handleDelete = async () => {
    try {
      const confirmDelete = window.confirm("Naozaj chceš vymazať tento event?");
      if (!confirmDelete) return;

      const token = localStorage.getItem("token");

      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Chyba pri mazaní eventu.");
      }

      setMessage("Event bol úspešne vymazaný.");
      close();
      // napríklad refreshneš zoznam eventov alebo redirect
    } catch (error) {
      setError(error.message || "Chyba pri mazaní eventu.");
    }
  };

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
      console.log(date);
      const res = await fetch(`/api/events/${eventId}?date=${date}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri načítaní eventu");
      console.log(data);
      const newData = resolveEventData(data);
      setEventCapacity(data?.capacity);

      setEvent({
        ...newData,

        capacity: newData.capacity === 0 ? null : newData.capacity,
        attendancyLimit:
          newData.attendancyLimit === 0 ? null : newData.attendancyLimit,

        joinDaysBeforeStart:
          newData.joinDaysBeforeStart === 0
            ? null
            : newData.joinDaysBeforeStart,
      });

      setFirstLoad(true);

      setEditModeratorsValue(
        newData.moderators.map((item) => ({
          ...item,
          profileImageUrl: item.user.profileImageUrl,
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

  console.log(event);

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
  if (!firstLoad && (loading || !event))
    return (
      <Container className="d-flex justify-content-center align-items-center w-100">
        <Spinner animation="border" />
      </Container>
    );

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
    room,
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

  const occupied = participants.length;
  const available = capacity ? capacity - occupied : null;
  const isParticipant = participants.some((p) => p.id === user?.id);
  const isOrganizer = event.organizer?.id === user?.id || user.role === "ADMIN";
  const moderator = event.moderators?.find((m) => m.userId === user?.id);

  const currentDate = normalizeDate(getCurrentUTCDate()); // Dnešný dátum na 00:00 UTC
  const eventStartUTC = toUTCZeroTime(event.startDate); // Event dátum na 00:00 UTC

  const joinAvailableFrom = new Date(
    eventStartUTC.getTime() - event.joinDaysBeforeStart * 24 * 60 * 60 * 1000
  );

  const now = getCurrentUTCDate(); // aktuálny UTC čas

  // Vytvoríme plný UTC timestamp zo startDate a startTime
  const [hours, minutes] = event.startTime.split(":").map(Number);
  const eventStart = new Date(event.startDate);
  eventStart.setUTCHours(hours, minutes, 0, 0); // nastavíme čas v UTC

  let canJoin = false;

  if (now >= eventStart) {
    canJoin = false; // event už začal
  } else if (event.joinDaysBeforeStart == null) {
    canJoin = true; // žiadne obmedzenie
  } else {
    const joinAvailableFrom = new Date(eventStart);
    joinAvailableFrom.setUTCDate(
      eventStart.getUTCDate() - event.joinDaysBeforeStart
    );

    canJoin = now >= joinAvailableFrom;
  }

  const daysUntilJoin =
    event.startDate && event.joinDaysBeforeStart != null
      ? Math.ceil(
          (joinAvailableFrom.getTime() - currentDate.getTime()) /
            (24 * 60 * 60 * 1000)
        )
      : null;

  console.log(canJoin);

  console.log(daysUntilJoin);

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
        <EventDaySelector
          eventDays={event.eventDays}
          eventId={event.id}
          capacity={eventCapacity}
          fetchEvent={fetchEvent}
          attendancyLimit={event.attendancyLimit}
        />
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
      <div className={styles.topContainer}>
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
            {isOrganizer && (
              <Dropdown.Item
                onClick={() => handleDelete()}
                className={styles.redItem}
              >
                ❌ Vymazat
              </Dropdown.Item>
            )}
          </DropdownButton>
        )}
      </div>

      <CategoryList categories={event.categories} />

      <div className={styles.infoContainer}>
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
      <div className={styles.bottomContainer}>
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

          <div className="d-flex flex-row justify-content-end align-items-center gap-3 w-100">
            <div className={styles.spotsLeft}>
              {capacity ? `Ostáva: ${available}` : ""}
            </div>

            {canJoin ? (
              isParticipant ? (
                <LoadingButton
                  variant="danger"
                  onClick={() => postAction("leave")}
                  loading={loading}
                >
                  Odhlásiť sa
                </LoadingButton>
              ) : available > 0 || !capacity ? (
                <LoadingButton
                  variant="primary"
                  onClick={() => postAction("join")}
                  loading={loading}
                >
                  Prihlásiť sa
                </LoadingButton>
              ) : (
                <Button variant="secondary" disabled>
                  Už nie sú voľné miesta
                </Button>
              )
            ) : (
              <Button variant="secondary" disabled>
                {daysUntilJoin < 0
                  ? "Event už prebieha alebo skončil"
                  : `Za ${daysUntilJoin} dní`}
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
                <div className={styles.organizatorTag}>
                  Pravidelní uchádzači
                </div>
              </>
            )}
          </div>
          {allowRecurringAttendance && (
            <div className="d-flex flex-row justify-content-end align-items-center gap-3 w-100">
              <div className={styles.spotsLeft}>
                {capacity
                  ? `Ostáva: ${Math.max(capacity - event.attendants.length, 0)}`
                  : ""}
              </div>
              {console.log(subscribers.length, capacity)}

              <div className="d-flex gap-1">
                <Button variant="secondary" onClick={() => setShowPopup(true)}>
                  Manažovať pravidelné
                </Button>

                {room && <JoinRoomButton room={{ ...room, title }} />}
              </div>
            </div>
          )}
          {room && !allowRecurringAttendance && (
            <JoinRoomButton room={{ ...room, title }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
