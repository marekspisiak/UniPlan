import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Alert, Button, Container, Spinner } from "react-bootstrap";
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
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
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

  const handleClick = () => {
    window.location.href = "/login"; // hard reload
  };

  return (
    <AuthLayout>
      <h4 className="mb-3">Overenie emailu</h4>

      {status === "loading" && (
        <Container
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "50vh" }}
        >
          <Spinner animation="border" />
        </Container>
      )}
      {status === "success" && <Alert variant="success">{message}</Alert>}
      {status === "error" && <Alert variant="danger">{message}</Alert>}
      <Button className="mt-3 w-100" onClick={handleClick}>
        Prejsť na prihlásenie
      </Button>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
