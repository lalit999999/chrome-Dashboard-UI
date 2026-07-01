/**
 * Subtle floating particle system using Canvas.
 * Targets < 1ms per frame; pauses when tab is hidden.
 */

let canvas, ctx, particles = [], raf;
const MAX = 55;
const SPEED = 0.3;

export function initParticles() {
  canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  resize();
  spawn();
  loop();

  window.addEventListener('resize', debounce(resize, 200));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else loop();
  });
}

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function spawn() {
  particles = [];
  for (let i = 0; i < MAX; i++) {
    particles.push(createParticle(true));
  }
}

function createParticle(random = false) {
  return {
    x:    random ? Math.random() * canvas.width  : Math.random() < 0.5 ? 0 : canvas.width,
    y:    random ? Math.random() * canvas.height : Math.random() * canvas.height,
    vx:   (Math.random() - 0.5) * SPEED,
    vy:   (Math.random() - 0.5) * SPEED,
    r:    Math.random() * 1.5 + 0.5,
    alpha:Math.random() * 0.3 + 0.05,
  };
}

function loop() {
  raf = requestAnimationFrame(loop);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((p, i) => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < -10 || p.x > canvas.width + 10 || p.y < -10 || p.y > canvas.height + 10) {
      particles[i] = createParticle(false);
      return;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
    ctx.fill();
  });
}

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
