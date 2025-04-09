import AuthLayout from "../../layouts/AuthLayout";
import LoginForm from "../../components/LoginForm/LoginForm";

const LoginPage = () => {
  return (
    <AuthLayout>
      <h4 className="mb-3">Prihlásenie</h4>
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
