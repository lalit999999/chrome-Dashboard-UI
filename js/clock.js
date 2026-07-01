import { $, formatTime, formatDate, getGreeting, pad } from './utils.js';
import { settingsStore } from './storage.js';

let prevH = '', prevM = '';

export function initClock() {
  tick();
  setInterval(tick, 1000);
}

function tick() {
  const settings = settingsStore.get();
  const now = new Date();
  const { h, m, s, period } = formatTime(now, settings.clockFormat !== '24h');

  updateGreeting();
  updateTime(h, m, s, period);
  updateDate(now);
}

function updateGreeting() {
  const el = $('#greeting');
  if (!el) return;
  const text = getGreeting();
  if (el.textContent !== text) el.textContent = text;
}

function updateTime(h, m, s, period) {
  const timeEl = $('#clock-time');
  const secEl  = $('#clock-seconds');
  const perEl  = $('#clock-period');

  if (timeEl) {
    if (h !== prevH) { animateDigit(timeEl, 'clock-h', h); prevH = h; }
    if (m !== prevM) { animateDigit(timeEl, 'clock-m', m); prevM = m; }
    timeEl.textContent = `${h}:${m}`;
  }

  if (secEl) secEl.textContent = s;
  if (perEl) perEl.textContent = period;
}

function animateDigit(parent, cls, value) {
  /* lightweight: just a quick CSS class toggle on the parent */
  parent.classList.remove('digit-changed');
  void parent.offsetWidth;
  parent.classList.add('digit-changed');
}

function updateDate(now) {
  const el = $('#clock-date');
  if (!el) return;
  el.textContent = formatDate(now);
}
