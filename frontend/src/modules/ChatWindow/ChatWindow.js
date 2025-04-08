import { Card, ListGroup, Badge } from "react-bootstrap";
import "./ChatWindow.scss";

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
    <Card className="chat-window">
      <Card.Body>
        <h5 className="chat-window__title">Chaty</h5>
        <ListGroup variant="flush">
          {chats.map((chat, index) => (
            <ListGroup.Item key={index} className="chat-window__chat">
              <div className="chat-name">{chat.name}</div>
              <div className="chat-message">{chat.lastMessage}</div>
              <div className="chat-time">
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
