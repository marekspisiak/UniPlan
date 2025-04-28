import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./MainLayout.module.scss";
import MobileNav from "../components/MobileNav/MobileNav";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

const MainLayout = ({ left, center, right }) => {
  return (
    <div className={styles.layout}>
      <Header />

      <main className={styles.mainContent}>
        <Container fluid className={styles.mainLayout}>
          <Row>
            {left && (
              <Col xs={12} md={3} className={styles.leftPanel}>
                {left}
              </Col>
            )}
            <Col
              xs={12}
              md={left && right ? 6 : 9}
              className={`${styles.centerPanel} ${
                !left && !right ? styles.centered : ""
              }`}
            >
              {center}
            </Col>
            {right && (
              <Col xs={12} md={3} className={styles.rightPanel}>
                {right}
              </Col>
            )}
          </Row>
        </Container>
      </main>

      <MobileNav />
      <Footer />
    </div>
  );
};

export default MainLayout;
