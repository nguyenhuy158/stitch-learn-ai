/**
 * Speaks an English term out loud.
 *
 * Two browser quirks are handled here:
 *  1. Chrome loads its voice list asynchronously. The very first `speak()` on a
 *     freshly loaded page can run while `getVoices()` is still empty, and the
 *     utterance is silently dropped. We retry once `voiceschanged` fires.
 *  2. Some engines ignore `utter.lang` unless an actual voice is assigned, so we
 *     pick an English voice when one is available.
 */
function run(term: string) {
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(term);
  utter.lang = "en-US";
  utter.rate = 0.9;
  const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith("en"));
  if (voice) utter.voice = voice;
  synth.cancel();
  synth.speak(utter);
}

export function speak(term: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;

  if (synth.getVoices().length === 0) {
    const onVoices = () => {
      synth.removeEventListener("voiceschanged", onVoices);
      run(term);
    };
    synth.addEventListener("voiceschanged", onVoices);
    // Safety net: drop the listener if voices never arrive, so a later term
    // never gets spoken by a stale listener.
    setTimeout(() => synth.removeEventListener("voiceschanged", onVoices), 2000);
    // Still try now — on engines with a synchronous voice list this is the real call.
    run(term);
    return;
  }

  run(term);
}
