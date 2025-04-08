import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { Container, Row, Col } from "react-bootstrap";
import "./MainLayout.scss";

const MainLayout = ({ left, center, right }) => {
  return (
    <div style={{ paddingTop: "40px" }}>
      <Header />
      <Container fluid className="main-layout">
        <Row>
          <Col xs={12} md={3} className="left-panel">
            {left}
          </Col>
          <Col xs={12} md={6} className="center-panel">
            {center}
          </Col>
          <Col xs={12} md={3} className="right-panel">
            {right}
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
};

export default MainLayout;
