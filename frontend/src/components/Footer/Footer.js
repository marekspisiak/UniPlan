import { Container } from "react-bootstrap";
import styles from "./Footer.module.scss";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Container>
        <p>© 2025 Žilinská univerzita – Aplikácia pre plánovanie aktivít</p>
      </Container>
    </footer>
  );
};

export default Footer;
