// Word -> level CEFR (A1..C2) tu Maximax67/Words-CEFR-Dataset, serve lam static
// asset nhu ipa-dictionary de trang khong dung toi khoi phai tai. Fetch 1 lan,
// cache trong bo nho suot phien tab.
let mapPromise: Promise<Record<string, string>> | null = null;

function loadMap(): Promise<Record<string, string>> {
  if (!mapPromise) {
    mapPromise = fetch("/data/word-cefr.json")
      .then((res) => res.json())
      .catch((err) => {
        mapPromise = null; // cho phep thu lai lan sau
        throw err;
      });
  }
  return mapPromise;
}

export async function lookupCefr(word: string): Promise<string | null> {
  const map = await loadMap();
  return map[word.trim().toLowerCase()] ?? null;
}
