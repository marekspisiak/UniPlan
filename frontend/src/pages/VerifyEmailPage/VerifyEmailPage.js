import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Alert, Button, Spinner } from "react-bootstrap";
import AuthLayout from "../../layouts/AuthLayout";

const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Token chýba.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/auth/verify-email?token=${token}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Overenie zlyhalo");
        }

        setStatus("success");
        setMessage(data.message);
      } catch (err) {
        setStatus("error");
        setMessage(err.message);
      }
    };

    verify();
  }, [params]);

  return (
    <AuthLayout>
      <h4 className="mb-3">Overenie emailu</h4>

      {status === "loading" && <Spinner animation="border" />}
      {status === "success" && <Alert variant="success">{message}</Alert>}
      {status === "error" && <Alert variant="danger">{message}</Alert>}
      <Link to="/login">
        <Button className="mt-3 w-100">Prejsť na prihlásenie</Button>
      </Link>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
