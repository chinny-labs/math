// Settings: defaults, cleanup, and saving to this browser.
import { LEVELS, OP_KEYS, FORMATS, MAX_NUMBER } from './generator.js';

const STORAGE_KEY = 'mathDrill.settings.v1';

export const DRILL_COUNTS = [10, 20, 30, 50];
export const SHEET_COUNTS = [12, 20, 24, 30, 40, 50, 60, 80, 100];

const DEFAULT_CUSTOM = {
  add: { a: [0, 20], b: [0, 20] },
  sub: { a: [0, 20], b: [0, 20] },
  mul: { a: [1, 12], b: [7, 7] },
  div: { a: [2, 9], b: [1, 10] },
};

export function defaultSettings() {
  const ops = {};
  for (const op of OP_KEYS) {
    ops[op] = {
      on: op === 'add',
      level: LEVELS[op][1].id,
      custom: structuredClone(DEFAULT_CUSTOM[op]),
    };
  }
  ops.div.remainders = false;
  const formats = { horizontal: true, vertical: false, missing: false };
  return {
    ops,
    formats,
    drillCount: 20,
    sound: true,
    // Worksheets have their own problem styles, starting from the drill's.
    sheet: { count: 30, title: 'Math Practice', nameLine: false, answerKey: false, formats: { ...formats } },
  };
}

const toInt = (v, fallback) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(MAX_NUMBER, Math.max(0, n)) : fallback;
};

export function cleanRange(range, fallback, minFloor = 0) {
  let lo = Math.max(minFloor, toInt(range?.[0], fallback[0]));
  let hi = Math.max(minFloor, toInt(range?.[1], fallback[1]));
  if (lo > hi) [lo, hi] = [hi, lo];
  return [lo, hi];
}

// Merge saved (possibly old or hand-edited) settings over the defaults.
export function normalize(saved) {
  const s = defaultSettings();
  if (!saved || typeof saved !== 'object') return s;
  for (const op of OP_KEYS) {
    const src = saved.ops?.[op];
    if (!src) continue;
    const dst = s.ops[op];
    dst.on = Boolean(src.on);
    if (src.level === 'custom' || LEVELS[op].some((l) => l.id === src.level)) dst.level = src.level;
    const minFloor = op === 'div' ? 1 : 0;
    dst.custom.a = cleanRange(src.custom?.a, DEFAULT_CUSTOM[op].a, minFloor);
    dst.custom.b = cleanRange(src.custom?.b, DEFAULT_CUSTOM[op].b);
  }
  s.ops.div.remainders = Boolean(saved.ops?.div?.remainders);
  for (const f of Object.keys(FORMATS)) {
    if (saved.formats && f in saved.formats) s.formats[f] = Boolean(saved.formats[f]);
  }
  if (DRILL_COUNTS.includes(saved.drillCount)) s.drillCount = saved.drillCount;
  if (typeof saved.sound === 'boolean') s.sound = saved.sound;
  const sheet = saved.sheet || {};
  if (SHEET_COUNTS.includes(sheet.count)) s.sheet.count = sheet.count;
  if (typeof sheet.title === 'string') s.sheet.title = sheet.title.slice(0, 80);
  s.sheet.nameLine = Boolean(sheet.nameLine);
  s.sheet.answerKey = Boolean(sheet.answerKey);
  s.sheet.formats = { ...s.formats };
  for (const f of Object.keys(FORMATS)) {
    if (sheet.formats && f in sheet.formats) s.sheet.formats[f] = Boolean(sheet.formats[f]);
  }
  return s;
}

export function loadSettings() {
  try {
    return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage can be unavailable (private browsing); settings just won't persist.
  }
}
