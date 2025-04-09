import Header from "../components/Header/Header";
import styles from "./AuthLayout.module.scss";

const AuthLayout = ({ children }) => {
  return (
    <>
      <Header minimal />
      <div className={styles.authLayout}>
        <div className={styles.authLeft}>
          <h1 className={styles.heading}>UniPlan</h1>
          <p className={styles.subtitle}>
            Tvoj osobný študentský organizér.
            <br />
            Plánuj, komunikuj, buď v obraze.
          </p>
        </div>
        <div className={styles.authBox}>{children}</div>
      </div>
    </>
  );
};

export default AuthLayout;
