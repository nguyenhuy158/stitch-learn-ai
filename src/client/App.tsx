import { Routes, Route, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import Home from "./pages/Home";
import Lessons from "./pages/Lessons";
import LessonDetail from "./pages/LessonDetail";
import Chat from "./pages/Chat";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Flashcards from "./pages/Flashcards";
import WordGame from "./pages/WordGame";
import Listening from "./pages/Listening";
import Matching from "./pages/Matching";
import Spelling from "./pages/Spelling";
import WordRace from "./pages/WordRace";
import GamesLeaderboard from "./pages/GamesLeaderboard";
import Challenge from "./pages/Challenge";
import PictureVocab from "./pages/PictureVocab";
import IpaChart from "./pages/IpaChart";
import IpaTranscribe from "./pages/IpaTranscribe";
import Saved from "./pages/Saved";
import Rankings from "./pages/Rankings";
import Mistakes from "./pages/Mistakes";
import Writing from "./pages/Writing";
import Help from "./pages/Help";
import Appearance from "./pages/Appearance";
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
      <Route path="/word-game" element={<WordGame />} />
      <Route path="/listening-game" element={<Listening />} />
      <Route path="/matching-game" element={<Matching />} />
      <Route path="/spelling-game" element={<Spelling />} />
      <Route path="/word-race" element={<WordRace />} />
      <Route path="/games-leaderboard" element={<GamesLeaderboard />} />
      <Route path="/challenge" element={<Challenge />} />
      <Route path="/picture-vocab" element={<PictureVocab />} />
      <Route path="/ipa-chart" element={<IpaChart />} />
      <Route path="/ipa-transcribe" element={<IpaTranscribe />} />
      <Route path="/saved" element={<Saved />} />
      <Route path="/rankings" element={<Rankings />} />
      <Route path="/mistakes" element={<Mistakes />} />
      <Route path="/writing" element={<Writing />} />
      <Route path="/help" element={<Help />} />
      <Route path="/theme" element={<Appearance />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  return useShell ? <AppShell>{routes}</AppShell> : routes;
}
