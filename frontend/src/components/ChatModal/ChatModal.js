// ChatModal.jsx
import { Modal } from "react-bootstrap";
import { useChatModal } from "../../context/ChatModalContext";
import styles from "./ChatModal.module.scss";
import Chat from "../Chat/Chat";

const ChatModal = () => {
  const { roomData, closeChat } = useChatModal();
  const openedRoomId = roomData?.id;
  console.log(roomData);

  return (
    <Modal
      show={!!openedRoomId}
      onHide={closeChat}
      centered
      size="lg"
      keyboard={true}
      dialogClassName={styles.modalDialog}
      contentClassName={styles.modalContent}
    >
      <Modal.Body className={styles.modalBody}>
        {openedRoomId && <Chat roomId={openedRoomId} />}
      </Modal.Body>
    </Modal>
  );
};

export default ChatModal;
