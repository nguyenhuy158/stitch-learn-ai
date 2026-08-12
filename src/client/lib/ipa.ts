import ipaDictionaryData from "../../data/ipa-dictionary.json";

type DictEntry = { word: string; ipa: string };

// Built once from the bundled static dictionary — lookup is a simple, static word match
// (no grapheme-to-phoneme fallback for words that aren't in the list).
const DICTIONARY: Record<string, string> = Object.fromEntries(
  (ipaDictionaryData.items as DictEntry[]).map((entry) => [entry.word, entry.ipa])
);

// A few function words whose dictionary-listed citation form (e.g. "a" -> the letter
// name /eɪ/) isn't the pronunciation learners actually want; prefer the common/weak form.
const WEAK_FORM_OVERRIDES: Record<string, string> = {
  a: "ə",
  an: "ən",
};
for (const [word, ipa] of Object.entries(WEAK_FORM_OVERRIDES)) {
  if (DICTIONARY[word]) DICTIONARY[word] = ipa;
}

export function cleanIpaToken(token: string) {
  return token.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/gi, "");
}

export function lookupIpa(word: string): string | null {
  return DICTIONARY[cleanIpaToken(word)] ?? null;
}

// Whole-phrase transcription for compact display (e.g. flashcard front): only
// returns a result when every token in the phrase is found in the dictionary.
export function transcribeToIpa(phrase: string): string | null {
  const tokens = phrase.trim().split(/\s+/).filter((token) => cleanIpaToken(token).length > 0);
  if (!tokens.length) return null;
  const parts = tokens.map((token) => lookupIpa(token));
  if (parts.some((part) => part === null)) return null;
  return parts.join(" ");
}
