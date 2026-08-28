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
import Scramble from "./pages/Scramble";
import TranslationRecall from "./pages/TranslationRecall";
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
import Translation from "./pages/Translation";
import Help from "./pages/Help";
import Appearance from "./pages/Appearance";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Trang dang nhap dung mot minh; moi trang con lai deu nam trong shell de tren
// PC luon co sidebar dieu huong (truoc day chi 5 trang co, vao game la mat nav).
const BARE_ROUTES = new Set(["/login"]);

export default function App() {
  const location = useLocation();
  const useShell = !BARE_ROUTES.has(location.pathname);

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
      <Route path="/scramble-game" element={<Scramble />} />
      <Route path="/translation-recall" element={<TranslationRecall />} />
      <Route path="/games-leaderboard" element={<GamesLeaderboard />} />
      <Route path="/challenge" element={<Challenge />} />
      <Route path="/picture-vocab" element={<PictureVocab />} />
      <Route path="/ipa-chart" element={<IpaChart />} />
      <Route path="/ipa-transcribe" element={<IpaTranscribe />} />
      <Route path="/saved" element={<Saved />} />
      <Route path="/rankings" element={<Rankings />} />
      <Route path="/mistakes" element={<Mistakes />} />
      <Route path="/writing" element={<Writing />} />
      <Route path="/translation" element={<Translation />} />
      <Route path="/help" element={<Help />} />
      <Route path="/theme" element={<Appearance />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  return useShell ? <AppShell>{routes}</AppShell> : routes;
}
