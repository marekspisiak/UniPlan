import { useChatRoom } from "../../hooks/useChatRoom";
import { useAuth } from "../../context/AuthContext";
import styles from "./JoinRoomButton.module.scss"; // <<< Import správneho modulu
import { useChatModal } from "../../context/ChatModalContext";
import { useRoomContext } from "../../context/RoomContext";

const JoinRoomButton = ({ room }) => {
  const { user } = useAuth();
  const userId = user.id;
  const { joinRoom } = useChatRoom(userId);
  const { openChat } = useChatModal();
  const { reloadRooms } = useRoomContext();
  const handleJoin = async () => {
    joinRoom(room.id);
    reloadRooms();
    openChat(room);
  };

  return (
    <button className={styles.chatButton} onClick={handleJoin}>
      Chat
    </button>
  );
};

export default JoinRoomButton;
