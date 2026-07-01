import { $, $$, uid, spawnConfetti, toast, debounce } from './utils.js';
import { taskStore, statsStore } from './storage.js';

let tasks = [];
let filter = 'all';
let searchQuery = '';
let dragSrc = null;

export function initTasks() {
  tasks = taskStore.getAll();
  bindUI();
  render();
}

function bindUI() {
  const addInput  = $('#task-add-input');
  const addBtn    = $('#task-add-btn');
  const searchEl  = $('#tasks-search');
  const filterBtns = $$('.filter-tab');
  const clearDone = $('#clear-completed');

  addBtn?.addEventListener('click', addTask);
  addInput?.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

  searchEl?.addEventListener('input', debounce(e => {
    searchQuery = e.target.value.toLowerCase();
    render();
  }, 200));

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.toggle('active', b === btn));
      render();
    });
  });

  clearDone?.addEventListener('click', () => {
    tasks = tasks.filter(t => !t.done);
    taskStore.save(tasks);
    render();
    toast('Completed tasks cleared', 'success');
  });
}

function addTask() {
  const input    = $('#task-add-input');
  const priority = $('#task-priority')?.value || 'med';
  const text = input?.value.trim();
  if (!text) return;

  const task = {
    id: uid(),
    text,
    done: false,
    priority,
    createdAt: Date.now(),
  };

  tasks.unshift(task);
  taskStore.save(tasks);
  if (input) input.value = '';
  render();
  toast('Task added', 'success');
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  task.doneAt = task.done ? Date.now() : null;
  taskStore.save(tasks);

  if (task.done) {
    const el = $(`[data-task-id="${id}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
    }
    statsStore.incrementDay(new Date().getDay());
    statsStore.checkStreak();
    toast('Task completed! 🎉', 'success');
  }

  render();
  updateTaskCount();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  taskStore.save(tasks);
  render();
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const el = $(`[data-task-id="${id}"] .task-title`);
  if (!el) return;

  const original = task.text;
  el.contentEditable = 'true';
  el.focus();

  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);

  const finish = () => {
    el.contentEditable = 'false';
    const newText = el.textContent.trim();
    if (newText && newText !== original) {
      task.text = newText;
      taskStore.save(tasks);
      toast('Task updated', 'info');
    } else {
      el.textContent = original;
    }
    el.removeEventListener('blur', finish);
    el.removeEventListener('keydown', onKey);
  };

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish(); }
    if (e.key === 'Escape') { el.textContent = original; finish(); }
  };

  el.addEventListener('blur', finish, { once: true });
  el.addEventListener('keydown', onKey);
}

function getFiltered() {
  return tasks.filter(t => {
    const matchFilter = filter === 'all' || (filter === 'active' && !t.done) || (filter === 'done' && t.done);
    const matchSearch = !searchQuery || t.text.toLowerCase().includes(searchQuery);
    return matchFilter && matchSearch;
  });
}

export function render() {
  const list = $('#tasks-list');
  if (!list) return;
  const filtered = getFiltered();

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
        <p>${searchQuery ? 'No tasks match your search' : filter === 'done' ? 'No completed tasks yet' : 'No tasks yet. Add one above!'}</p>
      </div>`;
    updateTaskCount();
    return;
  }

  list.innerHTML = '';
  filtered.forEach((task, i) => {
    const item = buildTaskEl(task, i);
    list.appendChild(item);
  });

  initDragDrop();
  updateTaskCount();
}

function buildTaskEl(task, index) {
  const item = document.createElement('div');
  item.className = 'task-item';
  item.dataset.taskId = task.id;
  item.draggable = true;
  item.style.animationDelay = `${index * 30}ms`;

  const priorityLabels = { high: 'High', med: 'Med', low: 'Low' };

  item.innerHTML = `
    <svg class="task-drag-handle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/>
      <circle cx="9" cy="18" r="1" fill="currentColor"/><circle cx="15" cy="6" r="1" fill="currentColor"/>
      <circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="18" r="1" fill="currentColor"/>
    </svg>
    <div class="task-checkbox ${task.done ? 'checked' : ''}" aria-label="Toggle task" role="checkbox" aria-checked="${task.done}" tabindex="0">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <div class="task-content">
      <span class="task-title ${task.done ? 'completed' : ''}">${escapeHtml(task.text)}</span>
      <div class="task-meta">
        <span class="badge badge-${task.priority}">${priorityLabels[task.priority] || 'Med'}</span>
        <span class="text-xs text-muted">${timeAgo(task.createdAt)}</span>
      </div>
    </div>
    <div class="task-actions">
      <button class="task-action-btn edit" aria-label="Edit task" data-tooltip="Edit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="task-action-btn delete" aria-label="Delete task" data-tooltip="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
        </svg>
      </button>
    </div>`;

  item.querySelector('.task-checkbox').addEventListener('click', () => toggleTask(task.id));
  item.querySelector('.task-checkbox').addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleTask(task.id); }
  });
  item.querySelector('.edit').addEventListener('click', () => editTask(task.id));
  item.querySelector('.delete').addEventListener('click', () => deleteTask(task.id));

  return item;
}

function initDragDrop() {
  const items = $$('.task-item');
  items.forEach(item => {
    item.addEventListener('dragstart', e => {
      dragSrc = item.dataset.taskId;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      $$('.task-item').forEach(i => i.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      if (item.dataset.taskId !== dragSrc) item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (dragSrc && item.dataset.taskId !== dragSrc) {
        reorderTasks(dragSrc, item.dataset.taskId);
      }
    });
  });
}

function reorderTasks(srcId, destId) {
  const srcIdx  = tasks.findIndex(t => t.id === srcId);
  const destIdx = tasks.findIndex(t => t.id === destId);
  if (srcIdx < 0 || destIdx < 0) return;
  const [moved] = tasks.splice(srcIdx, 1);
  tasks.splice(destIdx, 0, moved);
  taskStore.save(tasks);
  render();
}

function updateTaskCount() {
  const el = $('#tasks-count');
  if (!el) return;
  const done  = tasks.filter(t => t.done).length;
  const total = tasks.length;
  el.textContent = `${done} of ${total} completed`;
}

export function getTaskStats() {
  return {
    total:     tasks.length,
    completed: tasks.filter(t => t.done).length,
    active:    tasks.filter(t => !t.done).length,
  };
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
