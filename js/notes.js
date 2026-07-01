import { $, debounce } from './utils.js';
import { notesStore } from './storage.js';

const MAX_CHARS = 2000;

export function initNotes() {
  const textarea = $('#notes-textarea');
  if (!textarea) return;

  textarea.value = notesStore.get();
  updateCharCount(textarea.value.length);

  const save = debounce(() => {
    notesStore.save(textarea.value);
    showSaved();
  }, 600);

  textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    if (len > MAX_CHARS) {
      textarea.value = textarea.value.slice(0, MAX_CHARS);
    }
    updateCharCount(textarea.value.length);
    save();
  });

  /* Tab key indents */
  textarea.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end   = textarea.selectionEnd;
      textarea.value = textarea.value.slice(0, start) + '  ' + textarea.value.slice(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    }
  });
}

function updateCharCount(len) {
  const el = $('#notes-char-count');
  if (!el) return;
  el.textContent = `${len} / ${MAX_CHARS}`;
  el.className = 'notes-char-count' +
    (len > MAX_CHARS * 0.9 ? ' near-limit' : '') +
    (len >= MAX_CHARS      ? ' at-limit'   : '');
}

function showSaved() {
  const el = $('#notes-saved');
  if (!el) return;
  el.classList.add('visible');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('visible'), 1500);
}
