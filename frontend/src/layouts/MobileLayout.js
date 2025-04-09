import Header from "../components/Header/Header";
import MobileNav from "../components/MobileNav/MobileNav";
import styles from "./MobileLayout.module.scss";

const MobileLayout = ({ children }) => {
  return (
    <div className={styles.mobileLayout}>
      <Header />
      <main>{children}</main>
      <MobileNav />
    </div>
  );
};

export default MobileLayout;
