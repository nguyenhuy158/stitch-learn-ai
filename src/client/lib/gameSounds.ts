function getCtx() {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioCtx();
}

/** Descending "tè tè tèo tèo" buzzer for a wrong answer, synthesized so no audio asset is needed. */
export function playWrongSound() {
  const ctx = getCtx();
  const notes = [392, 349, 330, 294];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.15, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.15);
  });
  setTimeout(() => ctx.close(), notes.length * 150 + 200);
}

/** Short cheerful ascending chime for a correct answer. */
export function playCorrectSound() {
  const ctx = getCtx();
  const notes = [523, 659, 784];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.08;
    gain.gain.setValueAtTime(0.12, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.13);
  });
  setTimeout(() => ctx.close(), notes.length * 80 + 200);
}
