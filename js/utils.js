/**
 * Utility helpers shared across all modules.
 */

export function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= limit) { last = now; fn(...args); }
  };
}

export function raf(fn) { return requestAnimationFrame(fn); }

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function pad(n) { return String(n).padStart(2, '0'); }

export function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }

export function lerp(a, b, t) { return a + (b - a) * t; }

/* ── DOM helpers ── */
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

export function el(tag, cls = '', attrs = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  return e;
}

export function on(target, event, handler, opts) {
  target.addEventListener(event, handler, opts);
  return () => target.removeEventListener(event, handler, opts);
}

/* ── Date / Time ── */
export function formatDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

export function formatTime(date = new Date(), use12h = true) {
  if (use12h) {
    let h = date.getHours();
    const m = pad(date.getMinutes());
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return { h: pad(h), m, s: pad(date.getSeconds()), period };
  }
  return {
    h: pad(date.getHours()),
    m: pad(date.getMinutes()),
    s: pad(date.getSeconds()),
    period: ''
  };
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/* ── Animations ── */
export function animateNumber(el, to, duration = 600) {
  const from = parseFloat(el.textContent) || 0;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(lerp(from, to, ease));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function ripple(btn, e) {
  const rect = btn.getBoundingClientRect();
  const rx = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
  const ry = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
  btn.style.setProperty('--rx', rx);
  btn.style.setProperty('--ry', ry);
}

/* ── Confetti ── */
export function spawnConfetti(x, y, count = 18) {
  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      background: ${colors[i % colors.length]};
      transform: translate(
        ${(Math.random() - 0.5) * 160}px,
        ${-(Math.random() * 80 + 20)}px
      );
      animation-delay: ${Math.random() * 200}ms;
      animation-duration: ${800 + Math.random() * 600}ms;
    `;
    document.body.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

/* ── Toast notifications ── */
let toastContainer;
function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = el('div', '', { id: 'toast-container' });
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

export function toast(message, type = 'info', duration = 3000) {
  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };
  const t = el('div', `toast toast-${type}`);
  t.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
  getToastContainer().appendChild(t);

  setTimeout(() => {
    t.classList.add('removing');
    t.addEventListener('animationend', () => t.remove(), { once: true });
  }, duration);
}

/* ── Keyboard ── */
export function onKeydown(keys, handler, global = false) {
  const target = global ? document : document;
  target.addEventListener('keydown', (e) => {
    const hit = keys.some(k => {
      const parts = k.toLowerCase().split('+');
      const key = parts.at(-1);
      const ctrl = parts.includes('ctrl') || parts.includes('cmd');
      const shift = parts.includes('shift');
      const alt = parts.includes('alt');
      return e.key.toLowerCase() === key &&
        (!ctrl  || e.ctrlKey || e.metaKey) &&
        (!shift || e.shiftKey) &&
        (!alt   || e.altKey);
    });
    if (hit) handler(e);
  });
}
