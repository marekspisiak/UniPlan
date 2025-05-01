import { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import Toast from "../Toast/Toast";
import styles from "./ChangePasswordForm.module.scss";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValidatedField } from "../ValidateComponents/ValidateComponents";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Zadaj aktuálne heslo"),
    newPassword: z.string().min(6, "Heslo musí mať aspoň 6 znakov"),
    confirmPassword: z.string().min(1, "Potvrď nové heslo"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Nové heslá sa nezhodujú.",
  });

const ChangePasswordForm = ({ setIsChangingPassword }) => {
  const { logout } = useAuth();
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "Nepodarilo sa zmeniť heslo");

      setMessage("Heslo bolo úspešne zmenené. Boli ste odhlásený.");
      reset();
      setTimeout(() => logout(), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.changePasswordForm}>
      <h5>Zmena hesla</h5>

      {error && <Toast error={error} onClose={() => setError(null)} />}
      {message && <Toast success={message} onClose={() => setMessage(null)} />}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <ValidatedField
          type="password"
          name="currentPassword"
          label="Aktuálne heslo"
          register={register}
          errors={errors}
        />
        <ValidatedField
          type="password"
          name="newPassword"
          label="Nové heslo"
          register={register}
          errors={errors}
        />
        <ValidatedField
          type="password"
          name="confirmPassword"
          label="Potvrď nové heslo"
          register={register}
          errors={errors}
        />

        <Button type="submit" className="w-100" disabled={isSubmitting}>
          {isSubmitting ? "Ukladám..." : "Zmeniť heslo"}
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
