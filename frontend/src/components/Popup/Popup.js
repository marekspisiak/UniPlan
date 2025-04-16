import { useEffect } from "react";
import styles from "./Popup.module.scss";

let popupCount = 0;

const Popup = ({ isOpen, onClose, children }) => {
  console.log(isOpen);
  console.log("nacitam sa");
  console.log(children);
  useEffect(() => {
    if (isOpen) {
      popupCount++;
      document.body.style.overflow = "hidden";
    }

    return () => {
      if (isOpen) {
        popupCount = Math.max(0, popupCount - 1);
        if (popupCount === 0) {
          document.body.style.overflow = "";
        }
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Popup;
