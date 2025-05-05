// POZOR: Tento refaktor predpokladá, že komponenty ako CategoryMultiSelect, ModeratorSelector atď. podporujú props `value` a `onChange`.

import { useEffect, useRef, useState } from "react";
import { Form, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventFormSchema } from "../../validation/schemas";
import CategoryMultiSelect from "../CategoryMultiSelect/CategoryMultiSelect";
import ImageUploader from "../ImageUploader/ImageUploader";
import ModeratorSelector from "../ModeratorSelector/ModeratorSelector";
import Toast from "../Toast/Toast";
import styles from "./EventForm.module.scss";
import { Link } from "react-router-dom";
import { ValidatedField } from "../ValidateComponents/ValidateComponents";
import { createUTCDate, getTodayLocalDate } from "../../utils/dateUtils";
import LoadingButton from "../LoadingButton/LoadingButton";

const EventForm = ({
  initialData = null,
  onSubmit,
  successMessage = "Akcia bola úspešne uložená.",
  submitLabel = "Uložiť",
  heading = "",
  children,
  scope = null,
}) => {
  const mainImageRef = useRef();
  const galleryRef = useRef();
  const [daysFromAPI, setDaysFromAPI] = useState([]);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mainImageChanged, setMainImageChanged] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endTime: "",
      repeat: false,
      repeatUntil: "",
      repeatInterval: "",
      repeatDays: {},
      allowRecurringAttendance: false,
      attendancyLimit: "",
      location: "",
      capacity: "",
      joinDaysBeforeStart: "",
      categoryIds: [],
      moderators: [],
      mainImage: null,
      gallery: [],
      deletedGallery: [],
      date: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  useEffect(() => {
    fetch("/api/days")
      .then((res) => res.json())
      .then((data) => setDaysFromAPI(data))
      .catch((err) => console.error("Chyba pri načítaní dní", err));
  }, []);

  const repeat = watch("repeat");
  const allowRecurringAttendance = watch("allowRecurringAttendance");
  const repeatInterval = watch("repeatInterval") || "";
  const repeatDays = watch("repeatDays") || {};
  const categoryIds = watch("categoryIds");
  const moderators = watch("moderators");
  const mainImage = watch("mainImage");
  const gallery = watch("gallery");
  const startDate = watch("startDate");
  const { id, date } = getValues(); // alebo const values = getValues()
  console.log(date);
  console.log(id);
  useEffect(() => {
    if (repeat) {
      setValue("repeatInterval", 1);
    } else {
      setValue("repeatInterval", "");
    }
  }, [repeat]);

  const today = getTodayLocalDate();
  const minDate = startDate && startDate > today ? startDate : today;

  const handleRepeatDayToggle = (week, dayId) => {
    const currentWeekDays = repeatDays[week] || [];
    const updatedDays = currentWeekDays.includes(dayId)
      ? currentWeekDays.filter((id) => id !== dayId)
      : [...currentWeekDays, dayId];

    setValue("repeatDays", {
      ...repeatDays,
      [week]: updatedDays,
    });
  };

  const onInternalSubmit = async (data) => {
    try {
      console.log(data);
      const payload = {
        ...data,
        moderators: data.moderators.map((mod) => ({ ...mod, id: mod.id })),
        startDateTime: data.startDate
          ? createUTCDate(
              data.startDate,
              data.startTime && data.startTime.trim() !== ""
                ? data.startTime
                : "00:00"
            ).toISOString()
          : null,

        endDateTime: data.startDate
          ? createUTCDate(
              data.startDate,
              data.endTime && data.endTime.trim() !== ""
                ? data.endTime
                : "23:59"
            ).toISOString()
          : null,
        mainImageChanged: mainImageChanged,
        hasStartDate: Boolean(data.startDate && data.startDate.trim() !== ""),
        hasStartTime: Boolean(data.startTime && data.startTime.trim() !== ""),
        hasEndTime: Boolean(data.endTime && data.endTime.trim() !== ""),
      };
      setLoading(true);
      console.log(payload);
      await onSubmit(payload);

      setSuccess(successMessage);
      setMainImageChanged(false);
      mainImageRef.current?.clear();
      galleryRef.current?.clear();
    } catch (err) {
      setError(err.message || "Chyba pri ukladaní eventu.");
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors) => {
    console.warn("CHYBY VO FORMULÁRI:", errors);
  };

  const all = watch();
  console.log(all);

  return (
    <div className={styles.eventForm}>
      <h4 className={styles.heading}>{heading}</h4>
      {error && <Toast error={error} onClose={() => setError(null)} />}
      {success && <Toast success={success} onClose={() => setSuccess(null)} />}

      <Form onSubmit={handleSubmit(onInternalSubmit, onError)} noValidate>
        {/* Názov */}
        {children}
        <ValidatedField
          type="text"
          name="title"
          label="Názov"
          register={register}
          errors={errors}
        />

        <ValidatedField
          type="text"
          name="location"
          label="Miesto"
          register={register}
          errors={errors}
        />

        {/* Popis */}
        <ValidatedField
          rows={3}
          as="textarea"
          name="description"
          label="Popis"
          register={register}
          errors={errors}
        />

        {/* Dátum */}
        {(!scope || scope === "occurrence" || scope === "event") && (
          <ValidatedField
            type="date"
            name="startDate"
            label={
              !repeat || scope === "occurrence"
                ? "Dátum"
                : "V ktorom týždni začať interval"
            }
            register={register}
            errors={errors}
            disabled={scope === "event"}
          />
        )}

        {/* Časy */}
        <ValidatedField
          type="time"
          name="startTime"
          label="Čas začiatku"
          register={register}
          errors={errors}
        />
        <ValidatedField
          type="time"
          name="endTime"
          label="Čas konca"
          register={register}
          errors={errors}
        />

        {/* Opakovanie */}
        {(scope === "event" || !scope) && scope !== "occurrence" && (
          <>
            <Form.Group className="mb-3">
              <Form.Check
                id="repeat-event"
                type="checkbox"
                label="Opakovať event"
                disabled={scope === "event"}
                {...register("repeat", {
                  onChange: (e) => {
                    const checked = e.target.checked;

                    if (!checked) {
                      setValue("repeatDays", {});
                      setValue("repeatInterval", "");
                      setValue("repeatUntil", "");
                      setValue("allowRecurringAttendance", false);
                      setValue("attendancyLimit", "");
                    }
                  },
                })}
              />
            </Form.Group>

            {repeat && (
              <>
                <ValidatedField
                  type="date"
                  name="repeatUntil"
                  label="Opakovať do"
                  register={register}
                  errors={errors}
                  min={minDate}
                />

                <ValidatedField
                  type="number"
                  name="repeatInterval"
                  label="Interval opakovania (v týždňoch)"
                  register={register}
                  errors={errors}
                  disabled={scope === "event"}
                  min={1}
                />

                {Array.from({ length: repeatInterval }, (_, week) => (
                  <Form.Group key={week} className="mb-3">
                    <Form.Label>Dni v týždni – Týždeň {week + 1}</Form.Label>
                    <div className={styles.weekdayCheckboxes}>
                      {daysFromAPI.map((day) => {
                        const checkboxId = `repeat-week-${week}-day-${day.id}`;
                        return (
                          <Form.Check
                            key={day.id}
                            id={checkboxId}
                            inline
                            label={day.name}
                            type="checkbox"
                            checked={
                              repeatDays[week]?.includes(day.id) || false
                            }
                            onChange={() => handleRepeatDayToggle(week, day.id)}
                          />
                        );
                      })}
                    </div>
                  </Form.Group>
                ))}

                <ValidatedField
                  type="checkbox"
                  name="allowRecurringAttendance"
                  label="Povoliť pravidelnú účasť"
                  register={register}
                  errors={errors}
                  disabled={scope != null}
                />

                {allowRecurringAttendance && (
                  <ValidatedField
                    type="number"
                    name="attendancyLimit"
                    label="Max počet dní pre pravidelné prihlásenie na jeden cyklus"
                    register={register}
                    errors={errors}
                  />
                )}
              </>
            )}
          </>
        )}
        {console.log(scope)}

        <ValidatedField
          type="number"
          name="capacity"
          label="Kapacita"
          register={register}
          errors={errors}
        />

        {/* Kapacita */}
        <ValidatedField
          type="number"
          name="joinDaysBeforeStart"
          label="Koľko dní pred začiatkom sa možno prihlásiť"
          register={register}
          errors={errors}
        />

        {/* Kategórie */}
        {(scope === "event" ||
          !scope ||
          (scope === "occurrence" && repeatInterval === "")) && (
          <Form.Group className="mb-4">
            <Form.Label>Kategórie</Form.Label>
            <CategoryMultiSelect
              selectedIds={categoryIds}
              onChange={(ids) => setValue("categoryIds", ids)}
            />
          </Form.Group>
        )}

        {/* Moderátori */}
        {!scope && (
          <Form.Group className="mb-3">
            <Form.Label>Moderátori</Form.Label>
            <ModeratorSelector
              selected={moderators}
              onChange={(ids) => setValue("moderators", ids)}
            />
          </Form.Group>
        )}

        {/* Obrázky */}
        {(scope === "event" ||
          (scope === "occurrence" && repeatInterval === "") ||
          !scope) && (
          <>
            {console.log(mainImage?.length)}
            <ImageUploader
              ref={mainImageRef}
              label="Profilová fotka (nepovinná)"
              onChange={({ files }) => {
                setValue("mainImage", files);
                setMainImageChanged(true);
              }}
              multiple={false}
              existing={mainImage?.length > 0 ? [`${mainImage}`] : []}
            />

            <ImageUploader
              ref={galleryRef}
              label="Galéria (max 5 fotiek)"
              onChange={({ files, deleted }) => {
                setValue("gallery", files);
                setValue("deletedGallery", deleted);
              }}
              multiple
              max={5}
              existing={gallery?.map((g) => `${g.url}`) || []}
            />
          </>
        )}

        <LoadingButton
          type="submit"
          variant="primary"
          className="w-100"
          loading={loading}
        >
          {submitLabel}
        </LoadingButton>

        <Link
          to={id && date ? `/event/${id}/${date}` : "/"}
          className="text-decoration-none"
        >
          <Button
            type="button"
            variant="danger"
            className="w-100 mt-2"
            disabled={loading}
          >
            Zrušiť
          </Button>
        </Link>
      </Form>
    </div>
  );
};

export default EventForm;
