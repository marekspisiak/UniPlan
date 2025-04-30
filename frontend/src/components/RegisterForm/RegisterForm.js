import { Form, Button } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../validation/schemas";
import styles from "./RegisterForm.module.scss";
import Toast from "../Toast/Toast";
import { useState } from "react";

const RegisterForm = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setMessage(null);
    setError(null);

    console.log("fetchujem");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "Chyba pri registrácii.");
      }

      setMessage(responseData.message);
      navigate("/email-info");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      {error && <Toast error={error} onClose={() => setError(null)} />}
      {message && <Toast success={message} onClose={() => setMessage(null)} />}

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Form.Group className="mb-3" controlId="formFirstName">
          <Form.Label>Meno</Form.Label>
          <Form.Control
            type="text"
            {...register("firstName")}
            isInvalid={!!errors.firstName}
          />
          <Form.Control.Feedback type="invalid">
            {errors.firstName?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formLastName">
          <Form.Label>Priezvisko</Form.Label>
          <Form.Control
            type="text"
            {...register("lastName")}
            isInvalid={!!errors.lastName}
          />
          <Form.Control.Feedback type="invalid">
            {errors.lastName?.message}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className="mb-3" controlId="formEmail">
          <Form.Label>Školský email</Form.Label>
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
          Registrovať sa
        </Button>

        <div className="text-center mt-3">
          <span>Už máte účet? </span>
          <Link to="/login">Prihláste sa</Link>
        </div>
      </Form>
    </>
  );
};

export default RegisterForm;
