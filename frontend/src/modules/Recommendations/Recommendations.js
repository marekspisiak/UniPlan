import { useEffect, useState } from "react";
import ActivityCard from "./ActivityCard";
import styles from "./Recommendations.module.scss";
import { Spinner, Alert } from "react-bootstrap";

const Recommendations = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/events/get", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        console.log(data);

        if (!res.ok)
          throw new Error(data.message || "Nepodarilo sa načítať aktivity");

        setActivities(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className={styles.recommendations}>
      <h4 className={styles.title}>Odporúčané aktivity</h4>
      <div className={styles.list}>
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
