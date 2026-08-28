/**
 * Nhan dang giong noi tieng Anh bang Web Speech API (chay trong browser,
 * khong ton AI). Chrome/Edge/Safari ho tro; Firefox thi an nut mic di.
 */
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
};

function RecognitionCtor(): (new () => Recognition) | null {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function speechInputSupported(): boolean {
  return typeof window !== "undefined" && RecognitionCtor() !== null;
}

/**
 * Nghe mot luot roi tra transcript. Tra ve ham stop de huy giua chung.
 * onEnd luon duoc goi dung 1 lan (ke ca loi/huy) de UI tat trang thai mic.
 */
export function listenOnce(onResult: (transcript: string) => void, onEnd: () => void): () => void {
  const Ctor = RecognitionCtor();
  if (!Ctor) {
    onEnd();
    return () => {};
  }
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onEnd();
  };
  rec.onresult = (e: any) => {
    const text = e.results?.[0]?.[0]?.transcript || "";
    if (text) onResult(text);
  };
  rec.onend = finish;
  rec.onerror = finish;
  rec.start();
  return () => {
    rec.abort();
    finish();
  };
}
