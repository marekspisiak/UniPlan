import { useState, useEffect, useRef } from "react";
import styles from "./ModeratorSelector.module.scss";

const ModeratorSelector = ({ selected = [], onChange }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(selected);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (term) => {
    if (term.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/user/search?q=${encodeURIComponent(term)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();

      const filtered = data.filter(
        (user) => !selected.some((s) => s.id === user.id)
      );
      setResults(filtered);
    } catch (err) {
      console.error("Chyba pri hľadaní užívateľov:", err);
    } finally {
      setLoading(false);
    }
  };

  const defaultPermissions = {
    canEditEvent: false,
    canManageParticipants: false,
    canManageSubscribers: false,
    canManageModerators: false,
    canRepostEvent: false,
  };

  const handleAdd = (user) => {
    const newUser = { ...user, ...defaultPermissions };
    onChange([...selected, newUser]);
    setSelectedDetails([...selectedDetails, newUser]);
    setResults((prev) => prev.filter((u) => u.id !== user.id));
    setQuery("");
    setShowResults(false);
  };

  const handleRemove = (id) => {
    onChange(selected.filter((u) => u.id !== id));
    setSelectedDetails((prev) => prev.filter((user) => user.id !== id));
  };

  const handleTogglePermission = (id, permission) => {
    const updated = selected.map((user) =>
      user.id === id ? { ...user, [permission]: !user[permission] } : user
    );
    onChange(updated);
    setSelectedDetails(updated);
  };

  console.log(selected);

  return (
    <div className={styles.container}>
      <div ref={inputRef} className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Hľadaj moderátorov..."
          value={query}
          onFocus={() => setShowResults(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          className={styles.searchInput}
        />

        {showResults && !loading && results.length > 0 && (
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
      </div>

      {selectedDetails.length > 0 && (
        <div className={styles.tableScrollWrapper}>
          <table className={styles.selectedTable}>
            <thead>
              <tr>
                <th>Moderátor</th>
                <th>Editovať</th>
                <th>Účastníci</th>
                <th>Odberatelia</th>
                <th>Moderátori</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {selectedDetails.map((user) => (
                <tr key={user.id}>
                  <td className={styles.nameCell}>
                    <img
                      src={user.profileImageUrl}
                      alt="avatar"
                      className={styles.avatarSmall}
                    />
                    {user.firstName} {user.lastName}
                  </td>
                  {[
                    "canEditEvent",
                    "canManageParticipants",
                    "canManageAttendees",
                    "canManageModerators",
                  ].map((perm) => (
                    <td key={perm}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={user[perm]}
                        onChange={() => handleTogglePermission(user.id, perm)}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemove(user.id)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ModeratorSelector;
