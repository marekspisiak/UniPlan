import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./MainLayout.module.scss";

const MainLayout = ({ left, center, right }) => {
  return (
    <div style={{ paddingTop: "40px" }}>
      <Header />
      <Container fluid className={styles.mainLayout}>
        <Row>
          <Col xs={12} md={3} className={styles.leftPanel}>
            {left}
          </Col>
          <Col xs={12} md={6} className={styles.centerPanel}>
            {center}
          </Col>
          <Col xs={12} md={3} className={styles.rightPanel}>
            {right}
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
};

export default MainLayout;
