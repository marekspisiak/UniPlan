import { useState, useEffect } from "react";
import { Button, Alert } from "react-bootstrap";

const ResendVerificationButton = ({ auto = false }) => {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasAutoSent, setHasAutoSent] = useState(false);

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

  // 🔁 automatické spustenie len raz
  useEffect(() => {
    if (auto && !hasAutoSent) {
      handleResend();
      setHasAutoSent(true);
    }
  }, [auto, hasAutoSent]);

  return (
    <>
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
    </>
  );
};

export default ResendVerificationButton;
