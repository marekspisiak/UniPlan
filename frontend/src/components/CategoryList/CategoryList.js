import styles from "./CategoryList.module.scss";

const CategoryList = ({ categories = [], center = false }) => {
  if (categories.length === 0) return null;

  return (
    <div
      className={`d-flex align-items-center ${
        center ? "justify-content-center" : "justify-content-between"
      }`}
    >
      <div className={styles.tags}>
        {categories.map((cat) => (
          <span key={cat.id} className={styles.tag}>
            <span className={styles.tagIcon}>{cat.icon}</span>
            {cat.label || cat.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
