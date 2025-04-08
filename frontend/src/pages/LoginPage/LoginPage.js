import { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import AuthLayout from "../../layouts/AuthLayout";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./LoginPage.scss";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const { loadUser } = useAuth();

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Prihlásenie zlyhalo");
      }

      // ✅ uložíme token do localStorage
      localStorage.setItem("token", data.token);

      await loadUser();

      // 🔄 Môžeš tu neskôr nastaviť aj AuthContext
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout>
      <h4 className="mb-3">Prihlásenie</h4>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label>Email</Form.Label>
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
          />
        </Form.Group>

        <Button variant="primary" type="submit" className="w-100">
          Prihlásiť sa
        </Button>
        <div className="text-center mt-3">
          <span>Nemáte účet? </span>
          <Link to="/register">Zaregistrujte sa</Link>
        </div>
      </Form>
    </AuthLayout>
  );
};

export default LoginPage;
