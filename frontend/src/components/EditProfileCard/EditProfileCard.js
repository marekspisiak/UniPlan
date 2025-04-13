import { useState, useEffect } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import CategoryMultiSelect from "../CategoryMultiSelect/CategoryMultiSelect";
import styles from "./EditProfileCard.module.scss";

const EditProfileCard = ({ setIsEditing }) => {
  const { user, logout, loadUser } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    interests: [],
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/user/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const userData = await res.json();
        if (!res.ok) throw new Error("Chyba pri načítaní profilu");

        setForm({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          interests: userData.interests || [],
        });
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("email", form.email);
      form.interests.forEach((id) => formData.append("interests[]", id)); // ⬅️ oprava
      if (form.photo) formData.append("photo", form.photo);

      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          // ❌ žiadny 'Content-Type' tu, browser to nastaví sám!
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri ukladaní.");

      if (data.reverify) {
        logout();
        return;
      }

      setMessage("Profil bol aktualizovaný.");
      loadUser();
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) setForm((prev) => ({ ...prev, photo: file }));
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <div className={styles.editProfileCard}>
      <h5>Úprava profilu</h5>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Meno</Form.Label>
          <Form.Control
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Priezvisko</Form.Label>
          <Form.Control
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Záujmy</Form.Label>
          <CategoryMultiSelect
            selectedIds={form.interests}
            onChange={(ids) => setForm({ ...form, interests: ids })}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Profilová fotka</Form.Label>
          <Form.Control
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
        </Form.Group>

        <Button type="submit" className="w-100" disabled={uploading}>
          {uploading ? "Ukladám..." : "Uložiť"}
        </Button>
      </Form>
    </div>
  );
};

export default EditProfileCard;
