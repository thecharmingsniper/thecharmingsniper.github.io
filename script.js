const canvas = document.getElementById('three-canvas');
const body = document.body;
const laserBeam = document.querySelector('.laser-beam');
const laserCore = document.querySelector('.laser-core');
const bpmValue = document.querySelector('.bpm');
const topBar = document.querySelector('.top-bar');
const statusStrip = document.querySelector('.status-strip');
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mobileMenuPanel = document.querySelector('.mobile-menu-panel');
const mobileMenuClose = document.querySelector('.mobile-menu-close');
const menuLabel = mobileMenuToggle ? mobileMenuToggle.querySelector('.menu-label') : null;
const interactiveSections = document.querySelectorAll('[data-interactive]');

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
let isMobileView = window.innerWidth < 768;

if (isTouchDevice) {
  body.classList.add('touch-device');
}

document.addEventListener('touchstart', () => body.classList.add('touch-device'), { once: true, passive: true });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileView ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x050508, 0);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1200);
camera.position.set(0, 0, 40);

let particleCount = isMobileView ? 1100 : 2200;
let geometry = null;
let positions = null;
let speeds = null;
let offsets = null;
let basePositions = null;
let particleMaterial = null;
let particles = null;

const params = {
  focus: 1,
  spread: 0.8,
  warp: 0.24,
  wave: 0,
  tower: 0,
};

function getParticleCount(width) {
  return width < 768 ? 1100 : 2200;
}

function getParticleSize(width) {
  return width < 768 ? 0.12 : 0.15;
}

function disposeParticles() {
  if (particles) {
    scene.remove(particles);
    particles.geometry.dispose();
  }
  if (particleMaterial) {
    particleMaterial.dispose();
  }
}

function buildParticles(width) {
  particleCount = getParticleCount(width);
  geometry = new THREE.BufferGeometry();
  positions = new Float32Array(particleCount * 3);
  speeds = new Float32Array(particleCount);
  offsets = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i += 1) {
    const radius = THREE.MathUtils.lerp(6, 28, Math.random());
    const angle = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    speeds[i] = 0.8 + Math.random() * 1.8;
    offsets[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));
  basePositions = new Float32Array(positions);

  particleMaterial = new THREE.PointsMaterial({
    color: 0xbd4cff,
    size: getParticleSize(width),
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  particles = new THREE.Points(geometry, particleMaterial);
  scene.add(particles);
}

function rebuildParticles(width) {
  disposeParticles();
  buildParticles(width);
}

buildParticles(window.innerWidth);

function setLaserPosition(clientX, clientY) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  laserCore.style.left = `${clientX}px`;
  laserCore.style.top = `${clientY}px`;
  laserBeam.style.left = `${centerX}px`;
  laserBeam.style.top = `${centerY}px`;
  laserBeam.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
  laserBeam.style.height = `${Math.min(distance * 1.05, 1100)}px`;
}

function updateHoverState(element) {
  const hovered = element && element.closest && element.closest('[data-interactive]');
  if (hovered) {
    body.classList.add('hover-active');
    params.warp = 0.54;
    particleMaterial.color = new THREE.Color(0x7cff53);
  } else {
    body.classList.remove('hover-active');
    params.warp = 0.24;
    particleMaterial.color = new THREE.Color(0xbd4cff);
  }
}

function updatePointerPosition(clientX, clientY, element) {
  setLaserPosition(clientX, clientY);
  updateHoverState(element || document.elementFromPoint(clientX, clientY));
}

function onMouseMove(event) {
  updatePointerPosition(event.clientX, event.clientY, event.target);
}

function onTouchMove(event) {
  const touch = event.touches[0] || event.changedTouches[0];
  if (!touch) {
    return;
  }
  updatePointerPosition(touch.clientX, touch.clientY, document.elementFromPoint(touch.clientX, touch.clientY));
}

function onTouchStart(event) {
  const touch = event.touches[0] || event.changedTouches[0];
  if (!touch) {
    return;
  }
  updatePointerPosition(touch.clientX, touch.clientY, document.elementFromPoint(touch.clientX, touch.clientY));
}

if (isTouchDevice) {
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: true });
} else {
  document.addEventListener('mousemove', onMouseMove);
}

function resizeScene() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  const nextMobileView = window.innerWidth < 768;
  if (nextMobileView !== isMobileView) {
    isMobileView = nextMobileView;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileView ? 1.5 : 2));
    rebuildParticles(window.innerWidth);
  }
}

function debounce(fn, wait = 150) {
  let timeout = null;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

const handleResize = debounce(() => {
  resizeScene();
  updateMobileHud();
}, 150);

window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', handleResize);

function updateMobileHud() {
  if (!statusStrip || !topBar) {
    return;
  }

  if (window.innerWidth < 768) {
    if (!statusStrip.classList.contains('mobile-status')) {
      statusStrip.classList.add('mobile-status');
      topBar.appendChild(statusStrip);
    }
  } else {
    if (statusStrip.classList.contains('mobile-status')) {
      statusStrip.classList.remove('mobile-status');
      const heroPanel = document.querySelector('.hero-panel');
      if (heroPanel) {
        heroPanel.appendChild(statusStrip);
      }
    }
  }
}

function openMobileMenu() {
  if (!mobileMenuPanel || !mobileMenuToggle) return;
  body.classList.add('mobile-menu-open');
  mobileMenuPanel.setAttribute('aria-hidden', 'false');
  mobileMenuToggle.setAttribute('aria-expanded', 'true');
  mobileMenuToggle.classList.add('open');
  if (menuLabel) {
    menuLabel.textContent = 'CLOSE';
  }
}

function closeMobileMenu() {
  if (!mobileMenuPanel || !mobileMenuToggle) return;
  body.classList.remove('mobile-menu-open');
  mobileMenuPanel.setAttribute('aria-hidden', 'true');
  mobileMenuToggle.setAttribute('aria-expanded', 'false');
  mobileMenuToggle.classList.remove('open');
  if (menuLabel) {
    menuLabel.textContent = 'MENU';
  }
}

if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener('click', openMobileMenu);
}

if (mobileMenuClose) {
  mobileMenuClose.addEventListener('click', closeMobileMenu);
}

const mobileMenuLinks = document.querySelectorAll('.mobile-menu-nav a');
mobileMenuLinks.forEach((link) => {
  link.addEventListener('click', closeMobileMenu);
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && body.classList.contains('mobile-menu-open')) {
    closeMobileMenu();
  }
});

updateMobileHud();

function animateParticles(time) {
  const positionsAttr = geometry.getAttribute('position');
  for (let i = 0; i < particleCount; i += 1) {
    const ix = i * 3;
    const baseX = basePositions[ix];
    const baseY = basePositions[ix + 1];
    const baseZ = basePositions[ix + 2];
    const speed = speeds[i];
    const offset = offsets[i];

    const radius = Math.sqrt(baseX * baseX + baseZ * baseZ);
    const twist = Math.sin(time * 0.0006 * speed + offset) * params.warp * 6;
    const spread = radius * (1 + params.spread * 0.65);

    positionsAttr.array[ix] = Math.cos(time * 0.0002 * speed + offset + twist) * spread * (1 - params.focus * 0.42);
    positionsAttr.array[ix + 1] = baseY * (1 + params.wave * 0.45) + Math.sin(time * 0.002 + offset) * 2.2;
    positionsAttr.array[ix + 2] = Math.sin(time * 0.0002 * speed + offset + twist) * spread * (1 - params.focus * 0.42);

    if (params.tower > 0.04) {
      positionsAttr.array[ix + 1] += Math.sin(radius * 0.35 + time * 0.001 + offset) * params.tower * 6;
      positionsAttr.array[ix] *= 1 - params.tower * 0.12;
      positionsAttr.array[ix + 2] *= 1 - params.tower * 0.12;
    }
  }
  positionsAttr.needsUpdate = true;
}

function render(time) {
  animateParticles(time);
  pulseLight.intensity = 0.75 + Math.sin(time * 0.0015) * 0.2;
  camera.position.x = Math.sin(time * 0.00015) * 2.6;
  camera.position.y = Math.cos(time * 0.00009) * 1.2;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

const pulseLight = new THREE.PointLight(0x66ff9c, 0.9, 200, 2);
pulseLight.position.set(0, 0, 12);
scene.add(pulseLight);

const ambientLight = new THREE.AmbientLight(0x11151b, 0.9);
scene.add(ambientLight);

requestAnimationFrame(render);

function splitTextContent(selector) {
  document.querySelectorAll(selector).forEach((element) => {
    const words = element.textContent.trim().split(' ');
    element.innerHTML = words.map((word) => {
      const letters = [...word].map((char) => `<span class="letter">${char}</span>`).join('');
      return `<span class="word">${letters}</span>`;
    }).join(' ');
  });
}

splitTextContent('.hero h1');
splitTextContent('.origin-panel h2');
splitTextContent('.console-top h2');

gsap.registerPlugin(ScrollTrigger);

const revealItems = document.querySelectorAll('.hero h1 .letter, .origin-panel h2 .letter, .console-top h2 .letter, .track-point, .value-card, .pillar-item, .archive-copy p');

revealItems.forEach((item) => {
  gsap.from(item, {
    opacity: 0,
    y: 24,
    duration: 1.1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: item,
      start: 'top 88%',
      toggleActions: 'play none none reverse',
    },
    stagger: {
      amount: 0.5,
    },
  });
});

const timeline = gsap.timeline({
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
});

timeline.to(params, {
  focus: 1,
  spread: 0.28,
  warp: 0.08,
  wave: 0,
  duration: 1,
  ease: 'none',
});

gsap.to(params, {
  scrollTrigger: {
    trigger: '#synapse',
    start: 'top 70%',
    end: 'bottom top',
    scrub: true,
  },
  focus: 0.56,
  spread: 1.12,
  warp: 0.34,
  wave: 0.65,
  tower: 0,
  ease: 'power1.out',
});

gsap.to(params, {
  scrollTrigger: {
    trigger: '#history',
    start: 'top 68%',
    end: 'bottom top',
    scrub: true,
  },
  focus: 0.34,
  spread: 1.4,
  warp: 0.14,
  wave: 0.32,
  tower: 0.26,
  ease: 'power1.out',
});

const bpmCounter = { value: 148 };
gsap.to(bpmCounter, {
  value: 132,
  duration: 1.2,
  ease: 'power1.out',
  scrollTrigger: {
    trigger: '#hero',
    start: 'top center',
    end: 'bottom top',
    scrub: true,
  },
  snap: { value: 1 },
  onUpdate() {
    bpmValue.textContent = `${Math.round(bpmCounter.value)}`;
  },
});

interactiveSections.forEach((section) => {
  section.addEventListener('mouseenter', () => {
    gsap.to(laserBeam, { background: 'linear-gradient(180deg, rgba(255,255,255,0.25), rgba(102,255,156,0.95))', duration: 0.35 });
    gsap.to(laserCore, { scale: 1.45, duration: 0.35 });
  });
  section.addEventListener('mouseleave', () => {
    gsap.to(laserBeam, { background: 'linear-gradient(180deg, rgba(102,255,156,0.25), rgba(102,255,156,0.85))', duration: 0.35 });
    gsap.to(laserCore, { scale: 1, duration: 0.35 });
  });
});

const navLinks = document.querySelectorAll('header a');
navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const opacity = Math.max(0.12, 1 - scrollY / 1800);
  document.body.style.background = `radial-gradient(circle at top, rgba(12, 15, 18, ${opacity}) 0%, #050508 38%)`;
});
