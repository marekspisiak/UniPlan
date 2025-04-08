import Header from "../components/Header/Header";
import "./AuthLayout.scss";

const AuthLayout = ({ children }) => {
  return (
    <>
      <Header minimal />
      <div className="auth-layout">
        <div className="auth-left">
          <h1>UniPlan</h1>
          <p className="auth-subtitle">
            Tvoj osobný študentský organizér.
            <br />
            Plánuj, komunikuj, buď v obraze.
          </p>
          {/* Tu môžeš dať aj SVG/obrázok neskôr */}
        </div>
        <div className="auth-box">{children}</div>
      </div>
    </>
  );
};

export default AuthLayout;
