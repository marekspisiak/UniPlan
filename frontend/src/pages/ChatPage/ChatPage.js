import ChatWindow from "../../modules/ChatWindow/ChatWindow";
import MobileLayout from "../../layouts/MobileLayout";
import MiniChatList from "../../components/MiniChatList/MiniChatList";
import ChatModal from "../../components/ChatModal/ChatModal";
import { useChatModal } from "../../context/ChatModalContext";
import { useAuth } from "../../context/AuthContext";

const ChatPage = () => {
  const { openedRoomId, openChat, closeChat } = useChatModal();
  const { user } = useAuth();
  return (
    <MobileLayout>
      <MiniChatList
        onOpenChat={(room) => {
          openChat(room); // cez hook
        }}
      />
      {console.log(openedRoomId)}
      <ChatModal show={!!openedRoomId} onHide={closeChat}>
        {openedRoomId && <ChatPage roomId={openedRoomId} userId={user.id} />}
      </ChatModal>
    </MobileLayout>
  );
};

export default ChatPage;
