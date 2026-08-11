import { Routes, Route, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import Home from "./pages/Home";
import Lessons from "./pages/Lessons";
import LessonDetail from "./pages/LessonDetail";
import Chat from "./pages/Chat";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Flashcards from "./pages/Flashcards";
import Saved from "./pages/Saved";
import Rankings from "./pages/Rankings";
import Mistakes from "./pages/Mistakes";
import Writing from "./pages/Writing";
import Help from "./pages/Help";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Pages that keep the 5-tab shell (the 5 "new" screens described in the migration brief).
const SHELL_ROUTES = new Set(["/", "/lessons", "/chat", "/history", "/profile"]);

export default function App() {
  const location = useLocation();
  const useShell = SHELL_ROUTES.has(location.pathname);

  const routes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/lessons" element={<Lessons />} />
      <Route path="/lesson" element={<LessonDetail />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/history" element={<History />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/flashcards" element={<Flashcards />} />
      <Route path="/saved" element={<Saved />} />
      <Route path="/rankings" element={<Rankings />} />
      <Route path="/mistakes" element={<Mistakes />} />
      <Route path="/writing" element={<Writing />} />
      <Route path="/help" element={<Help />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  return useShell ? <AppShell>{routes}</AppShell> : routes;
}
