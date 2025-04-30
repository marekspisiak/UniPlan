import { Form, Button } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../validation/schemas";
import { useAuth } from "../../context/AuthContext";
import styles from "./LoginForm.module.scss";
import Toast from "../Toast/Toast";
import { useState } from "react";

const LoginForm = () => {
  const { loadUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Prihlásenie zlyhalo");
      }

      localStorage.setItem("token", result.token);
      const userData = await loadUser();

      if (!userData?.emailVerified) {
        navigate("/email-reverify");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && <Toast error={error} onClose={() => setError(null)} />}

      <Form.Group className="mb-3" controlId="formEmail">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          {...register("email")}
          isInvalid={!!errors.email}
        />
        <Form.Control.Feedback type="invalid">
          {errors.email?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-4" controlId="formPassword">
        <Form.Label>Heslo</Form.Label>
        <Form.Control
          type="password"
          {...register("password")}
          isInvalid={!!errors.password}
        />
        <Form.Control.Feedback type="invalid">
          {errors.password?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Button variant="primary" type="submit" className="w-100">
        Prihlásiť sa
      </Button>

      <div className={`text-center mt-3 ${styles.footer}`}>
        <span>Nemáte účet? </span>
        <Link to="/register" className={styles.link}>
          Zaregistrujte sa
        </Link>
      </div>
    </Form>
  );
};

export default LoginForm;
