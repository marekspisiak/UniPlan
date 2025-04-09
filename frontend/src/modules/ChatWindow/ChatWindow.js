import { Card, ListGroup, Badge } from "react-bootstrap";
import styles from "./ChatWindow.module.scss";

const ChatWindow = () => {
  const chats = [
    {
      name: "Projektový tím - KPZ",
      lastMessage: "Zajtra máme stretnutie o 9:00.",
      time: "15:42",
    },
    {
      name: "Tutor - Ing. Kováčová",
      lastMessage: "Prosím, pošlite mi verziu práce do piatku.",
      time: "12:30",
    },
    {
      name: "Kamarát Jano",
      lastMessage: "Ideme po prednáške na kávu?",
      time: "Včera",
    },
  ];

  return (
    <Card className={styles.chatWindow}>
      <Card.Body>
        <h5 className={styles.title}>Chaty</h5>
        <ListGroup variant="flush">
          {chats.map((chat, index) => (
            <ListGroup.Item key={index} className={styles.chat}>
              <div className={styles.name}>{chat.name}</div>
              <div className={styles.message}>{chat.lastMessage}</div>
              <div className={styles.time}>
                <Badge bg="light" text="dark">
                  {chat.time}
                </Badge>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default ChatWindow;
