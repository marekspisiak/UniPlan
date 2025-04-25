// components/CategoryMultiSelect/CategoryMultiSelect.js
import { useEffect, useState } from "react";
import Select from "react-select";

const CategoryMultiSelect = ({ selectedIds, onChange }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/events/categories", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await res.json();

        const mapped = data.map((cat) => ({
          value: cat.id,
          label: `${cat.icon || ""} ${cat.label}`,
        }));

        setOptions(mapped);
      } catch (err) {
        console.error("Chyba pri načítaní kategórií:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <Select
      isMulti
      isLoading={loading}
      options={options}
      value={options.filter((o) => selectedIds.includes(o.value))}
      onChange={(selected) => onChange(selected.map((s) => s.value))}
      classNamePrefix="react-select"
    />
  );
};

export default CategoryMultiSelect;
