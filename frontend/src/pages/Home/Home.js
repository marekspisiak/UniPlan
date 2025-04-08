import { useMediaQuery } from "react-responsive";
import MainLayout from "../../layouts/MainLayout";
import MobileLayout from "../../layouts/MobileLayout";

import Calendar from "../../modules/Calendar/Calendar";
import UpcomingEvents from "../../modules/UpcomingEvents/UpcomingEvents";
import Recommendations from "../../modules/Recommendations/Recommendations";
import ChatWindow from "../../modules/ChatWindow/ChatWindow";

const Home = () => {
  const isMobile = useMediaQuery({ maxWidth: 767 });

  if (isMobile) {
    return (
      <MobileLayout>
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
      center={<Recommendations />}
      right={<ChatWindow />}
    />
  );
};

export default Home;
