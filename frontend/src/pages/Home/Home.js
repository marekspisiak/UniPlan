import { useMediaQuery } from "react-responsive";
import { Link, Navigate, useParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import MobileLayout from "../../layouts/MobileLayout";

import Calendar from "../../modules/Calendar/Calendar";
import UpcomingEvents from "../../modules/UpcomingEvents/UpcomingEvents";
import Recommendations from "../../modules/Recommendations/Recommendations";
import ChatWindow from "../../modules/ChatWindow/ChatWindow";
import Popup from "../../components/Popup/Popup";
import EventDetail from "../../modules/EventDetail/EventDetail";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import styles from "./Home.module.scss";
import MiniChatList from "../../components/MiniChatList/MiniChatList";
import ChatModal from "../../components/ChatModal/ChatModal";
import { useChatModal } from "../../context/ChatModalContext";
import { useAuth } from "../../context/AuthContext";
import Chat from "../../components/Chat/Chat";

const Home = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const { id: eventId } = useParams();
  const [isOpen, setIsOpen] = useState(true);
  const Navigate = useNavigate();
  const { openChat } = useChatModal();

  const { user } = useAuth();

  const renderPopup = () =>
    eventId ? (
      <Popup
        isOpen={isOpen}
        onClose={() => {
          Navigate("/");
          setIsOpen(false);
        }}
      >
        <EventDetail eventId={parseInt(eventId)} />
      </Popup>
    ) : null;

  if (isMobile) {
    return (
      <MobileLayout>
        {renderPopup()}
        <Recommendations />
      </MobileLayout>
    );
  }

  return (
    <>
      <Link to="/create-event">
        <button className={styles.createButton}>
          <Plus size={24} />
        </button>
      </Link>

      <MainLayout
        center={
          <>
            <Recommendations />
            {renderPopup()}
          </>
        }
        right={
          <>
            <MiniChatList
              onOpenChat={(room) => {
                openChat(room); // cez hook
              }}
            />
          </>
        }
      />
    </>
  );
};

export default Home;
