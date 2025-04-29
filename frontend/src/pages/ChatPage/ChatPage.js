import ChatWindow from "../../modules/ChatWindow/ChatWindow";
import MobileLayout from "../../layouts/MobileLayout";
import MiniChatList from "../../components/MiniChatList/MiniChatList";
import ChatModal from "../../components/ChatModal/ChatModal";
import { useChatModal } from "../../context/ChatModalContext";
import { useAuth } from "../../context/AuthContext";
import Chat from "../../components/Chat/Chat";

const ChatPage = () => {
  const { openedRoomId, openChat, closeChat } = useChatModal();
  const { user } = useAuth();
  console.log("renderujem sa");
  return (
    <>
      <MobileLayout>
        <MiniChatList
          onOpenChat={(room) => {
            openChat(room); // cez hook
          }}
        />
      </MobileLayout>
      <ChatModal show={!!openedRoomId} onHide={closeChat}>
        {openedRoomId && <Chat roomId={openedRoomId} userId={user.id} />}
      </ChatModal>
    </>
  );
};

export default ChatPage;
