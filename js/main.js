// App wiring: the setup screen, switching screens, results, worksheets.
import { OPS, OP_KEYS, LEVELS, CUSTOM_LABELS, MAX_NUMBER, generateSet, enabledOps, enabledFormats, equationText, shuffle } from './generator.js';
import { loadSettings, saveSettings, cleanRange, DRILL_COUNTS, SHEET_COUNTS } from './settings.js';
import { createDrill } from './drill.js';
import { renderWorksheet, newWorksheetProblems, describeSettings } from './worksheet.js';
import { confetti } from './confetti.js';

const $ = (id) => document.getElementById(id);
const settings = loadSettings();
const SCREENS = ['setup', 'drill', 'results', 'sheet'];

let lastResults = [];
let sheetProblems = [];

function show(name) {
  for (const s of SCREENS) $(`screen-${s}`).hidden = s !== name;
  document.body.dataset.screen = name;
  window.scrollTo(0, 0);
}

function save() {
  saveSettings(settings);
  validate();
}

/* ---------- Setup screen ---------- */

function buildOpTiles() {
  const grid = $('op-grid');
  grid.innerHTML = OP_KEYS.map((op) => {
    const [labelA, labelB] = CUSTOM_LABELS[op];
    const options = LEVELS[op].map((l) => `<option value="${l.id}">${l.label}</option>`).join('');
    const range = (key, label) => `
      <div class="range-row">
        <span>${label}</span>
        <input type="number" inputmode="numeric" min="${op === 'div' && key === 'a' ? 1 : 0}" max="${MAX_NUMBER}" data-range="${key}" data-end="0" aria-label="${label} from" />
        <span>to</span>
        <input type="number" inputmode="numeric" min="${op === 'div' && key === 'a' ? 1 : 0}" max="${MAX_NUMBER}" data-range="${key}" data-end="1" aria-label="${label} to" />
      </div>`;
    return `
      <div class="op-tile op-${op}" data-op="${op}">
        <button type="button" class="op-toggle" aria-pressed="false">
          <span class="op-sym" aria-hidden="true">${OPS[op].symbol}</span>
          <span class="op-name">${OPS[op].name}</span>
          <span class="op-check" aria-hidden="true"></span>
        </button>
        <div class="op-options">
          <select class="op-level" aria-label="${OPS[op].name} level">${options}<option value="custom">Custom numbers…</option></select>
          <div class="custom-range" hidden>
            ${range('a', labelA)}
            ${range('b', labelB)}
            ${op === 'mul' ? '<p class="hint">Tip: 1 to 12 and 7 to 7 practices the 7 times table.</p>' : ''}
          </div>
          ${op === 'div' ? '<label class="check"><input type="checkbox" class="op-rem" /> Allow remainders</label>' : ''}
        </div>
      </div>`;
  }).join('');

  for (const tile of grid.querySelectorAll('.op-tile')) {
    const op = tile.dataset.op;
    const s = settings.ops[op];
    tile.querySelector('.op-toggle').addEventListener('click', () => {
      s.on = !s.on;
      syncOpTile(tile);
      save();
    });
    tile.querySelector('.op-level').addEventListener('change', (e) => {
      s.level = e.target.value;
      syncOpTile(tile);
      save();
    });
    for (const input of tile.querySelectorAll('[data-range]')) {
      input.addEventListener('change', () => {
        const key = input.dataset.range;
        const raw = [...tile.querySelectorAll(`[data-range="${key}"]`)].map((i) => i.value);
        s.custom[key] = cleanRange(raw, s.custom[key], op === 'div' && key === 'a' ? 1 : 0);
        syncOpTile(tile);
        save();
      });
    }
    tile.querySelector('.op-rem')?.addEventListener('change', (e) => {
      s.remainders = e.target.checked;
      save();
    });
    syncOpTile(tile);
  }
}

function syncOpTile(tile) {
  const s = settings.ops[tile.dataset.op];
  tile.classList.toggle('on', s.on);
  tile.querySelector('.op-toggle').setAttribute('aria-pressed', String(s.on));
  tile.querySelector('.op-level').value = s.level;
  tile.querySelector('.custom-range').hidden = s.level !== 'custom';
  for (const input of tile.querySelectorAll('[data-range]')) {
    input.value = s.custom[input.dataset.range][Number(input.dataset.end)];
  }
  const rem = tile.querySelector('.op-rem');
  if (rem) rem.checked = s.remainders;
}

function buildFormatTiles() {
  for (const tile of document.querySelectorAll('.format-tile')) {
    const f = tile.dataset.format;
    const sync = () => {
      tile.setAttribute('aria-pressed', String(settings.formats[f]));
      tile.classList.toggle('on', settings.formats[f]);
    };
    tile.addEventListener('click', () => {
      settings.formats[f] = !settings.formats[f];
      sync();
      save();
    });
    sync();
  }
}

function buildCountChips() {
  const row = $('count-chips');
  row.innerHTML = DRILL_COUNTS.map(
    (n) => `<button type="button" class="chip" role="radio" data-count="${n}">${n}</button>`
  ).join('');
  const sync = () => {
    for (const chip of row.querySelectorAll('.chip')) {
      const on = Number(chip.dataset.count) === settings.drillCount;
      chip.classList.toggle('on', on);
      chip.setAttribute('aria-checked', String(on));
    }
  };
  row.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    settings.drillCount = Number(chip.dataset.count);
    sync();
    save();
  });
  sync();
}

function validate() {
  let msg = '';
  if (!enabledOps(settings).length) msg = 'Pick at least one kind of problem in step 1.';
  else if (!enabledFormats(settings).length) msg = 'Pick at least one way for problems to look in step 2.';
  $('setup-error').textContent = msg;
  $('start-drill').disabled = Boolean(msg);
  $('make-sheet').disabled = Boolean(msg);
  return !msg;
}

/* ---------- Drill + results ---------- */

const drill = createDrill({
  onFinish: showResults,
  onQuit: () => show('setup'),
});

function startDrill(problems) {
  show('drill');
  drill.start(problems);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m} min ${s} sec` : `${s} sec`;
}

function showResults({ results, seconds }) {
  lastResults = results;
  const total = results.length;
  const score = results.filter((r) => r.correct).length;
  const pct = score / total;
  const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
  const title =
    pct === 1 ? 'Perfect score!' : pct >= 0.9 ? 'Amazing work!' : pct >= 0.7 ? 'Great job!' : pct >= 0.5 ? 'Good effort!' : "Keep practicing — you're getting there!";

  $('stars').innerHTML = [0, 1, 2].map((i) => `<span class="star${i < stars ? ' lit' : ''}">★</span>`).join('');
  $('results-title').textContent = title;
  $('score').textContent = score;
  $('total').textContent = total;
  $('results-time').textContent = `Time: ${formatTime(seconds)}`;

  const missed = results.filter((r) => !r.correct);
  $('missed-wrap').hidden = !missed.length;
  $('missed-list').innerHTML = missed
    .map((r) => `<li><span class="missed-eq">${equationText(r.problem)}</span><span class="missed-given">you said ${r.given}</span></li>`)
    .join('');
  $('retry-missed').hidden = !missed.length;

  show('results');
  if (pct >= 0.8) confetti();
}

/* ---------- Worksheets ---------- */

function buildSheetControls() {
  $('sheet-count').innerHTML = SHEET_COUNTS.map((n) => `<option value="${n}">${n}</option>`).join('');
  $('sheet-count').value = settings.sheet.count;
  $('sheet-title').value = settings.sheet.title;
  $('sheet-name').checked = settings.sheet.nameLine;
  $('sheet-key').checked = settings.sheet.answerKey;

  $('sheet-count').addEventListener('change', (e) => {
    settings.sheet.count = Number(e.target.value);
    save();
    sheetProblems = newWorksheetProblems(settings);
    drawSheet();
  });
  $('sheet-title').addEventListener('input', (e) => {
    settings.sheet.title = e.target.value;
    save();
    drawSheet();
  });
  $('sheet-name').addEventListener('change', (e) => {
    settings.sheet.nameLine = e.target.checked;
    save();
    drawSheet();
  });
  $('sheet-key').addEventListener('change', (e) => {
    settings.sheet.answerKey = e.target.checked;
    save();
    drawSheet();
  });
  $('sheet-new').addEventListener('click', () => {
    sheetProblems = newWorksheetProblems(settings);
    drawSheet();
  });
  $('sheet-print').addEventListener('click', () => window.print());
  $('sheet-back').addEventListener('click', () => show('setup'));
}

function drawSheet() {
  renderWorksheet($('sheet'), sheetProblems, settings.sheet);
}

function openSheet() {
  sheetProblems = newWorksheetProblems(settings);
  $('sheet-summary').textContent = describeSettings(settings);
  drawSheet();
  show('sheet');
}

/* ---------- Start up ---------- */

buildOpTiles();
buildFormatTiles();
buildCountChips();
buildSheetControls();
validate();

$('start-drill').addEventListener('click', () => {
  if (validate()) startDrill(generateSet(settings, settings.drillCount));
});
$('make-sheet').addEventListener('click', () => {
  if (validate()) openSheet();
});
$('play-again').addEventListener('click', () => startDrill(generateSet(settings, settings.drillCount)));
$('retry-missed').addEventListener('click', () =>
  startDrill(shuffle(lastResults.filter((r) => !r.correct).map((r) => r.problem)))
);
$('change-settings').addEventListener('click', () => show('setup'));
$('home-link').addEventListener('click', () => {
  if (document.body.dataset.screen === 'drill') $('drill-quit').click();
  else show('setup');
});

show('setup');
