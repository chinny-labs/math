// Turns a problem into HTML, for the drill screen ('drill') or a
// printed worksheet ('sheet').
import { OPS, answerWidth } from './generator.js';

const num = (n) => `<span class="n">${n}</span>`;

function slot(mode, name, width) {
  const style = `style="--w:${width}"`;
  if (mode === 'drill') {
    return `<span class="slot" data-slot="${name}" ${style} role="button" tabindex="-1" aria-label="${
      name === 'r' ? 'remainder' : 'answer'
    }"></span>`;
  }
  return `<span class="blank" ${style}></span>`;
}

// The answer box, plus a remainder box when the problem needs one.
function answerSlots(p, mode) {
  let html = slot(mode, 'main', answerWidth(p));
  if (p.blank === 'z' && p.r != null) {
    html += `<span class="rem-label">R</span>${slot(mode, 'r', Math.max(2, String(p.y).length))}`;
  }
  return html;
}

function part(p, key, mode) {
  return p.blank === key ? answerSlots(p, mode) : num(p[key]);
}

function horizontal(p, mode) {
  return `<div class="hz">${part(p, 'x', mode)}<span class="op">${OPS[p.op].symbol}</span>${part(
    p,
    'y',
    mode
  )}<span class="op">=</span>${part(p, 'z', mode)}</div>`;
}

function stacked(p, mode) {
  return `<div class="vt">
    <span></span>${num(p.x)}
    <span class="op">${OPS[p.op].symbol}</span>${num(p.y)}
    <span class="bar"></span>
    <span></span><span class="vt-ans">${answerSlots(p, mode)}</span>
  </div>`;
}

function longDivision(p, mode) {
  return `<div class="ld">
    <span></span><span class="ld-ans">${answerSlots(p, mode)}</span>
    <span class="ld-divisor">${num(p.y)}</span><span class="ld-dividend">${num(p.x)}</span>
  </div>`;
}

export function problemHTML(p, mode) {
  if (p.format === 'vertical') return p.op === 'div' ? longDivision(p, mode) : stacked(p, mode);
  return horizontal(p, mode);
}
