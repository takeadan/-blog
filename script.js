const canvas = document.querySelector("#motion-canvas");
const ctx = canvas.getContext("2d", { alpha: true });
const cursor = document.querySelector(".cursor-orbit");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const motionTuning = {
  drift: 0.012,
  idlePull: 0.000018,
  activePull: 0.00009,
  pointerEase: 0.045,
  pulseSpeed: 0.00028,
  ringSpeed: 0.00032,
};

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
  const count = Math.round(Math.min(64, Math.max(30, width / 26)));
  nodes = Array.from({ length: count }, (_, index) => {
    const layer = index % 3;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (0.06 + layer * 0.03),
      vy: (Math.random() - 0.5) * (0.055 + layer * 0.025),
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
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "rgba(54, 120, 146, 0.18)";
  ctx.lineWidth = 1;

  for (let x = (scrollShift * 0.018) % spacing; x < width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + scrollShift * 0.006, height);
    ctx.stroke();
  }

  for (let y = (scrollShift * 0.014) % spacing; y < height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y + scrollShift * 0.005);
    ctx.stroke();
  }

  ctx.restore();
}

function drawNodes(delta, time, scrollShift) {
  for (const node of nodes) {
    const pull = pointer.active
      ? motionTuning.activePull + node.layer * 0.00008
      : motionTuning.idlePull;
    node.vx += (pointer.x - node.x) * pull * delta;
    node.vy += (pointer.y - node.y) * pull * delta;
    node.vx *= 0.994;
    node.vy *= 0.994;
    node.x += node.vx * delta * motionTuning.drift;
    node.y += node.vy * delta * motionTuning.drift;

    if (node.x < -60) node.x = width + 60;
    if (node.x > width + 60) node.x = -60;
    if (node.y < -60) node.y = height + 60;
    if (node.y > height + 60) node.y = -60;

    const pulse = Math.sin(time * motionTuning.pulseSpeed + node.phase) * 0.28 + 0.58;
    ctx.beginPath();
    ctx.fillStyle = `hsla(${node.hue}, 76%, 48%, ${0.11 + pulse * 0.14})`;
    ctx.arc(node.x, node.y + scrollShift * (0.002 + node.layer * 0.001), node.r + pulse * 0.6, 0, Math.PI * 2);
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
        ctx.strokeStyle = `rgba(46, 116, 151, ${0.075 * (1 - dist / limit)})`;
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
    const radius = 58 + i * 38 + Math.sin(time * motionTuning.ringSpeed + i) * 3;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(${i === 0 ? "12, 166, 126" : i === 1 ? "22, 142, 193" : "223, 106, 165"}, ${0.08 - i * 0.018})`;
    ctx.lineWidth = 1.2;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function render(time = 0) {
  const delta = Math.min(32, time - lastTime || 16);
  lastTime = time;
  pointer.x += (pointer.tx - pointer.x) * motionTuning.pointerEase;
  pointer.y += (pointer.ty - pointer.y) * motionTuning.pointerEase;

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
    const groupIndex = [...(element.parentElement?.children || [])].indexOf(element);
    const layeredDelay = element.matches(".post-card, .project-row, .signal-card")
      ? groupIndex * 120
      : Math.min(index * 42, 220);
    element.style.transitionDelay = `${layeredDelay}ms`;
    observer.observe(element);
    if (element.getBoundingClientRect().top < window.innerHeight * 0.96) {
      element.classList.add("is-visible");
    }
  });
}

function setupStackedCards() {
  const cards = [...document.querySelectorAll("[data-stack-card]")];
  const dots = [...document.querySelectorAll("[data-stack-target]")];
  const shell = document.querySelector(".post-stack-shell");
  if (!cards.length || !shell) return;

  let activeIndex = 0;
  let wheelLock = false;

  function setActive(index) {
    activeIndex = Math.max(0, Math.min(cards.length - 1, index));
    cards.forEach((card, cardIndex) => {
      card.classList.toggle("is-active", cardIndex === activeIndex);
      const offset = cardIndex - activeIndex;
      const state = offset === 0 ? "active" : offset === 1 ? "next" : offset > 1 ? "far" : "behind";
      card.dataset.stackState = state;
      card.style.setProperty("--stack-order", Math.abs(offset));
    });
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === activeIndex);
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      setActive(Number(dot.dataset.stackTarget || 0));
    });
  });

  shell.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) < 28 || wheelLock) return;
      const nextIndex = activeIndex + (event.deltaY > 0 ? 1 : -1);
      if (nextIndex < 0 || nextIndex >= cards.length) return;
      setActive(nextIndex);
      wheelLock = true;
      window.setTimeout(() => {
        wheelLock = false;
      }, 520);
    },
    { passive: true },
  );

  window.addEventListener(
    "scroll",
    () => {
      const rect = shell.getBoundingClientRect();
      const travel = window.innerHeight + rect.height;
      const progress = (window.innerHeight - rect.top) / travel;
      if (progress > 0.18 && progress < 0.88) {
        setActive(Math.min(cards.length - 1, Math.floor(progress * cards.length)));
      }
    },
    { passive: true },
  );

  setActive(0);
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
setupStackedCards();

if (!prefersReducedMotion) {
  setupMagnetics();
  setupCursor();
  rafId = requestAnimationFrame(render);
} else {
  ctx.clearRect(0, 0, width, height);
}

window.addEventListener("beforeunload", () => cancelAnimationFrame(rafId));
