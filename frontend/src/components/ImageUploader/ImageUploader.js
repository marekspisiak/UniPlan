import {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  useEffect,
} from "react";
import { Form } from "react-bootstrap";
import styles from "./ImageUploader.module.scss";

const ImageUploader = forwardRef(
  ({ label, multiple = false, max = 5, onChange, existing = [] }, ref) => {
    const [previews, setPreviews] = useState([]);

    useEffect(() => {
      if (existing && existing.length > 0 && previews.length === 0) {
        const mapped = existing.map((url) => ({ url, existing: true }));
        console.log(mapped);
        setPreviews(mapped);
      }
    }, [existing]); // ← spustiť iba raz pri mountnutí

    console.log(previews);
    const [deleted, setDeleted] = useState([]);
    const fileInputRef = useRef();

    const handleFiles = (files) => {
      const selected = Array.from(files);
      const newPreviews = selected.map((file) => ({
        file,
        url: URL.createObjectURL(file),
        existing: false,
      }));

      const combined = multiple
        ? [...previews, ...newPreviews].slice(0, max)
        : newPreviews;

      setPreviews(combined);
      triggerChange(combined, deleted);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    };

    const handleRemove = (index) => {
      const updated = [...previews];
      const removed = updated.splice(index, 1)[0];

      if (removed.existing) {
        setDeleted((prev) => [...prev, removed.url]);
        triggerChange(updated, [...deleted, removed.url]);
      } else {
        triggerChange(updated, deleted);
      }

      setPreviews(updated);
    };

    const triggerChange = (currentPreviews, deletedList) => {
      console.log(currentPreviews);
      const files = currentPreviews
        .filter((p) => !p.existing)
        .map((p) => p.file);

      onChange({
        files,
        deleted: deletedList,
      });
    };

    useImperativeHandle(ref, () => ({
      clear() {
        setPreviews([]);
        setDeleted([]);
        triggerChange([], []);
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
      },
    }));

    return (
      <div
        className={styles.uploader}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Form.Label>{label}</Form.Label>
        <div className={styles.previewWrapper}>
          {console.log(previews)}
          {previews.map((preview, index) => (
            <div key={index} className={styles.preview}>
              <img src={preview.url} alt="preview" />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className={styles.removeButton}
              >
                ×
              </button>
            </div>
          ))}
          {(!multiple && previews.length === 0) ||
          (multiple && previews.length < max) ? (
            <div
              className={styles.uploadBox}
              onClick={() => fileInputRef.current.click()}
            >
              +
            </div>
          ) : null}
        </div>

        <Form.Control
          type="file"
          accept="image/*"
          multiple={multiple}
          ref={fileInputRef}
          className="d-none"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    );
  }
);

export default ImageUploader;
