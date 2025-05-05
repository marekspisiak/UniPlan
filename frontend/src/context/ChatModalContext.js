import { createContext, useContext, useState } from "react";
import { useRoomContext } from "./RoomContext";

const ChatModalContext = createContext();

export const ChatModalProvider = ({ children }) => {
  const { getRoomDataById } = useRoomContext(); // tu sú napr. formattedRooms
  const [roomId, setRoomId] = useState(null);

  const roomData = roomId ? getRoomDataById(roomId) : null;

  const openChat = (roomOrId) => {
    const id = typeof roomOrId === "object" ? roomOrId.id : roomOrId;
    setRoomId(id);
  };

  const closeChat = () => setRoomId(null);

  return (
    <ChatModalContext.Provider
      value={{
        openChat,
        closeChat,
        roomData, // prístup ku všetkým dátam z kontextu RoomContext
      }}
    >
      {children}
    </ChatModalContext.Provider>
  );
};

export const useChatModal = () => useContext(ChatModalContext);
