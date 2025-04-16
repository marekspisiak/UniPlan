import { useParams } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import EditEvent from "../../components/EditEvent/EditEvent";

const EditEventPage = () => {
  const { id } = useParams(); // ⬅️ získa id z URL

  return <MainLayout center={<EditEvent eventId={parseInt(id)} />} />;
};

export default EditEventPage;
