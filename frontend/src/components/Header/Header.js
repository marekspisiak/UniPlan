import styles from "./Header.module.scss";
import UserMenu from "../UserMenu/UserMenu";
import clsx from "clsx"; // voliteľné, ale elegantné spojenie classNames (môžeš pridať neskôr)

const Header = ({ minimal = false }) => {
  return (
    <header className={clsx(styles.header, minimal && styles.minimal)}>
      <div className={styles.content}>
        <div className={styles.logo}>📘 UniPlan</div>

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
