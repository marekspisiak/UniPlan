import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const CreateEventButton = ({ size = "sm", className = "" }) => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline-primary"
      size={size}
      className={className}
      onClick={() => navigate("/create-event")}
    >
      ➕ Vytvoriť akciu
    </Button>
  );
};

export default CreateEventButton;
