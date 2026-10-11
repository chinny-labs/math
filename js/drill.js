// The drill screen: one problem at a time, answered with the on-screen
// keypad or the keyboard.
import { isCorrect, answerText, equationText } from './generator.js';
import { problemHTML } from './render.js';

const PRAISE = ['Great!', 'Nice!', 'You got it!', 'Awesome!', 'Super!', 'Correct!', 'Way to go!', 'Brilliant!'];
const MAX_DIGITS = 6;
const CORRECT_PAUSE_MS = 700;

const $ = (id) => document.getElementById(id);

export function createDrill({ onFinish, onQuit }) {
  const els = {
    screen: $('screen-drill'),
    problem: $('problem'),
    feedback: $('feedback'),
    progress: $('progress-fill'),
    count: $('drill-count'),
    streak: $('drill-streak'),
    keypad: $('keypad'),
    remToggle: $('rem-toggle'),
    quit: $('drill-quit'),
  };

  let problems = [];
  let index = 0;
  let input = { main: '', r: '' };
  let active = 'main';
  let results = [];
  let streak = 0;
  let startedAt = 0;
  let phase = 'idle'; // 'answering' | 'correct' | 'wrong' | 'idle'
  let advanceTimer = null;

  const current = () => problems[index];
  const hasRemainder = (p) => p.blank === 'z' && p.r != null;

  function start(list) {
    problems = list;
    index = 0;
    results = [];
    streak = 0;
    startedAt = Date.now();
    showProblem();
  }

  function showProblem() {
    const p = current();
    input = { main: '', r: '' };
    active = 'main';
    phase = 'answering';
    els.problem.className = 'problem';
    els.problem.innerHTML = problemHTML(p, 'drill');
    els.feedback.innerHTML = '';
    els.feedback.className = 'feedback';
    els.remToggle.hidden = !hasRemainder(p);
    els.count.textContent = `${index + 1} / ${problems.length}`;
    els.progress.style.width = `${(index / problems.length) * 100}%`;
    updateStreak();
    setKeypadEnabled(true);
    updateSlots();
    fitProblem();
  }

  function updateStreak() {
    els.streak.textContent = streak >= 3 ? `🔥 ${streak} in a row` : '';
  }

  function updateSlots() {
    for (const el of els.problem.querySelectorAll('.slot')) {
      const name = el.dataset.slot;
      el.textContent = input[name];
      el.classList.toggle('active', phase === 'answering' && name === active);
    }
    els.remToggle.textContent = active === 'main' ? 'Remainder →' : '← Answer';
  }

  // Shrink the problem text if it is too wide for the screen.
  function fitProblem() {
    const el = els.problem;
    el.style.fontSize = '';
    const available = el.parentElement.clientWidth - 16;
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > available && size > 18) {
      size *= 0.9;
      el.style.fontSize = `${size}px`;
    }
  }

  function setKeypadEnabled(on) {
    for (const btn of els.keypad.querySelectorAll('button')) {
      if (btn.dataset.key !== 'enter') btn.disabled = !on;
    }
    els.remToggle.disabled = !on;
  }

  function type(digit) {
    if (phase !== 'answering') return;
    if (input[active].length >= MAX_DIGITS) return;
    input[active] = input[active] === '0' ? digit : input[active] + digit;
    updateSlots();
  }

  function backspace() {
    if (phase !== 'answering') return;
    if (input[active] === '' && active === 'r') active = 'main';
    else input[active] = input[active].slice(0, -1);
    updateSlots();
  }

  function switchSlot(name) {
    if (phase !== 'answering' || !hasRemainder(current())) return;
    active = name || (active === 'main' ? 'r' : 'main');
    updateSlots();
  }

  function submit() {
    if (phase === 'wrong') return next();
    if (phase !== 'answering') return;
    const p = current();
    if (input.main === '') {
      nudge();
      return;
    }
    // With a remainder box, Enter on the answer box first moves to the remainder.
    if (hasRemainder(p) && active === 'main' && input.r === '') {
      switchSlot('r');
      return;
    }
    const correct = isCorrect(p, input.main, input.r);
    const given = Number(input.r) > 0 ? `${input.main} R${Number(input.r)}` : input.main;
    results.push({ problem: p, given, correct });
    setKeypadEnabled(false);
    if (correct) {
      phase = 'correct';
      streak++;
      updateStreak();
      els.problem.classList.add('is-correct');
      els.feedback.className = 'feedback good';
      els.feedback.textContent = `✓ ${PRAISE[Math.floor(Math.random() * PRAISE.length)]}`;
      updateSlots();
      advanceTimer = setTimeout(next, CORRECT_PAUSE_MS);
    } else {
      phase = 'wrong';
      streak = 0;
      updateStreak();
      els.problem.classList.add('is-wrong');
      els.feedback.className = 'feedback bad';
      els.feedback.innerHTML = `<span>Not quite. The answer is <strong>${answerText(p)}</strong></span>
        <span class="feedback-eq">${equationText(p)}</span>
        <button type="button" class="btn btn-primary next-btn" id="next-btn">Next →</button>`;
      updateSlots();
      $('next-btn').focus();
    }
  }

  function nudge() {
    els.problem.classList.remove('shake');
    void els.problem.offsetWidth; // restart the animation
    els.problem.classList.add('shake');
  }

  function next() {
    clearTimeout(advanceTimer);
    if (phase !== 'correct' && phase !== 'wrong') return;
    index++;
    if (index >= problems.length) {
      phase = 'idle';
      els.progress.style.width = '100%';
      onFinish({ results, seconds: Math.round((Date.now() - startedAt) / 1000) });
      return;
    }
    showProblem();
  }

  function stop() {
    clearTimeout(advanceTimer);
    phase = 'idle';
  }

  els.keypad.addEventListener('click', (e) => {
    const key = e.target.closest('button')?.dataset.key;
    if (!key) return;
    if (key === 'back') backspace();
    else if (key === 'enter') submit();
    else type(key);
  });

  els.remToggle.addEventListener('click', () => switchSlot());

  els.problem.addEventListener('click', (e) => {
    const name = e.target.closest('.slot')?.dataset.slot;
    if (name) switchSlot(name);
  });

  els.feedback.addEventListener('click', (e) => {
    if (e.target.id === 'next-btn') next();
  });

  function quit() {
    if (results.length > 0 && !window.confirm('Stop this drill?')) return;
    stop();
    onQuit();
  }

  els.quit.addEventListener('click', quit);

  document.addEventListener('keydown', (e) => {
    if (els.screen.hidden || phase === 'idle' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[0-9]$/.test(e.key)) type(e.key);
    else if (e.key === 'Backspace') backspace();
    else if (e.key === 'Enter') {
      if (phase === 'answering' || phase === 'wrong') submit();
    } else if (['r', 'R', 'Tab', ' '].includes(e.key) && phase === 'answering' && hasRemainder(current())) {
      switchSlot();
    } else if (e.key === 'Escape') quit();
    else return;
    e.preventDefault();
  });

  window.addEventListener('resize', () => {
    if (!els.screen.hidden && phase !== 'idle') fitProblem();
  });

  return { start, stop };
}
