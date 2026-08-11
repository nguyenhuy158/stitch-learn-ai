export function speak(term: string) {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(term);
  utter.lang = "en-US";
  utter.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}
