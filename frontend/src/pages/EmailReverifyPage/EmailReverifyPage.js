import { useState, useEffect } from "react";
import { Button, Alert, Container } from "react-bootstrap";
import styles from "./EmailReverifyPage.module.scss";
import Header from "../../components/Header/Header";
import LogoutButton from "../../components/LogoutButton/LogoutButton";

const EmailReverifyPage = () => {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/resend-verification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Chyba pri odosielaní emailu");

      setMessage(data.message || "Overovací email bol znovu odoslaný.");
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    handleResend();
  }, []);

  return (
    <div>
      <Header minimal />
      <div className={styles.wrapper}>
        <div className={styles.box}>
          <h4 className="mb-3">Overenie emailu</h4>

          <p className="mb-3">
            Tvoja emailová adresa ešte nebola overená alebo overenie vypršalo.
            Pre pokračovanie musíš overiť svoj školský email.
          </p>
          <p className="mb-3">
            Skontroluj si svoju emailovú schránku môže to trvať niekoľko minút.
          </p>

          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          <Button
            variant="primary"
            onClick={handleResend}
            disabled={loading}
            className="w-100"
          >
            {loading ? "Odosielam..." : "Znova odoslať overovací email"}
          </Button>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
};

export default EmailReverifyPage;
