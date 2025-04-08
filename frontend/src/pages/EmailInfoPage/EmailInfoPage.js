import { Button } from "react-bootstrap";
import AuthLayout from "../../layouts/AuthLayout";
import { Link } from "react-router-dom";

const EmailInfoPage = () => {
  return (
    <AuthLayout>
      <h4 className="mb-3">Registrácia dokončená</h4>
      <p>
        Ďakujeme za registráciu. Pred prihlásením si prosím overte svoju
        emailovú adresu. Môže to trvať niekoľko minút.
      </p>
      <Link to="/login">
        <Button className="mt-3 w-100">Prejsť na prihlásenie</Button>
      </Link>
    </AuthLayout>
  );
};

export default EmailInfoPage;
