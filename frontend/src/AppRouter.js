import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home.js";
import Login from "./pages/Login/Login.js";
import Profile from "./pages/Profile/Profile.js";

import FeedPage from "./pages/FeedPage/FeedPage";
import CalendarPage from "./pages/CalendarPage/CalendarPage";
import ChatPage from "./pages/ChatPage/ChatPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
