import { useState, useEffect } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import Select from "react-select";

import styles from "./EventForm.module.scss";

const EventForm = () => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const options = categories.map((cat) => ({
    value: cat.id,
    label: `${cat.icon || ""} ${cat.label}`,
  }));

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    capacity: "",
    categoryIds: [], // ← teraz pole
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/api/events/categories", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Chyba pri načítaní kategórií:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, multiple, selectedOptions } = e.target;

    if (name === "categoryIds" && multiple) {
      const values = Array.from(selectedOptions, (option) =>
        parseInt(option.value)
      );
      setForm((prev) => ({ ...prev, categoryIds: values }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5000/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Nepodarilo sa vytvoriť akciu");

      setSuccess("Akcia bola úspešne vytvorená.");
      setForm({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        capacity: "",
        category: "",
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

      <Form onSubmit={handleSubmit}>
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
            name="time"
            value={form.time}
            onChange={handleChange}
            required
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
          <Select
            isMulti
            options={options}
            value={
              form.categoryIds
                ? options.filter((o) => form.categoryIds.includes(o.value))
                : []
            }
            onChange={(selected) =>
              setForm({ ...form, categoryIds: selected.map((s) => s.value) })
            }
            classNamePrefix="react-select"
          />
        </Form.Group>

        <Button type="submit" variant="primary" className="w-100">
          Vytvoriť akciu
        </Button>
      </Form>
    </div>
  );
};

export default EventForm;
