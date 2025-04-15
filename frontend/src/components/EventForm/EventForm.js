import { useState, useEffect, useRef } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import CategoryMultiSelect from "../CategoryMultiSelect/CategoryMultiSelect";
import styles from "./EventForm.module.scss";
import ImageUploader from "../ImageUploader/ImageUploader";
import ModeratorSelector from "../ModeratorSelector/ModeratorSelector";

const EventForm = () => {
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
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const mainImageRef = useRef();
  const galleryRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "categoryIds" || key === "moderators") {
          value.forEach((v) => formData.append(key, v));
        } else if (key === "gallery") {
          value.forEach((img) => formData.append("gallery", img));
        } else if (key === "mainImage" && value) {
          formData.append("mainImage", value);
        } else {
          formData.append(key, value);
        }
      });

      const res = await fetch("http://localhost:5000/api/events/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Nepodarilo sa vytvoriť akciu");

      setSuccess("Akcia bola úspešne vytvorená.");
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
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.eventForm}>
      <h4 className={styles.heading}>Vytvoriť novú akciu</h4>

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
          onChange={(file) => setForm((prev) => ({ ...prev, mainImage: file }))}
          multiple={false}
        />

        <ImageUploader
          ref={galleryRef}
          label="Galéria (max 5 fotiek)"
          onChange={(files) => setForm((prev) => ({ ...prev, gallery: files }))}
          multiple
          max={5}
        />

        <Button type="submit" variant="primary" className="w-100">
          Vytvoriť akciu
        </Button>
      </Form>
    </div>
  );
};

export default EventForm;
