import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import { Container, Row, Col } from "react-bootstrap";
import styles from "./MainLayout.module.scss";
import MobileNav from "../components/MobileNav/MobileNav";
import { useMediaQuery } from "react-responsive";
import { Link } from "react-router-dom";
import { MessageSquare, MessageCircle } from "lucide-react";
import { useState } from "react";
import Popup from "../components/Popup/Popup";
import { useRoomContext } from "../context/RoomContext";

const MainLayout = ({ left, center, right }) => {
  const tablet = useMediaQuery({ maxWidth: 1100 });
  const [isOpen, setIsOpen] = useState(false);
  const { newMessage } = useRoomContext();

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
              md={left && right ? 6 : tablet ? 12 : 9}
              className={`${styles.centerPanel} ${
                !left && !right ? styles.centered : ""
              }`}
            >
              {center}
            </Col>
            {right && !tablet && (
              <Col xs={12} md={3} className={styles.rightPanel}>
                {right}
              </Col>
            )}
          </Row>
        </Container>
        <Popup isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <div className={styles.popupContentWrapper}>{right}</div>
        </Popup>
        {tablet && (
          <div className={styles.chatButtonWrapper}>
            <div style={{ position: "relative" }}>
              {newMessage && <span className={styles.chatButtonNotification} />}
              <button
                className={styles.chatButton}
                onClick={() => setIsOpen(true)}
              >
                <MessageSquare size={24} />
              </button>
            </div>
          </div>
        )}
      </main>

      <MobileNav />
      <Footer />
    </div>
  );
};

export default MainLayout;
