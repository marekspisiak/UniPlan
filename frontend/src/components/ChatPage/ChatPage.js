import { useRoomMessages } from "../../hooks/useRoomMessages";
import { useChatRoom } from "../../hooks/useChatRoom";
import { useChatModal } from "../../context/ChatModalContext";
import { useRoomContext } from "../../context/RoomContext";
import { useAuth } from "../../context/AuthContext";
import { MessageList, Input } from "react-chat-elements";
import { useEffect, useRef, useState } from "react";
import "react-chat-elements/dist/main.css";
import styles from "./ChatPage.module.scss"; // 👈
import { Button } from "react-bootstrap";
import { X } from "lucide-react";
import { debounce } from "lodash";

const ChatPage = ({ roomId }) => {
  const { user } = useAuth();
  const { leaveRoom } = useChatRoom(user.id);
  const { closeChat, roomTitle } = useChatModal();
  const { reloadRooms } = useRoomContext();
  const { messages, sendMessage, fetchOlderMessages, hasMore, loading } =
    useRoomMessages(roomId, user.id);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const wasNearBottomRef = useRef(false);

  const previousScrollHeightRef = useRef(0);
  const previousScrollTopRef = useRef(0);

  const isFirstLoad = useRef(true);

  useEffect(() => {
    wasNearBottomRef.current = isNearBottom();
  }, [messages.length]);

  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return false;

    const threshold = 200;
    const position =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    return position <= threshold;
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (isFirstLoad.current && messages.length > 0) {
      container.scrollTop = container.scrollHeight; // 👈 scroll úplne dolu
      isFirstLoad.current = false;
    }
  }, [messages]);

  const handleScroll = debounce(() => {
    const container = messagesContainerRef.current;
    if (!container || loading) return;

    const threshold = container.clientHeight * 0.1; // 10% výšky obrazovky
    if (container.scrollTop <= threshold && hasMore) {
      // Pred fetchom zapamätaj pozíciu
      previousScrollHeightRef.current = container.scrollHeight;
      previousScrollTopRef.current = container.scrollTop;

      fetchOlderMessages();
    }
  }, 200);

  const handleSend = () => {
    const trimmedMessage = newMessage.trim();
    if (trimmedMessage !== "") {
      sendMessage(trimmedMessage);
      setNewMessage("");
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (!loading && previousScrollHeightRef.current !== 0) {
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const scrollDifference =
          newScrollHeight - previousScrollHeightRef.current;

        container.scrollTop = previousScrollTopRef.current + scrollDifference;

        previousScrollHeightRef.current = 0;
        previousScrollTopRef.current = 0;
      });
    } else if (!loading && wasNearBottomRef.current) {
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, [messages, loading]);

  const handleLeaveRoom = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/rooms/${roomId}/leave`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      leaveRoom(roomId);
      closeChat();
      reloadRooms();
    } catch (err) {
      console.error("Nepodarilo sa odhlásiť z miestnosti", err);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  return (
    <div className={styles.chatPage}>
      {/* Horný panel */}
      <div className={styles.header}>
        <Button variant="outline-danger" size="sm" onClick={handleLeaveRoom}>
          Opustiť miestnosť
        </Button>

        {roomTitle && <div className={styles.roomTitle}>{roomTitle}</div>}

        <Button variant="light" size="sm" onClick={closeChat}>
          <X size={20} />
        </Button>
      </div>

      {/* Správy */}
      <div
        className={styles.messages}
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {loading && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <small style={{ color: "#6c757d" }}>
              Načítavam staršie správy...
            </small>
          </div>
        )}

        <MessageList
          className="message-list"
          lockable
          dataSource={messages.map((msg) => ({
            position: msg.userId === user.id ? "right" : "left",
            type: "text",
            title:
              msg.user?.email === user.email
                ? "Ja"
                : `${msg.user?.firstName} ${msg.user?.lastName}` ||
                  "Používateľ",
            text: msg.text,
            date: new Date(msg.createdAt),
            avatar: `/uploads/profile/user_${msg.user?.id}.png`,
          }))}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <Input
          placeholder="Napíš správu..."
          multiline={false}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rightButtons={
            <Button variant="primary" onClick={handleSend}>
              Poslať
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default ChatPage;
