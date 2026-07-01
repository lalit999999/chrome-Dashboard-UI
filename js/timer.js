import { $, pad, toast } from './utils.js';
import { timerStore, settingsStore, timerStateStore } from './storage.js';

const MODES = {
  pomodoro: { label: 'Focus',       minutes: 25, color: '#3b82f6' },
  short:    { label: 'Short Break', minutes: 5,  color: '#10b981' },
  long:     { label: 'Long Break',  minutes: 15, color: '#8b5cf6' },
};

const RING_RADIUS = 54;
const RING_CIRC   = 2 * Math.PI * RING_RADIUS;

let state = {
  mode:      'pomodoro',
  total:     25 * 60,
  remaining: 25 * 60,
  running:   false,
  endAt:     null,
  sessions:  0,
};

let intervalId = null;

export function initTimer() {
  const saved = timerStore.get();
  state.sessions = saved.dailySessions || 0;

  restoreState();
  renderTimer();
  bindUI();
  updateRing(state.total ? state.remaining / state.total : 1);
  updateRingColor(MODES[state.mode].color);
  updateStartBtn();
  updateStats();

  if (state.running) {
    $(`#timer-ring`)?.closest('.timer-widget')?.classList.add('timer-active');
    runInterval();
  }
}

function restoreState() {
  const persisted = timerStateStore.get();
  if (!persisted || !MODES[persisted.mode]) return;

  state.mode  = persisted.mode;
  state.total = persisted.total || MODES[state.mode].minutes * 60;

  if (persisted.running && persisted.endAt) {
    const remaining = Math.round((persisted.endAt - Date.now()) / 1000);
    state.remaining = Math.max(0, remaining);
    state.running   = state.remaining > 0;
    state.endAt      = state.running ? persisted.endAt : null;
  } else {
    state.remaining = Math.min(persisted.remaining ?? state.total, state.total);
    state.running   = false;
    state.endAt      = null;
  }
}

function persistState() {
  timerStateStore.save({
    mode:      state.mode,
    total:     state.total,
    remaining: state.remaining,
    running:   state.running,
    endAt:     state.endAt,
  });
}

function bindUI() {
  $$('.timer-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.running) return;
      setMode(btn.dataset.mode);
      $$('.timer-mode-btn').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  $('#timer-start')?.addEventListener('click', toggle);
  $('#timer-reset')?.addEventListener('click', reset);
  $('#timer-custom-btn')?.addEventListener('click', setCustom);

  /* custom duration input */
  $('#timer-custom-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') setCustom();
  });
}

function toggle() {
  state.running ? pause() : start();
}

function start() {
  if (state.remaining <= 0) reset();
  state.running = true;
  state.endAt = Date.now() + state.remaining * 1000;
  updateStartBtn();
  $(`#timer-ring`)?.closest('.timer-widget')?.classList.add('timer-active');
  persistState();
  runInterval();
}

function runInterval() {
  if (intervalId) clearInterval(intervalId);

  intervalId = setInterval(() => {
    state.remaining = Math.max(0, Math.round((state.endAt - Date.now()) / 1000));
    renderTimer();
    updateRing(state.remaining / state.total);

    if (state.remaining <= 0) {
      clearInterval(intervalId);
      intervalId = null;
      state.running = false;
      state.endAt = null;
      onComplete();
    } else {
      persistState();
    }
  }, 1000);
}

function pause() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  state.running = false;
  state.endAt = null;
  updateStartBtn();
  $(`#timer-ring`)?.closest('.timer-widget')?.classList.remove('timer-active');
  persistState();
}

function reset() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  state.running = false;
  state.endAt = null;
  state.remaining = state.total;
  renderTimer();
  updateRing(1);
  updateStartBtn();
  $(`#timer-ring`)?.closest('.timer-widget')?.classList.remove('timer-active');
  persistState();
}

function setMode(mode) {
  if (!MODES[mode]) return;
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  state.running = false;
  state.endAt = null;
  state.mode = mode;
  state.total = MODES[mode].minutes * 60;
  state.remaining = state.total;
  renderTimer();
  updateRing(1);
  updateStartBtn();
  updateRingColor(MODES[mode].color);
  persistState();
}

function setCustom() {
  const input = $('#timer-custom-input');
  const val = parseInt(input?.value, 10);
  if (!val || val < 1 || val > 180) {
    toast('Enter 1–180 minutes', 'error');
    return;
  }
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  state.running = false;
  state.endAt = null;
  state.total = val * 60;
  state.remaining = state.total;
  if (input) input.value = '';
  renderTimer();
  updateRing(1);
  updateStartBtn();
  persistState();
  toast(`Timer set to ${val} minutes`, 'info');
}

function onComplete() {
  state.sessions++;
  timerStore.addSession(Math.floor(state.total / 60));
  updateStats();
  updateRing(0);
  $(`#timer-ring`)?.closest('.timer-widget')?.classList.remove('timer-active');
  updateStartBtn();
  persistState();

  const settings = settingsStore.get();

  if (settings.notifications && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('Timer Complete! 🎉', {
        body: `${MODES[state.mode]?.label || 'Session'} finished. Time for a break!`,
        icon: 'assets/icons/icon-192.png',
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }

  if (settings.soundEnabled) playBeep();
  toast(`${MODES[state.mode]?.label || 'Session'} complete! 🎉`, 'success');

  /* auto-advance to break after pomodoro */
  if (state.mode === 'pomodoro') {
    const nextMode = state.sessions % 4 === 0 ? 'long' : 'short';
    setTimeout(() => {
      setMode(nextMode);
      $$('.timer-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === nextMode));
    }, 1500);
  }
}

function renderTimer() {
  const m = Math.floor(state.remaining / 60);
  const s = state.remaining % 60;
  const el = $('#timer-countdown');
  if (el) el.textContent = `${pad(m)}:${pad(s)}`;

  const label = $('#timer-mode-label');
  if (label) label.textContent = MODES[state.mode]?.label || 'Focus';

  $$('.timer-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === state.mode));
}

function updateStartBtn() {
  const btn = $('#timer-start');
  if (!btn) return;
  btn.innerHTML = state.running
    ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>`;
  btn.setAttribute('aria-label', state.running ? 'Pause timer' : 'Start timer');
}

function updateRing(progress) {
  const ring = $('#timer-ring');
  if (!ring) return;
  const offset = RING_CIRC * (1 - Math.max(0, Math.min(1, progress)));
  ring.style.strokeDashoffset = offset;
  ring.style.strokeDasharray  = RING_CIRC;
}

function updateRingColor(color) {
  const stop1 = document.getElementById('timerStop1');
  const stop2 = document.getElementById('timerStop2');
  if (stop1) stop1.setAttribute('stop-color', color);
  if (stop2) stop2.setAttribute('stop-color', color);
}

function updateStats() {
  const sessEl = $('#timer-sessions');
  const timeEl = $('#timer-focus-time');
  const saved  = timerStore.get();

  if (sessEl) sessEl.textContent = saved.dailySessions || 0;
  if (timeEl) {
    const mins = saved.focusTime || 0;
    timeEl.textContent = mins >= 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}m`;
  }
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 150, 300].forEach(delay => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delay / 1000);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.3);
      osc.start(ctx.currentTime + delay / 1000);
      osc.stop(ctx.currentTime + delay / 1000 + 0.35);
    });
  } catch { /* AudioContext not available */ }
}

function $$(sel) { return [...document.querySelectorAll(sel)]; }
