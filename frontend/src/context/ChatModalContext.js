// /context/ChatModalContext.js
import { createContext, useContext, useState } from "react";

const ChatModalContext = createContext();

export const ChatModalProvider = ({ children }) => {
  const [openedRoomId, setOpenedRoomId] = useState(null);
  const [roomTitle, setRoomTitle] = useState(null);

  const openChat = (room) => {
    setOpenedRoomId(room.id);
    setRoomTitle(room.title);
  };
  const closeChat = () => setOpenedRoomId(null);

  return (
    <ChatModalContext.Provider
      value={{ openedRoomId, roomTitle, openChat, closeChat }}
    >
      {children}
    </ChatModalContext.Provider>
  );
};

export const useChatModal = () => useContext(ChatModalContext);
