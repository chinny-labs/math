// Printable worksheets built from the same settings as the drill.
import { OPS, LEVELS, generateSet, answerText, enabledOps, enabledFormats, FORMATS } from './generator.js';
import { problemHTML } from './render.js';

const escapeHTML = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const digits = (n) => String(n).length;

// Columns that fit the widest problem on a letter/A4 page.
function columnsFor(problems) {
  let cols = 5;
  for (const p of problems) {
    if (p.format === 'vertical') {
      const width = p.op === 'div' ? digits(p.x) + digits(p.y) + 1 : Math.max(digits(p.x), digits(p.y), digits(p.z)) + 1;
      cols = Math.min(cols, width <= 5 ? 5 : width <= 7 ? 4 : 3);
    } else {
      const chars = digits(p.x) + digits(p.y) + digits(p.z) + 7 + (p.r != null ? 4 : 0);
      cols = Math.min(cols, chars <= 13 ? 4 : chars <= 19 ? 3 : 2);
    }
  }
  return cols;
}

// Stacked problems that need working space (long multiplication and
// long division) get taller cells.
function needsRoom(p) {
  if (p.format !== 'vertical') return false;
  return (p.op === 'mul' && p.y >= 10) || (p.op === 'div' && p.x >= 100);
}

export function describeSettings(settings) {
  const ops = enabledOps(settings).map((op) => {
    const s = settings.ops[op];
    const level = s.level === 'custom' ? 'custom' : LEVELS[op].find((l) => l.id === s.level)?.label;
    return `${OPS[op].name} (${level}${op === 'div' && s.remainders ? ', remainders' : ''})`;
  });
  const formats = enabledFormats(settings).map((f) => FORMATS[f].toLowerCase());
  return `${ops.join(', ')} · ${formats.join(' + ')}`;
}

export function renderWorksheet(container, problems, sheet) {
  const cols = columnsFor(problems);
  const roomy = problems.some(needsRoom);
  const header = `
    <header class="sheet-head">
      <h2 class="sheet-title">${escapeHTML(sheet.title || 'Math Practice')}</h2>
      ${
        sheet.nameLine
          ? `<div class="sheet-name"><span>Name <i></i></span><span>Date <i></i></span><span>Score <i class="short"></i> / ${problems.length}</span></div>`
          : ''
      }
    </header>`;

  const items = problems
    .map(
      (p, i) =>
        `<div class="sheet-item${p.format === 'vertical' ? ' is-vertical' : ''}"><span class="sheet-num">${
          i + 1
        }.</span>${problemHTML(p, 'sheet')}</div>`
    )
    .join('');

  const key = sheet.answerKey
    ? `<section class="answer-key">
        <h2 class="sheet-title">${escapeHTML(sheet.title || 'Math Practice')} — Answer Key</h2>
        <ol class="key-list">${problems.map((p) => `<li>${answerText(p)}</li>`).join('')}</ol>
      </section>`
    : '';

  container.innerHTML = `
    <div class="sheet-page">
      ${header}
      <div class="sheet-grid${roomy ? ' roomy' : ''}" style="--cols:${cols}">${items}</div>
    </div>
    ${key}`;
}

export function newWorksheetProblems(settings) {
  return generateSet(settings, settings.sheet.count);
}
