import { $, animateNumber } from './utils.js';
import { statsStore, timerStore } from './storage.js';
import { getTaskStats } from './tasks.js';

const DAYS_SHORT = ['S','M','T','W','T','F','S'];

export function initStats() {
  statsStore.checkStreak();
  render();
}

export function render() {
  const taskStats  = getTaskStats();
  const stats      = statsStore.get();
  const timerData  = timerStore.get();

  /* Animated stat counters */
  setCounter('#stat-completed',  taskStats.completed);
  setCounter('#stat-focus-time', timerData.focusTime || 0);
  setCounter('#stat-sessions',   timerData.dailySessions || 0);
  setCounter('#stat-streak',     stats.streak || 0);

  renderChart(stats.weekly || new Array(7).fill(0));
}

function setCounter(sel, value) {
  const el = $(sel);
  if (!el) return;
  const prev = parseInt(el.textContent) || 0;
  if (prev !== value) {
    el.classList.add('updating');
    animateNumber(el, value, 500);
    el.addEventListener('animationend', () => el.classList.remove('updating'), { once: true });
  }
}

function renderChart(weekly) {
  const bars = $('#chart-bars');
  if (!bars) return;
  bars.innerHTML = '';

  const max = Math.max(...weekly, 1);
  const today = new Date().getDay();

  weekly.forEach((count, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'chart-bar-wrap';

    const height = Math.max(4, (count / max) * 52);
    const bar = document.createElement('div');
    bar.className = 'chart-bar' + (i === today ? ' today' : '');
    bar.style.height = `${height}px`;
    bar.title = `${DAYS_SHORT[i]}: ${count} tasks`;

    const label = document.createElement('div');
    label.className = 'chart-day-label' + (i === today ? ' today' : '');
    label.textContent = DAYS_SHORT[i];

    wrap.appendChild(bar);
    wrap.appendChild(label);
    bars.appendChild(wrap);
  });
}
