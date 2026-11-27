// GOBBLE DASH — audio: tiny synthesized sounds, no audio files, no network.
// A gobble is three quick descending clucks; everything else is one beep.
let audioCtx = null;

export function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function beep(freq, duration, type = 'sine', volume = 0.1, when = 0, slideTo = 0) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + when);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + when + duration);
  gain.gain.setValueAtTime(volume, ctx.currentTime + when);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + when);
  osc.stop(ctx.currentTime + when + duration + 0.02);
}

export function playJump() { beep(320, 0.16, 'sine', 0.09, 0, 620); }
export function playDash() { beep(180, 0.2, 'sawtooth', 0.06, 0, 720); }
export function playPickup() { beep(880, 0.09, 'sine', 0.1); beep(1318, 0.14, 'sine', 0.09, 0.07); }
export function playFeather() { beep(660, 0.1, 'triangle', 0.11); beep(990, 0.1, 'triangle', 0.11, 0.08); beep(1320, 0.18, 'triangle', 0.11, 0.16); }
export function playHit() { beep(140, 0.3, 'square', 0.12, 0, 60); }
export function playSmash() { beep(520, 0.08, 'square', 0.1); beep(260, 0.16, 'square', 0.1, 0.06, 90); }
export function playGobble() { beep(420, 0.07, 'square', 0.09); beep(360, 0.07, 'square', 0.09, 0.09); beep(300, 0.12, 'square', 0.09, 0.18); }
export function playEscape() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((f, i) => beep(f, 0.22, 'triangle', 0.11, i * 0.13));
}
export function playCaught() { beep(392, 0.25, 'sawtooth', 0.09); beep(311, 0.25, 'sawtooth', 0.09, 0.22); beep(233, 0.5, 'sawtooth', 0.09, 0.44); }
