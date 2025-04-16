import { useState, useRef, useEffect } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import CategoryMultiSelect from "../CategoryMultiSelect/CategoryMultiSelect";
import ImageUploader from "../ImageUploader/ImageUploader";
import ModeratorSelector from "../ModeratorSelector/ModeratorSelector";
import styles from "./EventForm.module.scss";
import { Link } from "react-router-dom";

const EventForm = ({
  initialData = {},
  onSubmit,
  successMessage = "Akcia bola úspešne uložená.",
  submitLabel = "Uložiť",
  heading = "",
}) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    capacity: "",
    categoryIds: [],
    moderators: [],
    mainImage: null,
    gallery: [],
    deletedGallery: [],
    mainImageChanged: false,
    ...initialData,
  });

  console.log(initialData);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const mainImageRef = useRef();
  const galleryRef = useRef();

  useEffect(() => {
    if (initialData) setForm((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await onSubmit(form);
      setSuccess(successMessage);
      mainImageRef.current?.clear();
      galleryRef.current?.clear();
      setForm({
        title: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        capacity: "",
        categoryIds: [],
        moderators: [],
        mainImage: null,
        gallery: [],
        deletedGallery: [],
      });
    } catch (err) {
      setError(err.message || "Chyba pri ukladaní eventu.");
    }
  };

  console.log(form);

  return (
    <div className={styles.eventForm}>
      <h4 className={styles.heading}>{heading}</h4>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit} encType="multipart/form-data">
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

        <Form.Group className="mb-3">
          <Form.Label>Dátum</Form.Label>
          <Form.Control
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Čas začiatku</Form.Label>
          <Form.Control
            type="time"
            name="startTime"
            value={form.startTime}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Čas konca (nepovinné)</Form.Label>
          <Form.Control
            type="time"
            name="endTime"
            value={form.endTime}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Miesto</Form.Label>
          <Form.Control
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Kapacita (nepovinné)</Form.Label>
          <Form.Control
            type="number"
            name="capacity"
            value={form.capacity}
            onChange={handleChange}
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Kategórie</Form.Label>
          <CategoryMultiSelect
            selectedIds={form.categoryIds}
            onChange={(ids) =>
              setForm((prev) => ({ ...prev, categoryIds: ids }))
            }
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Moderátori</Form.Label>
          <ModeratorSelector
            selected={form.moderators}
            onChange={(ids) =>
              setForm((prev) => ({ ...prev, moderators: ids }))
            }
          />
        </Form.Group>

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
          existing={
            initialData.mainImage
              ? [`http://localhost:5000${initialData.mainImage}`]
              : []
          }
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
          existing={
            initialData.gallery?.map((g) => `http://localhost:5000${g.url}`) ||
            []
          }
        />

        <Button type="submit" variant="primary" className="w-100">
          {submitLabel}
        </Button>
        <Link to={`/event/${initialData.id}`} className="text-decoration-none">
          <Button type="submit" variant="danger" className="w-100 mt-2">
            Zrušiť
          </Button>
        </Link>
      </Form>
    </div>
  );
};

export default EventForm;
