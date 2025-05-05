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
    try {
      await joinRoom(room.id);

      await reloadRooms();
      console.log("zobrazujem spravy");
      openChat(room);
    } catch (err) {
      console.error("Nepodarilo sa pripojiť do miestnosti:", err.message);
      // Môžeš zobraziť toast / alert
    }
  };

  return (
    <button className={styles.chatButton} onClick={handleJoin}>
      Chat
    </button>
  );
};

export default JoinRoomButton;
