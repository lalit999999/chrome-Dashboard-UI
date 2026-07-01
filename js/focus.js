import { $, spawnConfetti } from './utils.js';
import { focusStore } from './storage.js';

export function initFocus() {
  const data = focusStore.get();
  const input    = $('#focus-input');
  const checkbox = $('#focus-checkbox');
  const progress = $('#focus-progress-fill');

  if (input) {
    input.value = data.text || '';
    if (data.done) input.classList.add('completed');
  }
  if (checkbox && data.done) checkbox.classList.add('checked');
  updateProgress(data.done);

  input?.addEventListener('input', () => {
    focusStore.save({ text: input.value, done: false });
    if (checkbox) checkbox.classList.remove('checked');
    input.classList.remove('completed');
    updateProgress(false);
  });

  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { input.blur(); }
  });

  checkbox?.addEventListener('click', toggleFocus);
  checkbox?.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleFocus(); }
  });
}

function toggleFocus() {
  const input    = $('#focus-input');
  const checkbox = $('#focus-checkbox');
  const data     = focusStore.get();
  const done     = !data.done;

  focusStore.save({ text: data.text, done });

  if (checkbox) checkbox.classList.toggle('checked', done);
  if (input)    input.classList.toggle('completed', done);
  updateProgress(done);

  if (done && input) {
    const rect = input.getBoundingClientRect();
    spawnConfetti(rect.left + rect.width / 2, rect.top, 20);
  }
}

function updateProgress(done) {
  const bar = $('#focus-progress-fill');
  if (bar) bar.style.width = done ? '100%' : '0%';
}
