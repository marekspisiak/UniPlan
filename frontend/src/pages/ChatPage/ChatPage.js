import ChatWindow from "../../modules/ChatWindow/ChatWindow";
import MobileLayout from "../../layouts/MobileLayout";
import MiniChatList from "../../components/MiniChatList/MiniChatList";
import ChatModal from "../../components/ChatModal/ChatModal";
import { useChatModal } from "../../context/ChatModalContext";
import { useAuth } from "../../context/AuthContext";
import Chat from "../../components/Chat/Chat";

const ChatPage = () => {
  const { openChat } = useChatModal();

  return (
    <>
      <MobileLayout>
        <MiniChatList
          onOpenChat={(room) => {
            openChat(room); // cez hook
          }}
        />
      </MobileLayout>
    </>
  );
};

export default ChatPage;
