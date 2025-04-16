import MainLayout from "../../layouts/MainLayout";
import EventForm from "../../components/EventForm/EventForm";
import CreateEvent from "../../components/CreateEvent/CreateEvent";

const CreateEventPage = () => {
  return <MainLayout center={<CreateEvent />} />;
};

export default CreateEventPage;
