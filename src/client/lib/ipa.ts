type DictEntry = { word: string; ipa: string };

// A few function words whose dictionary-listed citation form (e.g. "a" -> the letter
// name /eɪ/) isn't the pronunciation learners actually want; prefer the common/weak form.
const WEAK_FORM_OVERRIDES: Record<string, string> = {
  a: "ə",
  an: "ən",
};

// The full dictionary (~126k words, ~5MB) is served as a static asset instead of bundled
// into the JS build, so pages that never touch IPA don't pay for it. Fetched once and
// cached in memory for the life of the tab.
let dictionaryPromise: Promise<Record<string, string>> | null = null;

function loadDictionary(): Promise<Record<string, string>> {
  if (!dictionaryPromise) {
    dictionaryPromise = fetch("/data/ipa-dictionary.json")
      .then((res) => res.json())
      .then((data: { items: DictEntry[] }) => {
        const dict = Object.fromEntries(data.items.map((entry) => [entry.word, entry.ipa]));
        for (const [word, ipa] of Object.entries(WEAK_FORM_OVERRIDES)) {
          if (dict[word]) dict[word] = ipa;
        }
        return dict;
      })
      .catch((err) => {
        dictionaryPromise = null; // allow retry on next call
        throw err;
      });
  }
  return dictionaryPromise;
}

export function cleanIpaToken(token: string) {
  return token.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/gi, "");
}

export async function lookupIpa(word: string): Promise<string | null> {
  const dict = await loadDictionary();
  return dict[cleanIpaToken(word)] ?? null;
}

// Whole-phrase transcription for compact display (e.g. flashcard front): only
// returns a result when every token in the phrase is found in the dictionary.
export async function transcribeToIpa(phrase: string): Promise<string | null> {
  const tokens = phrase.trim().split(/\s+/).filter((token) => cleanIpaToken(token).length > 0);
  if (!tokens.length) return null;
  const dict = await loadDictionary();
  const parts = tokens.map((token) => dict[cleanIpaToken(token)] ?? null);
  if (parts.some((part) => part === null)) return null;
  return parts.join(" ");
}
