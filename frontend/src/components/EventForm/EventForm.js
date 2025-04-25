import { useState, useRef, useEffect } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import CategoryMultiSelect from "../CategoryMultiSelect/CategoryMultiSelect";
import ImageUploader from "../ImageUploader/ImageUploader";
import ModeratorSelector from "../ModeratorSelector/ModeratorSelector";
import styles from "./EventForm.module.scss";
import { Link } from "react-router-dom";

const EventForm = ({
  initialData = null,
  onSubmit,
  successMessage = "Akcia bola úspešne uložená.",
  submitLabel = "Uložiť",
  heading = "",
  children,
  scope = null,
}) => {
  const [form, setForm] = useState({});

  const setInitialData = () => {
    setForm({
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endTime: "",
      repeatUntil: "",
      repeatInterval: 0,
      repeatDays: {},
      repeat: false,
      allowRecurringAttendance: false,
      maxAttendancesPerCycle: "",
      location: "",
      capacity: "",
      joinDaysBeforeStart: "",
      categoryIds: [],
      moderators: [],
      mainImage: null,
      gallery: [],
      deletedGallery: [],
      mainImageChanged: false,

      ...initialData,
    });
  };

  useEffect(() => {
    if (initialData) {
      setInitialData();
    }
  }, [initialData]);

  useEffect(() => {
    setInitialData();
  }, []);

  const [daysFromAPI, setDaysFromAPI] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const mainImageRef = useRef();
  const galleryRef = useRef();

  useEffect(() => {
    fetch("/api/days")
      .then((res) => res.json())
      .then((data) => setDaysFromAPI(data))
      .catch((err) => console.error("Chyba pri načítaní dní", err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "repeat" && !checked) {
      setForm((prev) => ({
        ...prev,
        repeat: checked,
        repeatDays: {},
        repeatInterval: 0,
        repeatUntil: "",
        allowRecurringAttendance: false,
        maxAttendancesPerCycle: "",
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCheckboxChange = (week, dayId) => {
    setForm((prev) => {
      const current = prev.repeatDays[week] || [];
      const updated = current.includes(dayId)
        ? current.filter((d) => d !== dayId)
        : [...current, dayId];
      return {
        ...prev,
        repeatDays: {
          ...prev.repeatDays,
          [week]: updated,
        },
      };
    });
  };

  const validateForm = () => {
    if (!form.startDate) return "Dátum je povinný.";

    console.log(form.startTime, form.endTime);

    if (form.endTime && form.startTime && form.startTime >= form.endTime) {
      return "Čas začiatku musí byť pred časom konca.";
    }

    if (form.repeat) {
      if (!form.startTime || !form.endTime)
        return "Pri opakovaní eventu je potrebné zadať aj čas začiatku aj konca.";

      if (form.repeatUntil && form.repeatUntil < form.startDate)
        return "Opakovanie nemôže končiť pred začiatkom eventu.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const cleanedForm = {
        ...form,
        moderators: form.moderators.map((mod) => ({ ...mod, id: mod.id })),
        startDateTime:
          form.startDate && form.startTime
            ? `${form.startDate}T${form.startTime}`
            : null,
        endDateTime:
          form.startDate && form.endTime
            ? `${form.startDate}T${form.endTime}`
            : null,
      };

      await onSubmit(cleanedForm);
      setSuccess(successMessage);
      mainImageRef.current?.clear();
      galleryRef.current?.clear();
    } catch (err) {
      setError(err.message || "Chyba pri ukladaní eventu.");
    }
  };

  return (
    <div className={styles.eventForm}>
      <h4 className={styles.heading}>{heading}</h4>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      {children}

      <Form onSubmit={handleSubmit}>
        {/* Názov */}
        <Form.Group className="mb-3">
          <Form.Label>Názov</Form.Label>
          <Form.Control
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />
        </Form.Group>

        {/* Popis */}
        <Form.Group className="mb-3">
          <Form.Label>Popis</Form.Label>
          <Form.Control
            as="textarea"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
          />
        </Form.Group>

        {/* Dátum */}
        {(!scope || scope === "occurrence") && (
          <Form.Group className="mb-3">
            <Form.Label>Dátum</Form.Label>
            <Form.Control
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              required
            />
          </Form.Group>
        )}

        {/* Časy */}
        <Form.Group className="mb-3">
          <Form.Label>Čas začiatku</Form.Label>
          <Form.Control
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Čas konca</Form.Label>
          <Form.Control
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
          />
        </Form.Group>

        {/* Opakovanie */}
        {(scope === "event" || !scope) && scope !== "occurrence" && (
          <>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Opakovať event"
                name="repeat"
                checked={form.repeat}
                onChange={handleChange}
                disabled={scope === "event"}
              />
            </Form.Group>

            {form.repeat && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Opakovať do</Form.Label>
                  <Form.Control
                    type="date"
                    name="repeatUntil"
                    value={form.repeatUntil}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Interval opakovania (v týždňoch)</Form.Label>
                  <Form.Control
                    type="number"
                    name="repeatInterval"
                    min={1}
                    value={form.repeatInterval}
                    onChange={handleChange}
                    required
                    disabled={scope === "event"}
                  />
                </Form.Group>

                {Array.from({ length: form.repeatInterval }, (_, week) => (
                  <Form.Group key={week} className="mb-3">
                    <Form.Label>Dni v týždni – Týždeň {week + 1}</Form.Label>
                    <div className={styles.weekdayCheckboxes}>
                      {daysFromAPI.map((day) => (
                        <Form.Check
                          key={day.id}
                          inline
                          label={day.name}
                          type="checkbox"
                          checked={
                            form.repeatDays[week]?.includes(day.id) || false
                          }
                          onChange={() => handleCheckboxChange(week, day.id)}
                        />
                      ))}
                    </div>
                  </Form.Group>
                ))}

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Povoliť pravidelnú účasť"
                    name="allowRecurringAttendance"
                    checked={form.allowRecurringAttendance}
                    onChange={handleChange}
                    disabled={scope != null}
                  />
                </Form.Group>

                {form.allowRecurringAttendance && (
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Max počet dní pre pravidelné prihlásenie na jeden cyklus
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="maxAttendancesPerCycle"
                      value={form.maxAttendancesPerCycle}
                      onChange={handleChange}
                    />
                  </Form.Group>
                )}
              </>
            )}
          </>
        )}

        {/* Miesto */}
        <Form.Group className="mb-3">
          <Form.Label>Miesto</Form.Label>
          <Form.Control
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
          />
        </Form.Group>

        {/* Kapacita */}
        <Form.Group className="mb-3">
          <Form.Label>Kapacita</Form.Label>
          <Form.Control
            type="number"
            name="capacity"
            value={form.capacity}
            onChange={handleChange}
          />
        </Form.Group>

        {/* Dni pred začiatkom */}
        <Form.Group className="mb-3">
          <Form.Label>Koľko dní pred začiatkom sa možno prihlásiť</Form.Label>
          <Form.Control
            type="number"
            name="joinDaysBeforeStart"
            value={form.joinDaysBeforeStart}
            onChange={handleChange}
          />
        </Form.Group>

        {/* Kategórie */}
        {(scope === "event" ||
          !scope ||
          (scope === "occurrence" && form.repeatInterval === 0)) && (
          <Form.Group className="mb-4">
            <Form.Label>Kategórie</Form.Label>
            <CategoryMultiSelect
              selectedIds={form.categoryIds}
              onChange={(ids) =>
                setForm((prev) => ({ ...prev, categoryIds: ids }))
              }
            />
          </Form.Group>
        )}

        {/* Moderátori */}
        {!scope && (
          <Form.Group className="mb-3">
            <Form.Label>Moderátori</Form.Label>
            <ModeratorSelector
              selected={form.moderators}
              onChange={(ids) =>
                setForm((prev) => ({ ...prev, moderators: ids }))
              }
            />
          </Form.Group>
        )}

        {/* Obrázky */}
        {(scope === "event" ||
          (scope === "occurrence" && form.repeatInterval === 0) ||
          !scope) && (
          <>
            <ImageUploader
              ref={mainImageRef}
              label="Profilová fotka (nepovinná)"
              onChange={({ files }) => {
                setForm((prev) => ({
                  ...prev,
                  mainImage: files,
                  mainImageChanged: true,
                }));
              }}
              multiple={false}
              existing={form.mainImage ? [`${form.mainImage}`] : []}
            />

            <ImageUploader
              ref={galleryRef}
              label="Galéria (max 5 fotiek)"
              onChange={({ files, deleted }) =>
                setForm((prev) => ({
                  ...prev,
                  gallery: files,
                  deletedGallery: deleted,
                }))
              }
              multiple
              max={5}
              existing={form.gallery?.map((g) => `${g.url}`) || []}
            />
          </>
        )}

        <Button type="submit" variant="primary" className="w-100">
          {submitLabel}
        </Button>

        <Link to={`/event/${form.id}`} className="text-decoration-none">
          <Button type="button" variant="danger" className="w-100 mt-2">
            Zrušiť
          </Button>
        </Link>
      </Form>
    </div>
  );
};

export default EventForm;
