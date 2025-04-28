import styles from "./Header.module.scss";
import UserMenu from "../UserMenu/UserMenu";
import clsx from "clsx"; // voliteľné, ale elegantné spojenie classNames (môžeš pridať neskôr)
import { Link } from "react-router-dom";

const Header = ({ minimal = false }) => {
  return (
    <header className={clsx(styles.header, minimal && styles.minimal)}>
      <div className={styles.content}>
        <Link to="/" className={styles.logo}>
          📘 UniPlan
        </Link>

        {!minimal && (
          <div className={`d-none d-md-block ${styles.right}`}>
            <UserMenu />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
