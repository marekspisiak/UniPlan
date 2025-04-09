import ActivityCard from "./ActivityCard";
import styles from "./Recommendations.module.scss";

const Recommendations = () => {
  const activities = [
    {
      title: "Hackathon Žilina 2025",
      date: "2025-04-18",
      time: "09:00",
      location: "Aula DATALAN",
      description: "24-hodinová výzva pre študentov IT.",
    },
    {
      title: "Kariérny deň UNIZA",
      date: "2025-04-21",
      time: "10:00",
      location: "Hlavná aula",
      description: "Príď sa stretnúť so zamestnávateľmi.",
    },
    {
      title: "Kurz time managementu",
      date: "2025-04-25",
      time: "13:30",
      location: "Online (Teams)",
      description: "Získaj zručnosti ako plánovať svoj čas.",
    },
  ];

  return (
    <div className={styles.recommendations}>
      <h4 className={styles.title}>Odporúčané aktivity</h4>
      <div className={styles.list}>
        {activities.map((activity, index) => (
          <ActivityCard key={index} activity={activity} />
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
