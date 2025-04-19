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
import AuthOnlyRoute from "./AuthOnlyRoute.js";

import CreateEventPage from "../pages/CreateEventPage/CreateEventPage.js";
import EmailReverifyPage from "../pages/EmailReverifyPage/EmailReverifyPage.js";

import EditEventPage from "../pages/EditEventPage/EditEventPage.js";
import EditableEventRoute from "./EditableEventRoute.js";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/email-info" element={<EmailInfoPage />} />

        <Route element={<GuestRoute />}>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<AuthOnlyRoute />}>
          <Route path="/email-reverify" element={<EmailReverifyPage />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/event/:id/:date" element={<Home />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route element={<EditableEventRoute />}>
            <Route path="/edit-event/:id" element={<EditEventPage />} />
          </Route>
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/create-event" element={<CreateEventPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
