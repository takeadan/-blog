const canvas = document.querySelector("#motion-canvas");
const ctx = canvas.getContext("2d", { alpha: true });
const cursor = document.querySelector(".cursor-orbit");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const pointer = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  tx: window.innerWidth / 2,
  ty: window.innerHeight / 2,
  active: false,
};

let width = 0;
let height = 0;
let dpr = 1;
let nodes = [];
let rafId = 0;
let lastTime = 0;

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  seedNodes();
}

function seedNodes() {
  const count = Math.round(Math.min(92, Math.max(42, width / 18)));
  nodes = Array.from({ length: count }, (_, index) => {
    const layer = index % 3;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (0.22 + layer * 0.12),
      vy: (Math.random() - 0.5) * (0.2 + layer * 0.1),
      r: 1.2 + Math.random() * (2.2 + layer),
      layer,
      hue: [160, 194, 328][layer],
      phase: Math.random() * Math.PI * 2,
    };
  });
}

function drawGrid(scrollShift) {
  const spacing = 54;
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = "rgba(170, 224, 255, 0.22)";
  ctx.lineWidth = 1;

  for (let x = (scrollShift * 0.14) % spacing; x < width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + scrollShift * 0.04, height);
    ctx.stroke();
  }

  for (let y = (scrollShift * 0.1) % spacing; y < height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + scrollShift * 0.03);
    ctx.stroke();
  }

  ctx.restore();
}

function drawNodes(delta, time, scrollShift) {
  for (const node of nodes) {
    const pull = pointer.active ? 0.0007 + node.layer * 0.00025 : 0.00018;
    node.vx += (pointer.x - node.x) * pull * delta;
    node.vy += (pointer.y - node.y) * pull * delta;
    node.vx *= 0.988;
    node.vy *= 0.988;
    node.x += node.vx * delta * 0.06;
    node.y += node.vy * delta * 0.06;

    if (node.x < -60) node.x = width + 60;
    if (node.x > width + 60) node.x = -60;
    if (node.y < -60) node.y = height + 60;
    if (node.y > height + 60) node.y = -60;

    const pulse = Math.sin(time * 0.0018 + node.phase) * 0.42 + 0.58;
    ctx.beginPath();
    ctx.fillStyle = `hsla(${node.hue}, 92%, 68%, ${0.22 + pulse * 0.26})`;
    ctx.arc(node.x, node.y + scrollShift * (0.012 + node.layer * 0.006), node.r + pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      const limit = 126 - Math.abs(a.layer - b.layer) * 20;

      if (dist < limit) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(138, 224, 255, ${0.13 * (1 - dist / limit)})`;
        ctx.lineWidth = 1;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
}

function drawEnergyRings(time) {
  const x = pointer.x;
  const y = pointer.y;
  for (let i = 0; i < 3; i += 1) {
    const radius = 58 + i * 38 + Math.sin(time * 0.002 + i) * 9;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${i === 0 ? "102, 227, 180" : i === 1 ? "108, 215, 255" : "255, 111, 174"}, ${0.16 - i * 0.035})`;
    ctx.lineWidth = 1.2;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function render(time = 0) {
  const delta = Math.min(32, time - lastTime || 16);
  lastTime = time;
  pointer.x += (pointer.tx - pointer.x) * 0.12;
  pointer.y += (pointer.ty - pointer.y) * 0.12;

  ctx.clearRect(0, 0, width, height);
  const scrollShift = window.scrollY || 0;
  drawGrid(scrollShift);
  drawNodes(delta, time, scrollShift);
  drawEnergyRings(time);

  rafId = requestAnimationFrame(render);
}

function setupReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
  );

  document.querySelectorAll("[data-reveal]").forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 55, 280)}ms`;
    observer.observe(element);
  });
}

function setupMagnetics() {
  const items = document.querySelectorAll(".magnetic");
  for (const item of items) {
    item.addEventListener("mousemove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      item.style.transform = `translate3d(${x * 0.035}px, ${y * 0.035}px, 0)`;
    });
    item.addEventListener("mouseleave", () => {
      item.style.transform = "";
    });
  }
}

function setupCursor() {
  window.addEventListener("pointermove", (event) => {
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
    pointer.active = true;
    cursor.style.opacity = "1";
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
  });

  window.addEventListener("pointerleave", () => {
    pointer.active = false;
    cursor.style.opacity = "0";
  });
}

window.addEventListener("resize", resizeCanvas, { passive: true });
resizeCanvas();
setupReveal();

if (!prefersReducedMotion) {
  setupMagnetics();
  setupCursor();
  rafId = requestAnimationFrame(render);
} else {
  ctx.clearRect(0, 0, width, height);
}

window.addEventListener("beforeunload", () => cancelAnimationFrame(rafId));
