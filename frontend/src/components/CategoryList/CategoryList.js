import styles from "./CategoryList.module.scss";

const CategoryList = ({ categories = [] }) => {
  if (categories.length === 0) return null;

  return (
    <div className="d-flex justify-content-between align-items-center">
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
