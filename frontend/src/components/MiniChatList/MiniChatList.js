import React, { useEffect, useState } from "react";
import { ChatItem } from "react-chat-elements";
import "react-chat-elements/dist/main.css";

import { useRoomContext } from "../../context/RoomContext";
import styles from "./MiniChatList.module.scss";

const MiniChatList = ({ onOpenChat }) => {
  const { rooms, markRoomAsOpened } = useRoomContext();

  const handleOpenChat = async (room) => {
    onOpenChat(room);
    markRoomAsOpened(room.id);
  };

  return (
    <div className={`d-flex flex-column ${styles.chatList}`}>
      {rooms.map((room) => (
        <div key={room.id} className={styles.chatItemWrapper}>
          <ChatItem
            avatar={room.mainImage || "/assets/default-chat.png"}
            avatarFlexible={true}
            alt={room.title}
            title={room.title}
            subtitle={room.lastMessage || "Začni konverzáciu"}
            date={
              room.lastMessageTime ? new Date(room.lastMessageTime) : undefined
            }
            unread={room.lastMessageTime > room.lastSeen}
            onClick={() => handleOpenChat(room)}
          />
        </div>
      ))}
    </div>
  );
};

export default MiniChatList;
