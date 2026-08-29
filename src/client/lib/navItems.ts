import { BookIcon, TutorIcon, CardsIcon, TargetIcon, MistakeIcon, GameIcon, SpeakerIcon, PuzzleIcon, KeyboardIcon, RainIcon, MedalIcon, TrophyIcon, ImageIcon, AlphabetIcon, ShuffleIcon, SearchIcon, StarIcon, TranslateIcon, NewspaperIcon } from "../components/icons";

/* Danh sach cong cu dung chung cho trang chu va sidebar desktop. */
export const TOOL_TABS = ["core", "games", "vocab"] as const;

export const TOOL_KEYS = [
  { key: "tutor", to: "/chat", icon: TutorIcon, tab: "core", color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20" },
  { key: "flashcards", to: "/flashcards", icon: CardsIcon, tab: "core", color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20" },
  { key: "challenge", to: "/challenge", icon: TargetIcon, tab: "core", color: "text-red-500 bg-red-50 dark:bg-red-900/20" },
  { key: "mistakes", to: "/mistakes", icon: MistakeIcon, tab: "core", color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20" },
  { key: "translation", to: "/translation", icon: TranslateIcon, tab: "core", color: "text-sky-500 bg-sky-50 dark:bg-sky-900/20" },
  { key: "reading", to: "/reading", icon: NewspaperIcon, tab: "core", color: "text-lime-600 bg-lime-50 dark:bg-lime-900/20" },
  { key: "dictation", to: "/dictation", icon: KeyboardIcon, tab: "games", color: "text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20" },
  { key: "wordGame", to: "/word-game", icon: GameIcon, tab: "games", color: "text-green-500 bg-green-50 dark:bg-green-900/20" },
  { key: "listeningGame", to: "/listening-game", icon: SpeakerIcon, tab: "games", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" },
  { key: "matchingGame", to: "/matching-game", icon: PuzzleIcon, tab: "games", color: "text-pink-500 bg-pink-50 dark:bg-pink-900/20" },
  { key: "spellingGame", to: "/spelling-game", icon: KeyboardIcon, tab: "games", color: "text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20" },
  { key: "wordRace", to: "/word-race", icon: RainIcon, tab: "games", color: "text-sky-500 bg-sky-50 dark:bg-sky-900/20" },
  { key: "scrambleGame", to: "/scramble-game", icon: ShuffleIcon, tab: "games", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" },
  { key: "translationRecall", to: "/translation-recall", icon: TranslateIcon, tab: "games", color: "text-teal-500 bg-teal-50 dark:bg-teal-900/20" },
  { key: "gamesLeaderboard", to: "/games-leaderboard", icon: MedalIcon, tab: "games", color: "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" },
  { key: "rankings", to: "/rankings", icon: TrophyIcon, tab: "games", color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20" },
  { key: "pictureVocab", to: "/picture-vocab", icon: ImageIcon, tab: "vocab", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" },
  { key: "ipaChart", to: "/ipa-chart", icon: AlphabetIcon, tab: "vocab", color: "text-violet-500 bg-violet-50 dark:bg-violet-900/20" },
  { key: "ipaTranscribe", to: "/ipa-transcribe", icon: SearchIcon, tab: "vocab", color: "text-teal-500 bg-teal-50 dark:bg-teal-900/20" },
  { key: "saved", to: "/saved", icon: StarIcon, tab: "vocab", color: "text-rose-500 bg-rose-50 dark:bg-rose-900/20" },
] as const;
