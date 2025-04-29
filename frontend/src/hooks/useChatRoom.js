import { useState, useEffect } from "react";

import { useAuth } from "../context/AuthContext";

export const useChatRoom = (userId) => {
  const [connectedRoomId, setConnectedRoomId] = useState(null);
  const { socket } = useAuth();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("joinedRoom", ({ roomId }) => {
      setConnectedRoomId(roomId);
    });

    socket.on("leftRoom", ({ roomId }) => {
      if (connectedRoomId === roomId) {
        setConnectedRoomId(null);
      }
    });

    return () => {
      socket.off("joinedRoom");
      socket.off("leftRoom");
    };
  }, [connectedRoomId]);

  const joinRoom = (roomId) => {
    if (userId && roomId) {
      socket.emit("joinRoom", { roomId, userId });
    }
  };

  const leaveRoom = (roomId) => {
    if (userId && roomId) {
      socket.emit("leaveRoom", { roomId, userId });
    }
  };

  return {
    socket,
    connectedRoomId,
    joinRoom,
    leaveRoom,
  };
};
