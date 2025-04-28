import { Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./ChatModal.module.scss"; // <<< Importuj SCSS modul

const ChatModal = ({ show, onHide, children }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
      keyboard={true}
      dialogClassName={styles.modalDialog} // Použi modul
      contentClassName={styles.modalContent} // ✨ aj content
    >
      <Modal.Body className={styles.modalBody}>{children}</Modal.Body>
    </Modal>
  );
};

export default ChatModal;
