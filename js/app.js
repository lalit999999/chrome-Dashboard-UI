/**
 * App entry point — orchestrates all modules.
 */

import { initClock }     from './clock.js';
import { initTasks }     from './tasks.js';
import { initTimer }     from './timer.js';
import { initQuotes }    from './quotes.js';
import { initWeather }   from './weather.js';
import { initWallpaper } from './wallpaper.js';
import { initNotes }     from './notes.js';
import { initShortcuts } from './shortcuts.js';
import { initCalendar }  from './calendar.js';
import { initFocus }     from './focus.js';
import { initStats }     from './stats.js';
import { initParticles } from './particles.js';

import { $, $$, onKeydown, toast } from './utils.js';
import { settingsStore, wallpaperStore } from './storage.js';

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  initParticles();
  initWallpaper();
  initClock();
  initFocus();
  initTasks();
  initTimer();
  initQuotes();
  initWeather();
  initCalendar();
  initShortcuts();
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

/* ── Theme ── */
function applyTheme() {
  const { theme } = settingsStore.get();
  document.documentElement.dataset.theme = theme || 'dark';
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  settingsStore.update({ theme: next });
  updateThemeIcon(next);
  toast(`${next === 'dark' ? 'Dark' : 'Light'} mode activated`, 'info');
}

function updateThemeIcon(theme) {
  const btn = $('#theme-toggle');
  if (!btn) return;
  btn.innerHTML = theme === 'dark'
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
         <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
         <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
         <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
         <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
       </svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
       </svg>`;
}

/* ── Global UI Bindings ── */
function bindGlobalUI() {
  /* Theme toggle */
  $('#theme-toggle')?.addEventListener('click', toggleTheme);
  updateThemeIcon(settingsStore.get().theme || 'dark');

  /* Wallpaper panel */
  const wallPanel = $('#wallpaper-panel');
  const overlay   = $('#panel-overlay');

  $('#wallpaper-toggle')?.addEventListener('click', () => {
    wallPanel?.classList.toggle('open');
    overlay?.classList.toggle('visible');
  });

  overlay?.addEventListener('click', () => {
    wallPanel?.classList.remove('open');
    overlay?.classList.remove('visible');
  });

  $('#close-wallpaper-panel')?.addEventListener('click', () => {
    wallPanel?.classList.remove('open');
    overlay?.classList.remove('visible');
  });

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

  /* D → toggle theme */
  onKeydown(['ctrl+shift+d'], e => {
    e.preventDefault();
    toggleTheme();
  });

  /* Escape → close panels */
  onKeydown(['escape'], () => {
    $('#wallpaper-panel')?.classList.remove('open');
    $('#panel-overlay')?.classList.remove('visible');
  });
}

/* ── Notifications ── */
function requestNotificationPermission() {
  const { notifications } = settingsStore.get();
  if (notifications && 'Notification' in window && Notification.permission === 'default') {
    setTimeout(() => Notification.requestPermission(), 3000);
  }
}

function $$( sel ) { return [...document.querySelectorAll(sel)]; }
