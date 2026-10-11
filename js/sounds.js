// Short sound effects made with the Web Audio API, so there are no
// sound files to download.
let ctx = null;
let enabled = true;

export function setSoundOn(on) {
  enabled = on;
}

// Browsers only allow audio after a tap or key press, so call this from
// one (like pressing "Start drill") before the first sound is needed.
export function unlockAudio() {
  if (enabled) audio();
}

function audio() {
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    ctx = new AudioContext();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// One note with a quick fade in and out, `start` seconds from now.
function tone(c, freq, start, duration, { type = 'sine', volume = 0.18 } = {}) {
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

const NOTES = { G4: 392, Eb4: 311.13, C5: 523.25, E5: 659.25, G5: 783.99, B5: 987.77, C6: 1046.5 };

const SOUNDS = {
  // A bright two-note chime.
  correct: (c) => {
    tone(c, NOTES.E5, 0, 0.15);
    tone(c, NOTES.B5, 0.08, 0.3);
  },
  // A soft, low "uh-oh" rather than a harsh buzzer.
  wrong: (c) => {
    tone(c, NOTES.G4, 0, 0.2, { type: 'triangle', volume: 0.22 });
    tone(c, NOTES.Eb4, 0.16, 0.35, { type: 'triangle', volume: 0.22 });
  },
  // A rising tune at the end of a drill; the last note only for great scores.
  finish: (c, great) => {
    const notes = great ? [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6] : [NOTES.C5, NOTES.E5, NOTES.G5];
    notes.forEach((f, i) => tone(c, f, i * 0.12, i === notes.length - 1 ? 0.6 : 0.2));
  },
};

export function play(name, ...args) {
  if (!enabled) return;
  const c = audio();
  if (c) SOUNDS[name](c, ...args);
}
