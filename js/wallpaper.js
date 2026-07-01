import { $, toast } from './utils.js';
import { wallpaperStore } from './storage.js';

const WALLPAPERS = [
  { id: 'gradient-1',  type: 'gradient', label: 'Aurora',    value: 'linear-gradient(135deg, #0a0b0f 0%, #1a1040 40%, #0f2060 100%)' },
  { id: 'gradient-2',  type: 'gradient', label: 'Midnight',  value: 'linear-gradient(135deg, #000000 0%, #0a0020 50%, #000010 100%)' },
  { id: 'gradient-3',  type: 'gradient', label: 'Ocean',     value: 'linear-gradient(135deg, #0c1445 0%, #0a2a5e 50%, #051a40 100%)' },
  { id: 'gradient-4',  type: 'gradient', label: 'Forest',    value: 'linear-gradient(135deg, #0a1f0a 0%, #0d2e1a 50%, #081508 100%)' },
  { id: 'gradient-5',  type: 'gradient', label: 'Sunset',    value: 'linear-gradient(135deg, #1a0a00 0%, #2a0a10 50%, #1a0520 100%)' },
  { id: 'gradient-6',  type: 'gradient', label: 'Cosmos',    value: 'linear-gradient(135deg, #050010 0%, #100025 50%, #050015 100%)' },
  { id: 'gradient-7',  type: 'gradient', label: 'Ember',     value: 'linear-gradient(135deg, #1a0500 0%, #2a1000 50%, #1a0800 100%)' },
  { id: 'gradient-8',  type: 'gradient', label: 'Arctic',    value: 'linear-gradient(135deg, #050a15 0%, #0a1525 50%, #050d1a 100%)' },
  { id: 'gradient-9',  type: 'gradient', label: 'Nebula',    value: 'linear-gradient(135deg, #0d0020 0%, #1a0040 40%, #0a1040 100%)' },
  { id: 'gradient-10', type: 'gradient', label: 'Slate',     value: 'linear-gradient(135deg, #0a0b0f 0%, #111827 50%, #0f172a 100%)' },
];

let state = wallpaperStore.get();

export function initWallpaper() {
  applyWallpaper(state.active, false);
  applySliders();
  buildGallery();
  bindPanel();
}

function applyWallpaper(id, animate = true) {
  const wallLayer = $('#wallpaper-layer');
  if (!wallLayer) return;

  const wp = WALLPAPERS.find(w => w.id === id) || WALLPAPERS[0];

  if (animate) {
    wallLayer.classList.add('transitioning');
    wallLayer.addEventListener('animationend', () => wallLayer.classList.remove('transitioning'), { once: true });
  }

  if (wp.type === 'gradient') {
    wallLayer.style.background = wp.value;
    wallLayer.style.backgroundImage = '';
  } else if (wp.type === 'image' || wp.type === 'custom') {
    wallLayer.style.backgroundImage = `url('${wp.value}')`;
    wallLayer.style.backgroundSize  = 'cover';
    wallLayer.style.backgroundPosition = 'center';
    wallLayer.style.background = '';
  }

  state.active = id;
  wallpaperStore.update({ active: id });
  updateGalleryActive(id);
}

function applySliders() {
  const wallLayer = $('#wallpaper-layer');
  const overlay   = $('#bg-overlay');

  document.documentElement.style.setProperty('--wallpaper-blur',       `${state.blur || 0}px`);
  document.documentElement.style.setProperty('--wallpaper-brightness',  state.brightness ?? 1);
  document.documentElement.style.setProperty('--overlay-opacity',       state.overlay ?? 0.6);

  if (wallLayer) {
    wallLayer.style.filter = `blur(${state.blur || 0}px) brightness(${state.brightness ?? 1})`;
  }
  if (overlay) {
    overlay.style.opacity = state.overlay ?? 0.6;
  }
}

function buildGallery() {
  const grid = $('#wallpaper-grid');
  if (!grid) return;
  grid.innerHTML = '';

  WALLPAPERS.forEach(wp => {
    const thumb = document.createElement('div');
    thumb.className = `wallpaper-thumb ${wp.id === state.active ? 'active' : ''}`;
    thumb.dataset.id = wp.id;
    thumb.title = wp.label;

    if (wp.type === 'gradient') {
      thumb.style.background = wp.value;
    } else {
      thumb.style.backgroundImage = `url('${wp.value}')`;
    }

    thumb.innerHTML = `
      <div class="check-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <span style="position:absolute;bottom:4px;left:6px;font-size:0.65rem;font-weight:600;color:rgba(255,255,255,0.8);text-shadow:0 1px 3px rgba(0,0,0,0.8)">${wp.label}</span>
    `;

    thumb.addEventListener('click', () => applyWallpaper(wp.id));
    grid.appendChild(thumb);
  });

  /* custom upload */
  const uploadBtn = document.createElement('div');
  uploadBtn.className = 'wallpaper-thumb';
  uploadBtn.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:var(--glass-bg);border:2px dashed var(--glass-border);cursor:pointer;';
  uploadBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-tertiary)">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
    </svg>
    <span style="font-size:0.65rem;font-weight:600;color:var(--text-tertiary)">Upload</span>
    <input type="file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;">
  `;
  uploadBtn.querySelector('input').addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const customWp = { id: 'custom', type: 'custom', label: 'Custom', value: ev.target.result };
      const existing = WALLPAPERS.findIndex(w => w.id === 'custom');
      if (existing >= 0) WALLPAPERS[existing] = customWp;
      else WALLPAPERS.push(customWp);
      applyWallpaper('custom');
      buildGallery();
    };
    reader.readAsDataURL(file);
  });
  grid.appendChild(uploadBtn);
}

function bindPanel() {
  const blurSlider       = $('#blur-slider');
  const brightnessSlider = $('#brightness-slider');
  const overlaySlider    = $('#overlay-slider');

  blurSlider?.addEventListener('input', e => {
    state.blur = parseFloat(e.target.value);
    $('#blur-value').textContent = state.blur + 'px';
    applySliders();
    wallpaperStore.update({ blur: state.blur });
  });

  brightnessSlider?.addEventListener('input', e => {
    state.brightness = parseFloat(e.target.value);
    $('#brightness-value').textContent = state.brightness.toFixed(1);
    applySliders();
    wallpaperStore.update({ brightness: state.brightness });
  });

  overlaySlider?.addEventListener('input', e => {
    state.overlay = parseFloat(e.target.value);
    $('#overlay-value').textContent = state.overlay.toFixed(1);
    applySliders();
    wallpaperStore.update({ overlay: state.overlay });
  });

  /* init slider values */
  if (blurSlider) {
    blurSlider.value = state.blur || 0;
    const bv = $('#blur-value');
    if (bv) bv.textContent = (state.blur || 0) + 'px';
  }
  if (brightnessSlider) {
    brightnessSlider.value = state.brightness ?? 1;
    const bv = $('#brightness-value');
    if (bv) bv.textContent = (state.brightness ?? 1).toFixed(1);
  }
  if (overlaySlider) {
    overlaySlider.value = state.overlay ?? 0.6;
    const ov = $('#overlay-value');
    if (ov) ov.textContent = (state.overlay ?? 0.6).toFixed(1);
  }
}

function updateGalleryActive(id) {
  document.querySelectorAll('.wallpaper-thumb').forEach(t => {
    t.classList.toggle('active', t.dataset.id === id);
  });
}
