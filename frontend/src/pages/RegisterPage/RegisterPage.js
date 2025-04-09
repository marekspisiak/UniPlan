import { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import AuthLayout from "../../layouts/AuthLayout";
import { useNavigate, Link } from "react-router-dom";
import styles from "./RegisterPage.module.scss";

const RegisterPage = () => {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Chyba pri registrácii.");
      }

      setMessage(data.message);
      setForm({ firstName: "", lastName: "", email: "", password: "" });
      navigate("/email-info");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout>
      <h4 className={styles.heading}>Registrácia</h4>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formFirstName">
          <Form.Label>Meno</Form.Label>
          <Form.Control
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formLastName">
          <Form.Label>Priezvisko</Form.Label>
          <Form.Control
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label>Školský email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-4" controlId="formPassword">
          <Form.Label>Heslo</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100">
          Registrovať sa
        </Button>
        <div className="text-center mt-3">
          <span>Už máte účet? </span>
          <Link to="/login">Prihláste sa</Link>
        </div>
      </Form>
    </AuthLayout>
  );
};

export default RegisterPage;
