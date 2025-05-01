import { useState } from "react";
import { Form, Button, Alert, Container, Spinner } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import Toast from "../Toast/Toast";
import styles from "./ChangePasswordForm.module.scss";

const ChangePasswordForm = ({ setIsChangingPassword }) => {
  const { logout } = useAuth();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (form.newPassword !== form.confirmPassword) {
      setError("Nové heslá sa nezhodujú.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Nepodarilo sa zmeniť heslo.");

      setMessage("Heslo bolo úspešne zmenené. Boli ste odhlásený.");
      setTimeout(() => {
        logout(); // odhlásenie po zmene hesla
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.changePasswordForm}>
      <h5>Zmena hesla</h5>

      {error && <Toast error={error} onClose={() => setError("")} />}
      {message && <Toast success={message} onClose={() => setMessage("")} />}

      <Form onSubmit={handleSubmit}>
        <Form.Group className={styles.formGroup}>
          <Form.Label>Aktuálne heslo</Form.Label>
          <Form.Control
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className={styles.formGroup}>
          <Form.Label>Nové heslo</Form.Label>
          <Form.Control
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className={styles.formGroup}>
          <Form.Label>Potvrď nové heslo</Form.Label>
          <Form.Control
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Button type="submit" className="w-100" disabled={loading}>
          {loading ? "Ukladám..." : "Zmeniť heslo"}
        </Button>
        <Button
          type="button"
          variant="danger"
          className="w-100 mt-2"
          onClick={() => setIsChangingPassword(false)}
        >
          Zrušiť
        </Button>
      </Form>
    </div>
  );
};

export default ChangePasswordForm;
