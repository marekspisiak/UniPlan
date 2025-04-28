import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import styles from "./Toast.module.scss";

export default function Toast({ success, error, onClose }) {
  const message = success || error;
  const type = success ? "success" : "error";

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // zmizne po 4 sekundach

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`${styles.toast} ${styles[type]}`}
        >
          <span>{message}</span>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
