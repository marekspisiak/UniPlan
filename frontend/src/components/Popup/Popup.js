import { Modal } from "react-bootstrap";
import styles from "./Popup.module.scss";

const Popup = ({ isOpen, onClose, children }) => {
  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      centered
      backdrop="static"
      keyboard={true}
      contentClassName={styles.popup} // 👈 aplikuje tvoje štýly na Modal
      dialogClassName={styles.popupDialog} // 👈 ak chceš extra štýly na obal
    >
      <Modal.Body className="position-relative">
        <button type="button" className={styles.closeButton} onClick={onClose}>
          &times;
        </button>

        {children}
      </Modal.Body>
    </Modal>
  );
};

export default Popup;
