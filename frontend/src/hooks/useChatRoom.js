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
    return new Promise((resolve, reject) => {
      if (!userId || !roomId) {
        return reject(new Error("Missing userId or roomId"));
      }

      socket.emit("joinRoom", { roomId, userId }, (response) => {
        if (response?.success) {
          resolve(); // úspech
        } else {
          reject(new Error(response?.message || "Failed to join room"));
        }
      });
    });
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
