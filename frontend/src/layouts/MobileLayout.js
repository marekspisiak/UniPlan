import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import MobileNav from "../components/MobileNav/MobileNav";
import styles from "./MobileLayout.module.scss";

const MobileLayout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.mainContent}>{children}</main>
      <MobileNav />
      <Footer />
    </div>
  );
};

export default MobileLayout;
