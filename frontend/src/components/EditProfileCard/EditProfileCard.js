import { useEffect, useRef, useState } from "react";
import { Form, Button, Alert, Spinner, Container } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import CategoryMultiSelect from "../CategoryMultiSelect/CategoryMultiSelect";
import styles from "./EditProfileCard.module.scss";
import Toast from "../Toast/Toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ImageUploader from "../ImageUploader/ImageUploader";
import { getEditProfileSchema } from "../../validation/schemas";
import { ValidatedField } from "../ValidateComponents/ValidateComponents";

const EditProfileCard = ({ setIsEditing }) => {
  const { user, logout, loadUser } = useAuth();
  const mainImageRef = useRef();
  console.log(user);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(getEditProfileSchema(user?.email || "")),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      confirmEmail: "",
      interests: user?.interests?.map((i) => i.id) || [],
      mainImageChanged: false,
    },
  });

  const onError = (errors) => {
    console.warn("CHYBY VO FORMULÁRI:", errors);
  };

  const email = watch("email");
  const confirmEmail = watch("confirmEmail");
  const mainImage = watch("mainImage");
  const interests = watch("interests");

  useEffect(() => {
    setValue("mainImage", user?.profileImageUrl ? [user.profileImageUrl] : []);
  }, [user, setValue]);

  const onSubmit = async (form) => {
    setMessage(null);
    setError(null);

    if (form.email !== user.email && form.email !== form.confirmEmail) {
      setError("Email a potvrdenie emailu sa nezhodujú.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("firstName", form.firstName);
      formData.append("lastName", form.lastName);
      formData.append("mainImageChanged", form.mainImageChanged);
      if (form.email !== user.email) {
        formData.append("email", form.email);
      }
      form.interests.forEach((id) => formData.append("interests[]", id));
      if (mainImage?.[0] instanceof File) {
        formData.append("photo", mainImage[0]);
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Chyba pri ukladaní.");

      if (data.reverify) {
        logout();
        return;
      }

      setMessage("Profil bol aktualizovaný.");
      loadUser();
      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user)
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "50vh" }}
      >
        <Spinner animation="border" />
      </Container>
    );

  return (
    <div className={styles.editProfileCard}>
      <h5>Úprava profilu</h5>

      {error && <Toast error={error} onClose={() => setError("")} />}
      {message && <Toast success={message} onClose={() => setMessage("")} />}

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ValidatedField
          type="text"
          name="firstName"
          label="Meno"
          register={register}
          errors={errors}
        />

        <ValidatedField
          type="text"
          name="lastName"
          label="Priezvisko"
          register={register}
          errors={errors}
        />

        <ValidatedField
          type="email"
          name="email"
          label="Email"
          register={register}
          errors={errors}
        />

        {email !== user.email && (
          <>
            <ValidatedField
              type="email"
              name="confirmEmail"
              label="Potvrď nový email"
              register={register}
              errors={errors}
            />
            <Alert variant="warning">
              Upozornenie: Po zmene emailu sa budete musieť prihlásiť cez nový
              email. Ak stratíte prístup k novému emailu, nebudete sa môcť
              prihlásiť.
            </Alert>
          </>
        )}

        <Form.Group className="mb-3">
          <Form.Label>Záujmy</Form.Label>
          <CategoryMultiSelect
            selectedIds={interests}
            onChange={(ids) => setValue("interests", ids)}
          />
        </Form.Group>

        <ImageUploader
          ref={mainImageRef}
          label="Profilová fotka (nepovinná)"
          onChange={({ files }) => {
            setValue("mainImage", files);
            setValue("mainImageChanged", true);
          }}
          multiple={false}
          existing={mainImage?.length > 0 ? [`${mainImage}`] : []}
        />

        <Button type="submit" className="w-100" disabled={uploading}>
          {uploading ? "Ukladám..." : "Uložiť"}
        </Button>
        <Button
          type="button"
          variant="danger"
          className="w-100 mt-2"
          onClick={() => setIsEditing(false)}
        >
          Zrušiť
        </Button>
      </Form>
    </div>
  );
};

export default EditProfileCard;
