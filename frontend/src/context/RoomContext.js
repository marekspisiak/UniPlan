import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useChatModal } from "../hooks/useChatModal";

const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const { user, socket } = useAuth();

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/rooms/my-rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRooms(data);

      // 🔥 Po fetchnutí miestností sa hneď pripojím do všetkých roomiek
      const roomIds = data.map((item) => item.id);

      socket.emit("joinRooms", {
        roomIds,
        userId: user.id,
      });
    } catch (err) {
      console.error("Nepodarilo sa načítať miestnosti", err);
    }
  };

  useEffect(() => {
    if (!user || !socket) return;
    fetchRooms();

    const handleNewMessage = (message) => {
      const { roomId, text, createdAt } = message;
      console.log("nova sprava");

      setRooms((prevRooms) => {
        // Aktualizujeme miestnosť s novou správou
        const updatedRooms = prevRooms.map((room) =>
          room.id === roomId
            ? {
                ...room,
                lastMessage: text,
                lastMessageTime: createdAt,
              }
            : room
        );

        // Najdeme miestnosť, ktorá sa má posunúť hore
        const updatedRoom = updatedRooms.find((room) => room.id === roomId);

        // Vytvoríme nový zoznam: miestnosť s novou správou ide navrch
        return [
          updatedRoom,
          ...updatedRooms.filter((room) => room.id !== roomId),
        ];
      });
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [user, socket]);

  const reloadRooms = () => {
    fetchRooms();
  };

  const markRoomAsOpened = async (roomId) => {
    console.log("nastavujem videne");
    setRooms((prevRooms) =>
      prevRooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              lastSeen: new Date().toISOString(),
            }
          : room
      )
    );

    console.log(new Date().toISOString());
    if (user.id) {
      socket.emit("user-seen", {
        roomId: roomId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        reloadRooms,
        markRoomAsOpened,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoomContext = () => useContext(RoomContext);
