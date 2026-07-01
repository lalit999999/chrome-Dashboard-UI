import { $, uid, toast } from './utils.js';
import { shortcutStore } from './storage.js';

let links = [];

export function initShortcuts() {
  links = shortcutStore.getAll();
  render();
  bindAddModal();
}

function render() {
  const grid = $('#shortcuts-grid');
  if (!grid) return;
  grid.innerHTML = '';

  links.forEach((link, i) => {
    const item = document.createElement('a');
    item.className = 'shortcut-item';
    item.href = link.url;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';
    item.setAttribute('aria-label', link.label);
    item.style.animationDelay = `${i * 40}ms`;

    item.innerHTML = `
      <div class="shortcut-icon">${getFavicon(link)}</div>
      <span class="shortcut-label">${escapeHtml(link.label)}</span>
      <div class="shortcut-delete" role="button" aria-label="Remove ${link.label}" tabindex="0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </div>
    `;

    item.querySelector('.shortcut-delete').addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      removeLink(link.id);
    });

    grid.appendChild(item);
  });

  /* Add button */
  const addBtn = document.createElement('div');
  addBtn.className = 'shortcut-item shortcut-add';
  addBtn.setAttribute('role', 'button');
  addBtn.setAttribute('tabindex', '0');
  addBtn.setAttribute('aria-label', 'Add shortcut');
  addBtn.innerHTML = `
    <div class="shortcut-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </div>
    <span class="shortcut-label">Add</span>
  `;
  addBtn.addEventListener('click', () => openAddModal());
  addBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openAddModal(); });
  grid.appendChild(addBtn);
}

function removeLink(id) {
  links = links.filter(l => l.id !== id);
  shortcutStore.save(links);
  render();
  toast('Shortcut removed', 'info');
}

function bindAddModal() {
  $('#shortcut-modal-cancel')?.addEventListener('click', closeAddModal);
  $('#shortcut-modal-save')?.addEventListener('click', saveLink);
  $('#shortcut-modal-backdrop')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAddModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAddModal();
  });
}

function openAddModal() {
  const modal = $('#shortcut-modal-backdrop');
  if (modal) {
    modal.classList.add('visible');
    $('#shortcut-label-input')?.focus();
  }
}

function closeAddModal() {
  const modal = $('#shortcut-modal-backdrop');
  if (modal) modal.classList.remove('visible');
  clearModal();
}

function clearModal() {
  const inputs = ['#shortcut-label-input', '#shortcut-url-input', '#shortcut-icon-input'];
  inputs.forEach(sel => { const el = $(sel); if (el) el.value = ''; });
}

function saveLink() {
  const label = $('#shortcut-label-input')?.value.trim();
  const url   = $('#shortcut-url-input')?.value.trim();
  const icon  = $('#shortcut-icon-input')?.value.trim() || '🔗';

  if (!label) { toast('Please enter a name', 'error'); return; }
  if (!url)   { toast('Please enter a URL', 'error'); return; }

  let finalUrl = url;
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = 'https://' + finalUrl;
  }

  links.push({ id: uid(), label, url: finalUrl, icon });
  shortcutStore.save(links);
  closeAddModal();
  render();
  toast('Shortcut added!', 'success');
}

function getFavicon(link) {
  /* Use the stored emoji/icon; fall back to a letter avatar */
  if (link.icon && link.icon.length <= 4) return link.icon;
  return link.label.charAt(0).toUpperCase();
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
