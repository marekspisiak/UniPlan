import Header from "../components/Header/Header";
import "./AuthLayout.scss";

const AuthLayout = ({ children }) => {
  return (
    <>
      <Header minimal />
      <div className="auth-layout">
        <div className="auth-box">{children}</div>
      </div>
    </>
  );
};

export default AuthLayout;
