// /hooks/useChatModal.js
import { useState } from "react";

export function useChatModal() {
  const [openedRoomId, setOpenedRoomId] = useState(null);

  function openChat(roomId) {
    setOpenedRoomId(roomId);
  }

  function closeChat() {
    setOpenedRoomId(null);
  }

  return { openedRoomId, openChat, closeChat };
}
