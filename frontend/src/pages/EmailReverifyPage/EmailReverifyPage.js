import styles from "./EmailReverifyPage.module.scss";
import Header from "../../components/Header/Header";
import LogoutButton from "../../components/LogoutButton/LogoutButton";
import ResendVerificationButton from "../../components/ResendVerificationButton/ResendVerificationButton";

const EmailReverifyPage = () => {
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

          <ResendVerificationButton auto />
          <LogoutButton />
        </div>
      </div>
    </div>
  );
};

export default EmailReverifyPage;
