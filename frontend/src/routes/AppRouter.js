import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home.js";

import CalendarPage from "../pages/CalendarPage/CalendarPage.js";
import ChatPage from "../pages/ChatPage/ChatPage.js";
import ProfilePage from "../pages/ProfilePage/ProfilePage.js";

import RegisterPage from "../pages/RegisterPage/RegisterPage.js";
import LoginPage from "../pages/LoginPage/LoginPage.js";

import EmailInfoPage from "../pages/EmailInfoPage/EmailInfoPage.js";
import VerifyEmailPage from "../pages/VerifyEmailPage/VerifyEmailPage.js";

import PrivateRoute from "./PrivateRoute.js";
import GuestRoute from "./GuestRoute.js";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/email-info" element={<EmailInfoPage />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
