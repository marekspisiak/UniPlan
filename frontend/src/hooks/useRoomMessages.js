import { useState, useEffect, useRef } from "react";
import socket from "../socket/socket";
import { useRoomContext } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import { debounce } from "lodash";

export function useRoomMessages(roomId, userId) {
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const { markRoomAsOpened } = useRoomContext();
  const { user } = useAuth();
  const earliestMessageRef = useRef(null); // 👈 uložíme si najstarší message

  useEffect(() => {
    if (!socket || !roomId) return;

    const fetchInitialMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/rooms/${roomId}/messages?limit=20`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setMessages(data);
        if (data.length > 0) {
          earliestMessageRef.current = data[0].createdAt;
        }
        if (data.length < 20) {
          setHasMore(false);
        }
      } catch (err) {
        console.error("Nepodarilo sa načítať históriu správ", err);
      }
    };

    fetchInitialMessages();

    const emitUserSeen = debounce(() => {
      socket.emit("user-seen", {
        roomId: roomId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    }, 3000);

    const handleNewMessage = (message) => {
      if (message.roomId === roomId) {
        markRoomAsOpened(roomId);
        setMessages((prev) => [...prev, message]);
        emitUserSeen();
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [roomId]);

  const fetchOlderMessages = async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/rooms/${roomId}/messages?before=${encodeURIComponent(
          earliestMessageRef.current
        )}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.length > 0) {
        setMessages((prev) => [...data, ...prev]);
        earliestMessageRef.current = data[0].createdAt;
      }
      if (data.length < 20) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Nepodarilo sa načítať staršie správy", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (text) => {
    if (socket && roomId && userId) {
      socket.emit("sendMessage", { roomId, userId, text });
    }
  };

  return { messages, sendMessage, fetchOlderMessages, hasMore, loading };
}
