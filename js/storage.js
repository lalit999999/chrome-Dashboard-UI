/**
 * LocalStorage abstraction with JSON serialization and namespacing.
 */

const NS = 'pdash_';

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[storage] set failed:', e);
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(NS + key);
  },

  update(key, updater, fallback = null) {
    const current = this.get(key, fallback);
    const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
    this.set(key, next);
    return next;
  },

  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(NS))
      .forEach(k => localStorage.removeItem(k));
  }
};

/* ── Typed accessors ── */

export const taskStore = {
  getAll:   ()       => storage.get('tasks', []),
  save:     (tasks)  => storage.set('tasks', tasks),
  add:      (task)   => {
    const tasks = taskStore.getAll();
    tasks.unshift(task);
    taskStore.save(tasks);
  },
  update:   (id, patch) => {
    const tasks = taskStore.getAll().map(t => t.id === id ? { ...t, ...patch } : t);
    taskStore.save(tasks);
    return tasks;
  },
  remove:   (id) => {
    const tasks = taskStore.getAll().filter(t => t.id !== id);
    taskStore.save(tasks);
    return tasks;
  },
  reorder:  (tasks) => taskStore.save(tasks),
};

export const timerStore = {
  get:    ()      => storage.get('timer', { sessions: 0, focusTime: 0, lastDate: null }),
  save:   (data)  => storage.set('timer', data),
  addSession: (minutes) => {
    const d = timerStore.get();
    const today = new Date().toDateString();
    timerStore.save({
      sessions: (d.sessions || 0) + 1,
      focusTime: (d.focusTime || 0) + minutes,
      lastDate: today,
      dailySessions: d.lastDate === today ? (d.dailySessions || 0) + 1 : 1,
    });
  }
};

export const timerStateStore = {
  get:    ()      => storage.get('timer_state', null),
  save:   (data)  => storage.set('timer_state', data),
};

export const statsStore = {
  get:    ()           => storage.get('stats', { streak: 0, lastActive: null, weekly: new Array(7).fill(0) }),
  update: (patch)      => storage.update('stats', patch, { streak: 0, lastActive: null, weekly: new Array(7).fill(0) }),
  incrementDay: (day)  => {
    const s = statsStore.get();
    const weekly = s.weekly || new Array(7).fill(0);
    weekly[day] = (weekly[day] || 0) + 1;
    statsStore.update({ weekly });
  },
  checkStreak: () => {
    const s = statsStore.get();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (s.lastActive === today) return;
    const streak = s.lastActive === yesterday ? (s.streak || 0) + 1 : 1;
    statsStore.update({ streak, lastActive: today });
  }
};

export const notesStore = {
  get:  ()      => storage.get('notes', ''),
  save: (text)  => storage.set('notes', text),
};

export const focusStore = {
  get:    ()      => storage.get('focus', { text: '', done: false }),
  save:   (data)  => storage.set('focus', data),
};

export const settingsStore = {
  get:    ()      => storage.get('settings', getDefaultSettings()),
  update: (patch) => storage.update('settings', patch, getDefaultSettings()),
};

/* ── Defaults ── */
function getDefaultSettings() {
  return {
    clockFormat: '12h',
    notifications: true,
    soundEnabled: true,
  };
}
