import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  autoConnect: true, // manuálne si ho pripojíš keď chceš
});

export default socket;
