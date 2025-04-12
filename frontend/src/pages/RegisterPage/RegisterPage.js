import AuthLayout from "../../layouts/AuthLayout";
import RegisterForm from "../../components/RegisterForm/RegisterForm";
import styles from "./RegisterPage.module.scss";

const RegisterPage = () => {
  return (
    <AuthLayout>
      <h4 className={styles.heading}>Registrácia</h4>
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;
