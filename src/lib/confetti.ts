const COLORS = ["#ff6b35", "#4f46e5", "#22c55e", "#eda100", "#e87ba4"];
const PARTICLE_COUNT = 60;
const DURATION_MS = 1600;
const GRAVITY = 0.28;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
}

/**
 * Small dependency-free confetti burst (canvas + requestAnimationFrame) --
 * no external package needed for a purely cosmetic celebration effect.
 * originX/originY are viewport pixel coordinates to burst from (defaults to
 * top-center of the viewport).
 */
export function fireConfetti(originX?: number, originY?: number) {
  if (typeof window === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const startX = originX ?? window.innerWidth / 2;
  const startY = originY ?? window.innerHeight * 0.2;

  const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: startX,
    y: startY,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -10 - 4,
    size: Math.random() * 6 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.4,
  }));

  const start = performance.now();

  function frame(now: number) {
    if (!ctx) return;
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }

    if (elapsed < DURATION_MS) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(frame);
}
