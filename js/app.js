/**
 * App entry point — orchestrates all modules.
 */

import { initClock }     from './clock.js';
import { initTasks }     from './tasks.js';
import { initTimer }     from './timer.js';
import { initQuotes }    from './quotes.js';
import { initWeather }   from './weather.js';
import { initNotes }     from './notes.js';
import { initCalendar }  from './calendar.js';
import { initFocus }     from './focus.js';
import { initStats }     from './stats.js';
import { initParticles } from './particles.js';

import { $, $$, onKeydown } from './utils.js';
import { settingsStore } from './storage.js';

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initClock();
  initFocus();
  initTasks();
  initTimer();
  initQuotes();
  initWeather();
  initCalendar();
  initNotes();
  initStats();
  bindGlobalUI();
  registerKeyboardShortcuts();
  requestNotificationPermission();

  /* Stagger page load animations */
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 400ms ease';
    document.body.style.opacity = '1';
  });
});

/* ── Global UI Bindings ── */
function bindGlobalUI() {
  /* Search */
  const searchInput = $('#search-input');
  searchInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = encodeURIComponent(e.target.value.trim());
      if (q) window.location.href = `https://www.google.com/search?q=${q}`;
    }
    if (e.key === 'Escape') { e.target.value = ''; e.target.blur(); }
  });

  /* Mouse parallax on blobs */
  document.addEventListener('mousemove', parallax);
}

let pTick = false;
function parallax(e) {
  if (pTick) return;
  pTick = true;
  requestAnimationFrame(() => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;

    $$('.blob').forEach((blob, i) => {
      const factor = (i + 1) * 10;
      blob.style.transform = `translate(${dx * factor}px, ${dy * factor}px) scale(1)`;
    });
    pTick = false;
  });
}

/* ── Keyboard Shortcuts ── */
function registerKeyboardShortcuts() {
  /* / or Ctrl+K → focus search */
  onKeydown(['/', 'ctrl+k'], e => {
    e.preventDefault();
    $('#search-input')?.focus();
  });

  /* T → focus task input */
  onKeydown(['t'], e => {
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      $('#task-add-input')?.focus();
    }
  });

  /* N → focus notes */
  onKeydown(['n'], e => {
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      $('#notes-textarea')?.focus();
    }
  });

  /* Space → start/pause timer (when not in input) */
  onKeydown([' '], e => {
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      $('#timer-start')?.click();
    }
  });
}

/* ── Notifications ── */
function requestNotificationPermission() {
  const { notifications } = settingsStore.get();
  if (notifications && 'Notification' in window && Notification.permission === 'default') {
    setTimeout(() => Notification.requestPermission(), 3000);
  }
}
