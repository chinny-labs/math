// Problem generation. Pure functions with no DOM access.
//
// A problem is { op, x, y, z, r, format, blank } meaning "x op y = z",
// with r the remainder for division when remainders are on (otherwise null).
// `blank` is the part the student fills in: 'z' normally, 'x' or 'y' for
// missing-number problems.

export const OPS = {
  add: { symbol: '+', name: 'Addition' },
  sub: { symbol: '−', name: 'Subtraction' },
  mul: { symbol: '×', name: 'Multiplication' },
  div: { symbol: '÷', name: 'Division' },
};

export const OP_KEYS = Object.keys(OPS);

export const FORMATS = {
  horizontal: 'Across',
  vertical: 'Stacked',
  missing: 'Missing number',
};

// Difficulty presets. add/sub/mul use ranges for the two numbers (a, b).
// div uses a divisor range (d) plus either a quotient range (q) or a
// dividend range (n).
export const LEVELS = {
  add: [
    { id: 'sum10', label: 'Sums to 10', a: [0, 10], b: [0, 10], max: 10 },
    { id: 'sum20', label: 'Sums to 20', a: [0, 20], b: [0, 20], max: 20 },
    { id: 'd2d1', label: '2-digit + 1-digit', a: [10, 99], b: [1, 9] },
    { id: 'd2d2', label: '2-digit + 2-digit', a: [10, 99], b: [10, 99] },
    { id: 'd3d3', label: '3-digit + 3-digit', a: [100, 999], b: [100, 999] },
    { id: 'd4d4', label: '4-digit + 4-digit', a: [1000, 9999], b: [1000, 9999] },
  ],
  sub: [
    { id: 'within10', label: 'Within 10', a: [0, 10], b: [0, 10] },
    { id: 'within20', label: 'Within 20', a: [0, 20], b: [0, 20] },
    { id: 'd2d1', label: '2-digit − 1-digit', a: [10, 99], b: [1, 9] },
    { id: 'd2d2', label: '2-digit − 2-digit', a: [10, 99], b: [10, 99] },
    { id: 'd3d3', label: '3-digit − 3-digit', a: [100, 999], b: [100, 999] },
    { id: 'd4d4', label: '4-digit − 4-digit', a: [1000, 9999], b: [1000, 9999] },
  ],
  mul: [
    { id: 'facts5', label: 'Times tables to 5', a: [1, 5], b: [1, 5] },
    { id: 'facts10', label: 'Times tables to 10', a: [1, 10], b: [1, 10] },
    { id: 'facts12', label: 'Times tables to 12', a: [1, 12], b: [1, 12] },
    { id: 'd2d1', label: '2-digit × 1-digit', a: [10, 99], b: [2, 9] },
    { id: 'd3d1', label: '3-digit × 1-digit', a: [100, 999], b: [2, 9] },
    { id: 'd2d2', label: '2-digit × 2-digit', a: [10, 99], b: [10, 99] },
  ],
  div: [
    { id: 'facts5', label: 'Division facts to 5', d: [1, 5], q: [1, 5] },
    { id: 'facts10', label: 'Division facts to 10', d: [1, 10], q: [1, 10] },
    { id: 'facts12', label: 'Division facts to 12', d: [1, 12], q: [1, 12] },
    { id: 'd2d1', label: '2-digit ÷ 1-digit', d: [2, 9], n: [10, 99] },
    { id: 'd3d1', label: '3-digit ÷ 1-digit', d: [2, 9], n: [100, 999] },
    { id: 'd3d2', label: '3-digit ÷ 2-digit', d: [10, 99], n: [100, 999] },
  ],
};

// Labels for the two ranges of a "Custom" level.
export const CUSTOM_LABELS = {
  add: ['First number', 'Second number'],
  sub: ['Start with', 'Take away'],
  mul: ['First number', 'Second number'],
  div: ['Divide by', 'Answer'],
};

export const MAX_NUMBER = 99999;

export function randInt([min, max]) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function shuffle(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Repeat `items` to fill `count` slots, then shuffle, so a mix stays even.
function spread(items, count) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(items[i % items.length]);
  return shuffle(out);
}

// Resolve an operation's settings into a concrete range spec.
export function levelSpec(op, opSettings) {
  if (opSettings.level === 'custom') {
    const { a, b } = opSettings.custom;
    if (op === 'div') return { d: [Math.max(1, a[0]), Math.max(1, a[1])], q: b };
    return { a, b };
  }
  return LEVELS[op].find((l) => l.id === opSettings.level) || LEVELS[op][0];
}

function makeNumbers(op, spec, remainders) {
  if (op === 'add') {
    let a, b;
    let tries = 0;
    do {
      a = randInt(spec.a);
      b = randInt(spec.b);
    } while (spec.max != null && a + b > spec.max && ++tries < 200);
    if (spec.max != null && a + b > spec.max) b = Math.max(0, spec.max - a);
    return { x: a, y: b, z: a + b, r: null };
  }
  if (op === 'sub') {
    let a = randInt(spec.a);
    let b = randInt(spec.b);
    if (b > a) [a, b] = [b, a];
    return { x: a, y: b, z: a - b, r: null };
  }
  if (op === 'mul') {
    const a = randInt(spec.a);
    const b = randInt(spec.b);
    return { x: a, y: b, z: a * b, r: null };
  }
  // Division: x ÷ y = z (R r)
  if (spec.n) {
    for (let tries = 0; tries < 100; tries++) {
      const d = randInt(spec.d);
      if (remainders) {
        const n = randInt(spec.n);
        return { x: n, y: d, z: Math.floor(n / d), r: n % d };
      }
      const qMin = Math.ceil(spec.n[0] / d);
      const qMax = Math.floor(spec.n[1] / d);
      if (qMin > qMax) continue;
      const q = randInt([qMin, qMax]);
      return { x: d * q, y: d, z: q, r: null };
    }
  }
  const d = randInt(spec.d);
  const q = randInt(spec.q || [1, 10]);
  const r = remainders ? randInt([0, d - 1]) : 0;
  return { x: d * q + r, y: d, z: q, r: remainders ? r : null };
}

// Pick which part to hide for a missing-number problem, avoiding cases
// with more than one right answer (like ? × 0 = 0).
function missingBlank(p) {
  const options = [];
  if (!(p.op === 'mul' && p.y === 0)) options.push('x');
  if (!(p.op === 'mul' && p.x === 0) && !(p.op === 'div' && p.z === 0)) options.push('y');
  return options.length ? options[Math.floor(Math.random() * options.length)] : null;
}

function applyFormat(p, format, formats) {
  p.format = format;
  p.blank = 'z';
  if (format !== 'missing') return p;
  // A remainder can't be shown in a missing-number problem.
  if (p.r) {
    p.format = formats.includes('vertical') ? 'vertical' : 'horizontal';
    return p;
  }
  const blank = missingBlank(p);
  if (!blank) {
    p.format = 'horizontal';
    return p;
  }
  p.r = null;
  p.blank = blank;
  return p;
}

export function enabledOps(settings) {
  return OP_KEYS.filter((op) => settings.ops[op].on);
}

export function enabledFormats(settings) {
  return Object.keys(FORMATS).filter((f) => settings.formats[f]);
}

const problemKey = (p) => `${p.op}|${p.x}|${p.y}`;

// Build `count` problems from the current settings, avoiding repeats
// where the chosen level has enough distinct problems.
export function generateSet(settings, count) {
  const ops = spread(enabledOps(settings), count);
  const formats = enabledFormats(settings);
  const formatList = spread(formats, count);
  const seen = new Set();
  const out = [];
  for (let i = 0; i < count; i++) {
    const op = ops[i];
    const spec = levelSpec(op, settings.ops[op]);
    const remainders = op === 'div' && settings.ops.div.remainders;
    let nums;
    for (let tries = 0; tries < 40; tries++) {
      nums = makeNumbers(op, spec, remainders);
      const key = problemKey({ op, ...nums });
      if (!seen.has(key)) break;
    }
    seen.add(problemKey({ op, ...nums }));
    out.push(applyFormat({ op, ...nums }, formatList[i], formats));
  }
  return out;
}

export function answerOf(p) {
  return p[p.blank];
}

// Whether the student's entry is right. `rem` only matters for division
// with remainders; a blank remainder counts as 0.
export function isCorrect(p, main, rem) {
  if (main === '' || Number(main) !== answerOf(p)) return false;
  if (p.blank === 'z' && p.r != null) return Number(rem || 0) === p.r;
  return true;
}

// Answer text for display; a zero remainder is left off.
export function answerText(p) {
  const main = answerOf(p);
  return p.blank === 'z' && p.r ? `${main} R${p.r}` : String(main);
}

export function equationText(p) {
  const rhs = p.r ? `${p.z} R${p.r}` : String(p.z);
  return `${p.x} ${OPS[p.op].symbol} ${p.y} = ${rhs}`;
}

const digits = (n) => String(n).length;

// A stable width (in digits) for the answer box, so its size doesn't
// change while typing or give away the answer's length.
export function answerWidth(p) {
  if (p.blank === 'x') return Math.max(2, digits(p.x));
  if (p.blank === 'y') return Math.max(2, digits(p.y));
  const dx = digits(p.x);
  const dy = digits(p.y);
  switch (p.op) {
    case 'add': return Math.max(2, Math.max(dx, dy) + 1);
    case 'sub': return Math.max(2, dx);
    case 'mul': return Math.max(2, dx + dy);
    default: return Math.max(2, dx);
  }
}
