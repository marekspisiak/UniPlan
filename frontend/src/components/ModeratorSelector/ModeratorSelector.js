import { useState } from "react";
import styles from "./ModeratorSelector.module.scss";

const ModeratorSelector = ({ selected = [], onChange }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState([]);

  const handleSearch = async (term) => {
    if (term.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/user/search?q=${encodeURIComponent(term)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();

      // Filtrovanie výsledkov - nezobrazuj už vybraných
      const filtered = data.filter((user) => !selected.includes(user.id));
      setResults(filtered);
    } catch (err) {
      console.error("Chyba pri hľadaní užívateľov:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (user) => {
    if (!selected.includes(user.id)) {
      onChange([...selected, user.id]);
      setSelectedDetails([...selectedDetails, user]);
      // Odstráň zo zoznamu výsledkov
      setResults((prev) => prev.filter((u) => u.id !== user.id));
    }
  };

  const handleRemove = (id) => {
    onChange(selected.filter((uid) => uid !== id));
    setSelectedDetails((prev) => prev.filter((user) => user.id !== id));
  };

  return (
    <div className={styles.container}>
      <input
        type="text"
        placeholder="Hľadaj moderátorov..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        className={styles.searchInput}
      />

      {!loading && results.length > 0 && (
        <ul className={styles.results}>
          {results.map((user) => (
            <li
              key={user.id}
              className={styles.resultItem}
              onClick={() => handleAdd(user)}
            >
              <div>
                <img
                  src={user.profileImageUrl}
                  alt="avatar"
                  className={styles.avatar}
                />
                <strong>
                  {user.firstName} {user.lastName}
                </strong>
                <span>({user.email})</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selectedDetails.length > 0 && (
        <div className={styles.selectedList}>
          {selectedDetails.map((user) => (
            <div key={user.id} className={styles.selectedItem}>
              <img
                src={user.profileImageUrl}
                alt="avatar"
                className={styles.avatarSmall}
              />
              {user.firstName} {user.lastName}
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(user.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModeratorSelector;
