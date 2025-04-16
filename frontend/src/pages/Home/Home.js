import { useMediaQuery } from "react-responsive";
import { useParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import MobileLayout from "../../layouts/MobileLayout";

import Calendar from "../../modules/Calendar/Calendar";
import UpcomingEvents from "../../modules/UpcomingEvents/UpcomingEvents";
import Recommendations from "../../modules/Recommendations/Recommendations";
import ChatWindow from "../../modules/ChatWindow/ChatWindow";
import Popup from "../../components/Popup/Popup";
import EventDetail from "../../modules/EventDetail/EventDetail";

const Home = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const { id: eventId } = useParams();

  const renderPopup = () =>
    eventId ? (
      <Popup isOpen={true} onClose={() => window.history.back()}>
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
    <MainLayout
      left={
        <>
          <Calendar />
          <UpcomingEvents />
        </>
      }
      center={
        <>
          <Recommendations />
          {renderPopup()}
        </>
      }
      right={<ChatWindow />}
    />
  );
};

export default Home;
