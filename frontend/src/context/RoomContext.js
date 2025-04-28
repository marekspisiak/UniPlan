import { createContext, useContext, useState, useEffect } from "react";
import socket from "../socket/socket";
import { useAuth } from "./AuthContext";
import { useChatModal } from "../hooks/useChatModal";

const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  const [rooms, setRooms] = useState([]);
  const { user } = useAuth();

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/rooms/my-rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRooms(data);

      // 🔥 Po fetchnutí miestností sa hneď pripojím do všetkých roomiek
      data.forEach((room) => {
        socket.emit("joinRoom", {
          roomId: room.id,
          userId: user.id,
        });
      });
    } catch (err) {
      console.error("Nepodarilo sa načítať miestnosti", err);
    }
  };

  console.log(rooms);

  useEffect(() => {
    if (!user) return;
    fetchRooms();

    const handleNewMessage = (message) => {
      const { roomId, text, createdAt } = message;

      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.id === roomId
            ? {
                ...room,
                lastMessage: text,
                lastMessageTime: createdAt,
              }
            : room
        )
      );
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [user]);

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

    // socket.emit("user-seen", {
    //   roomId: roomId,
    //   userId,
    //   timestamp: new Date().toISOString(),
    // });
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
