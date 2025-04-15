import { useState, useRef } from "react";
import { Form } from "react-bootstrap";
import styles from "./ImageUploader.module.scss";

const ImageUploader = ({
  label,
  multiple = false,
  max = 5,
  onChange,
  existing = [],
}) => {
  const [previews, setPreviews] = useState(existing);
  const fileInputRef = useRef();

  const handleFiles = (files) => {
    const selected = Array.from(files);

    const newPreviews = selected.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    const combined = multiple
      ? [...previews, ...newPreviews].slice(0, max)
      : newPreviews;

    setPreviews(combined);
    onChange(
      multiple ? combined.map((p) => p.file) : combined[0]?.file || null
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (index) => {
    const updated = [...previews];
    updated.splice(index, 1);
    setPreviews(updated);
    onChange(multiple ? updated.map((p) => p.file) : null);
  };

  return (
    <div
      className={styles.uploader}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <Form.Label>{label}</Form.Label>
      <div className={styles.previewWrapper}>
        {previews.map((preview, index) => (
          <div key={index} className={styles.preview}>
            <img src={preview.url || preview} alt="preview" />
            <button type="button" onClick={() => handleRemove(index)}>
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
};

export default ImageUploader;
