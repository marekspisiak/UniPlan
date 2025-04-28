import { useEffect, useState } from "react";
import { Form, Button, Alert, Spinner, Container } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import CategoryMultiSelect from "../CategoryMultiSelect/CategoryMultiSelect";
import styles from "./EditProfileCard.module.scss";
import Toast from "../Toast/Toast";

const EditProfileCard = ({ setIsEditing }) => {
  const { user, logout, loadUser } = useAuth();

  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    confirmEmail: "", // nové pole pre potvrdenie
    interests: user?.interests?.map((i) => i.id) || [],
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (form.email !== user.email && form.email !== form.confirmEmail) {
      setError("Email a potvrdenie emailu sa nezhodujú.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("email", form.email);
      form.interests.forEach((id) => formData.append("interests[]", id));
      if (form.photo) formData.append("photo", form.photo);

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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

  if (!user)
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "50vh" }}
      >
        <Spinner animation="border" />
      </Container>
    );

  return (
    <div className={styles.editProfileCard}>
      <h5>Úprava profilu</h5>

      {error && <Toast error={error} onClose={() => setError("")} />}
      {message && <Toast success={message} onClose={() => setMessage("")} />}

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

        {/* Ak zmenil email, zobraz potvrdenie */}
        {form.email !== user.email && (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Potvrď nový email</Form.Label>
              <Form.Control
                type="email"
                name="confirmEmail"
                value={form.confirmEmail}
                onChange={handleChange}
                required
              />
            </Form.Group>
            <Alert variant="warning">
              Upozornenie: Po zmene emailu sa budete musieť prihlásiť cez nový
              email. Ak stratíte prístup k novému emailu, nebudete sa môcť
              prihlásiť.
            </Alert>
          </>
        )}

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
        <Button
          type="button"
          variant="danger"
          className="w-100 mt-2"
          onClick={() => setIsEditing(false)}
        >
          Zrušiť
        </Button>
      </Form>
    </div>
  );
};

export default EditProfileCard;
