import Calendar from "../../modules/Calendar/Calendar";
import MobileLayout from "../../layouts/MobileLayout";
import UpcomingEvents from "../../modules/UpcomingEvents/UpcomingEvents";

const CalendarPage = () => {
  return (
    <MobileLayout>
      <Calendar />
      <UpcomingEvents />
    </MobileLayout>
  );
};

export default CalendarPage;
