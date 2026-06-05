document.addEventListener('DOMContentLoaded', () => {
  // 1. CURSOR IMPLEMENTATION
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';
  });

  function animRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
  }
  animRing();

  document.querySelectorAll('a, button, .merch-card, .value-card, input, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.width = '20px';
      cursor.style.height = '20px';
      cursor.style.background = 'var(--purple)';
      ring.classList.add('active');
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.width = '12px';
      cursor.style.height = '12px';
      cursor.style.background = 'var(--gold)';
      ring.classList.remove('active');
    });
  });

  // 2. NAV SCROLL
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });

  // 3. SCROLL REVEAL (IntersectionObserver)
  const reveals = document.querySelectorAll('.reveal');
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach(el => revealObs.observe(el));

  // 4. MERCH FILTER
  function filterMerch(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.merch-card').forEach(card => {
      const cats = card.getAttribute('data-cat') || '';
      const show = cat === 'all' || cats.includes(cat);
      card.style.display = show ? '' : 'none';
    });
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }
  }

  // Bind merch filter buttons dynamically
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-filter');
      filterMerch(cat, btn);
    });
  });

  // Export to window for backwards compatibility if needed
  window.filterMerch = filterMerch;



  // 6. PARALLAX HERO CONTENT (CSS fallback + standard enhancement)
  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) heroContent.style.transform = `translateY(${sy * 0.22}px)`;
    const gridOverlay = document.querySelector('.hero-grid-overlay');
    if (gridOverlay) gridOverlay.style.transform = `translateY(${sy * 0.08}px)`;
  });

  // 7. 3D CARD HOVER TILT EFFECT
  document.querySelectorAll('.value-card, .merch-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const xc = rect.width / 2;
      const yc = rect.height / 2;
      
      // Calculate tilt angles (max 8 degrees for premium control)
      const angleX = ((yc - y) / yc) * 8;
      const angleY = -((xc - x) / xc) * 8;
      
      card.style.transform = `perspective(1000px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.02, 1.02, 1.02)`;
      
      // Floating sub-element depths (Parallax)
      const title = card.querySelector('.value-name, .merch-name');
      const desc = card.querySelector('.value-desc, .merch-category');
      const num = card.querySelector('.value-num, .merch-badge');
      const icon = card.querySelector('.value-icon, .merch-quick');
      const img = card.querySelector('.merch-img-inner');
      
      if (title) title.style.transform = 'translateZ(25px)';
      if (desc) desc.style.transform = 'translateZ(12px)';
      if (num) num.style.transform = 'translateZ(18px)';
      if (icon) icon.style.transform = 'translateZ(30px)';
      if (img) img.style.transform = 'translateZ(18px) scale(1.04)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      
      const subElements = card.querySelectorAll('.value-name, .merch-name, .value-desc, .merch-category, .value-num, .merch-badge, .value-icon, .merch-quick, .merch-img-inner');
      subElements.forEach(el => el.style.transform = 'translateZ(0px)');
    });
  });

  // 8. WEBGL REDESIGN ENGINE
  function hasWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (hasWebGL() && typeof THREE !== 'undefined' && typeof gsap !== 'undefined') {
    document.body.classList.add('webgl-active');
    const webglCanvas = document.getElementById('webgl-canvas');
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;
    
    const renderer = new THREE.WebGLRenderer({
      canvas: webglCanvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Scope centerpiece group
    const scopeGroup = new THREE.Group();
    scene.add(scopeGroup);

    // Helpers to create razor-sharp wireframe elements
    function createCircleLine(radius, color, dashed = false) {
      const points = [];
      const segments = 90;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      let material;
      if (dashed) {
        material = new THREE.LineDashedMaterial({
          color: color,
          dashSize: 0.18,
          gapSize: 0.08,
          transparent: true,
          opacity: 0.5
        });
      } else {
        material = new THREE.LineBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.7
        });
      }
      const line = new THREE.Line(geometry, material);
      if (dashed) line.computeLineDistances();
      return line;
    }

    const ring1 = createCircleLine(3.2, 0x534AB7);       // Outer purple ring
    const ring2 = createCircleLine(2.4, 0x534AB7, true); // Middle dashed purple ring
    const ring3 = createCircleLine(1.6, 0xC9A84C);       // Outer gold ring
    const ring4 = createCircleLine(0.8, 0xC9A84C);       // Inner gold ring
    scopeGroup.add(ring1);
    scopeGroup.add(ring2);
    scopeGroup.add(ring3);
    scopeGroup.add(ring4);

    // Reticle lines (crosshair layout)
    const crosshairGroup = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({ color: 0x534AB7, transparent: true, opacity: 0.6 });
    const length = 4.2;
    const gap = 0.5;
    
    crosshairGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-length, 0, 0), new THREE.Vector3(-gap, 0, 0)]), lineMat));
    crosshairGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(gap, 0, 0), new THREE.Vector3(length, 0, 0)]), lineMat));
    crosshairGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -length, 0), new THREE.Vector3(0, -gap, 0)]), lineMat));
    crosshairGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, gap, 0), new THREE.Vector3(0, length, 0)]), lineMat));
    scopeGroup.add(crosshairGroup);

    // Dynamic scope ticks
    const ticksGroup = new THREE.Group();
    const tickLen = 0.12;
    const tickRad = 3.2;
    for (let a = 0; a < 360; a += 15) {
      if (a % 90 === 0) continue;
      const rad = (a * Math.PI) / 180;
      const tickGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(rad) * tickRad, Math.sin(rad) * tickRad, 0),
        new THREE.Vector3(Math.cos(rad) * (tickRad - tickLen), Math.sin(rad) * (tickRad - tickLen), 0)
      ]);
      const tickMat = new THREE.LineBasicMaterial({ color: 0x534AB7, transparent: true, opacity: 0.35 });
      ticksGroup.add(new THREE.Line(tickGeo, tickMat));
    }
    scopeGroup.add(ticksGroup);

    // Inner wireframe spinning core
    const coreGeo = new THREE.OctahedronGeometry(0.22, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.8 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scopeGroup.add(core);

    const coreOuterGeo = new THREE.OctahedronGeometry(0.38, 0);
    const coreOuterMat = new THREE.MeshBasicMaterial({ color: 0xC9A84C, wireframe: true, transparent: true, opacity: 0.4 });
    const coreOuter = new THREE.Mesh(coreOuterGeo, coreOuterMat);
    scopeGroup.add(coreOuter);

    // Target tracking laser line
    const laserGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 10)]);
    const laserMat = new THREE.LineBasicMaterial({ color: 0xC9A84C, transparent: true, opacity: 0.85 });
    const laser = new THREE.Line(laserGeo, laserMat);
    scopeGroup.add(laser);

    // Perspective background wireframe grid
    const gridHelper = new THREE.GridHelper(55, 44, 0x534AB7, 0x1e1e3a);
    gridHelper.position.set(0, 0, -4);
    gridHelper.rotation.x = Math.PI / 2.2;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.12;
    scene.add(gridHelper);

    // 3D Particles Energy Field
    const particleCount = 1500;
    const particleGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(particleCount * 3);
    const colArr = new Float32Array(particleCount * 3);

    const colorsList = [
      new THREE.Color(0x534AB7), // purple
      new THREE.Color(0xC9A84C), // gold
      new THREE.Color(0xffffff)  // white
    ];

    const originalPositions = new Float32Array(particleCount * 3);
    const starfieldPositions = new Float32Array(particleCount * 3);
    const vortexPositions = new Float32Array(particleCount * 3);
    const singularityPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const ix = i * 3;

      // Configuration 1: Spherical (around scope)
      const r = Math.random() * 5.8 + 0.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      originalPositions[ix] = r * Math.sin(phi) * Math.cos(theta);
      originalPositions[ix+1] = r * Math.sin(phi) * Math.sin(theta);
      originalPositions[ix+2] = r * Math.cos(phi) * 0.4; // slightly squashed depth

      // Configuration 2: Cosmic Starfield (dispersed across screen)
      starfieldPositions[ix] = (Math.random() - 0.5) * 24;
      starfieldPositions[ix+1] = (Math.random() - 0.5) * 14;
      starfieldPositions[ix+2] = -3 - Math.random() * 7;

      // Configuration 3: DNA Double Helix / Vortex cylinder
      const vTheta = (i / particleCount) * Math.PI * 36;
      const vRadius = 1.8 + Math.random() * 0.7;
      const vHeight = (i / particleCount) * 10 - 5;
      vortexPositions[ix] = Math.cos(vTheta) * vRadius;
      vortexPositions[ix+1] = vHeight;
      vortexPositions[ix+2] = Math.sin(vTheta) * vRadius;

      // Configuration 4: Singularity Core (highly concentrated point)
      const sR = Math.random() * 0.25;
      const sTheta = Math.random() * Math.PI * 2;
      const sPhi = Math.acos(Math.random() * 2 - 1);
      singularityPositions[ix] = sR * Math.sin(sPhi) * Math.cos(sTheta);
      singularityPositions[ix+1] = sR * Math.sin(sPhi) * Math.sin(sTheta);
      singularityPositions[ix+2] = sR * Math.cos(sPhi);

      // Start configuration
      posArr[ix] = originalPositions[ix];
      posArr[ix+1] = originalPositions[ix+1];
      posArr[ix+2] = originalPositions[ix+2];

      // Assign dynamic color index
      const col = colorsList[Math.floor(Math.random() * colorsList.length)];
      colArr[ix] = col.r;
      colArr[ix+1] = col.g;
      colArr[ix+2] = col.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

    // Particle texture construction (soft round glows)
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 16; pCanvas.height = 16;
    const pCtx = pCanvas.getContext('2d');
    const pGrad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    pGrad.addColorStop(0, 'rgba(255,255,255,1)');
    pGrad.addColorStop(1, 'rgba(255,255,255,0)');
    pCtx.fillStyle = pGrad; pCtx.beginPath(); pCtx.arc(8, 8, 8, 0, Math.PI*2); pCtx.fill();
    const pTexture = new THREE.CanvasTexture(pCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      map: pTexture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scopeGroup.add(particleSystem);

    // State bindings for GSAP ScrollTriggers
    const webglState = {
      morphStarfield: 0,
      morphVortex: 0,
      morphSingularity: 0,
      ringsOpacity: 1,
      scopeScale: 1.0,
      scopeX: 2.8,
      scopeY: 0,
      scopeZ: 0,
      gridOpacity: 0.12,
      pulse: 0
    };

    // Responsive ScrollTrigger morph animations
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add({
      isDesktop: "(min-width: 769px)",
      isMobile: "(max-width: 768px)"
    }, (context) => {
      const { isDesktop } = context.conditions;

      // Define coordinates relative to device type
      const startX = isDesktop ? 2.8 : 0;
      const startY = isDesktop ? 0 : 1.6;
      const startScale = isDesktop ? 1.0 : 0.65;

      const originX = isDesktop ? -2.8 : 0;
      const originY = isDesktop ? 0 : 1.1;
      const originScale = isDesktop ? 0.95 : 0.55;

      // Reset base layout on screen swap
      webglState.scopeX = startX;
      webglState.scopeY = startY;
      webglState.scopeScale = startScale;
      webglState.ringsOpacity = 1;
      webglState.morphStarfield = 0;
      webglState.morphVortex = 0;
      webglState.morphSingularity = 0;
      webglState.gridOpacity = 0.12;

      // Scroll Phase 1: Hero to Origin
      gsap.timeline({
        scrollTrigger: {
          trigger: "#origin",
          start: "top bottom",
          end: "top center",
          scrub: 0.5,
          invalidateOnRefresh: true
        }
      })
      .to(webglState, {
        scopeX: originX,
        scopeY: originY,
        scopeScale: originScale,
        ease: "none"
      });

      // Scroll Phase 2: Origin to Values
      gsap.timeline({
        scrollTrigger: {
          trigger: "#values",
          start: "top bottom",
          end: "top center",
          scrub: 0.5,
          invalidateOnRefresh: true
        }
      })
      .to(webglState, {
        scopeX: 0,
        scopeY: 0,
        scopeScale: 1.4,
        ringsOpacity: 0,
        morphStarfield: 1,
        gridOpacity: 0.05,
        ease: "none"
      });

      // Scroll Phase 3: Values to Merch
      gsap.timeline({
        scrollTrigger: {
          trigger: "#merch",
          start: "top bottom",
          end: "top center",
          scrub: 0.5,
          invalidateOnRefresh: true
        }
      })
      .to(webglState, {
        morphStarfield: 0,
        morphVortex: 1,
        scopeScale: 1.1,
        gridOpacity: 0.1,
        ease: "none"
      });

      // Scroll Phase 4: Merch to Newsletter
      gsap.timeline({
        scrollTrigger: {
          trigger: "#newsletter",
          start: "top bottom",
          end: "bottom bottom",
          scrub: 0.5,
          invalidateOnRefresh: true
        }
      })
      .to(webglState, {
        morphVortex: 0,
        morphSingularity: 1,
        scopeY: isDesktop ? -2.5 : -1.8,
        scopeScale: 0.7,
        gridOpacity: 0.0,
        ease: "none"
      });
    });

    // 3D Screen Projection Mouse Tracking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const targetPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const targetPoint = new THREE.Vector3();
    
    let targetX = 0, targetY = 0;
    window.addEventListener('mousemove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      targetX = mouse.x * 0.22;
      targetY = mouse.y * 0.22;
    });

    // Click Reticle Firing Shockwave
    let pulseActive = false;
    window.addEventListener('click', (e) => {
      if (e.target.closest('a, button, .merch-card, .value-card, input, textarea')) return;
      if (pulseActive) return;
      pulseActive = true;
      
      gsap.fromTo(webglState, 
        { pulse: 0 }, 
        { 
          pulse: 1, 
          duration: 0.8, 
          ease: "power2.out", 
          onComplete: () => { 
            webglState.pulse = 0;
            pulseActive = false;
          } 
        }
      );
    });

    // Animation variables
    let clock = new THREE.Clock();

    // Render loop
    function animate() {
      requestAnimationFrame(animate);

      const time = clock.getElapsedTime();

      // Slow rotational physics for outer rings
      ring1.rotation.z = time * 0.04;
      ring2.rotation.z = -time * 0.07;
      ring3.rotation.z = time * 0.03;
      ring4.rotation.z = -time * 0.09;
      
      // Fast rotation for core components
      core.rotation.x = time * 1.5;
      core.rotation.y = time * 1.8;
      coreOuter.rotation.x = -time * 0.6;
      coreOuter.rotation.y = -time * 0.8;

      // Ambient background grid rotate
      gridHelper.rotation.z = time * 0.004;

      // Mouse Parallax on Group and Camera
      scopeGroup.rotation.x += (targetY - scopeGroup.rotation.x) * 0.08;
      scopeGroup.rotation.y += (targetX - scopeGroup.rotation.y) * 0.08;
      
      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.05;
      camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.05;
      camera.lookAt(scopeGroup.position);

      // Perform Raycast Intersection
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(targetPlane, targetPoint);

      // Laser sights tracking
      const laserPos = laser.geometry.attributes.position.array;
      const localTarget = targetPoint.clone().sub(scopeGroup.position);
      laserPos[3] = localTarget.x;
      laserPos[4] = localTarget.y;
      laserPos[5] = localTarget.z;
      laser.geometry.attributes.position.needsUpdate = true;

      // Vortex System rotation
      if (webglState.morphVortex > 0) {
        particleSystem.rotation.y = time * 0.15;
      } else {
        particleSystem.rotation.y = 0;
      }

      // Live morphing of 1500 particles
      const currentPos = particleSystem.geometry.attributes.position.array;
      const p = webglState.pulse;

      for (let i = 0; i < particleCount; i++) {
        const ix = i * 3;

        // Base is spherical
        let tx = originalPositions[ix];
        let ty = originalPositions[ix+1];
        let tz = originalPositions[ix+2];

        // Apply dynamic wave drift
        tx += Math.sin(time * 0.8 + i) * 0.03;
        ty += Math.cos(time * 0.6 + i) * 0.03;
        tz += Math.sin(time * 1.0 + i) * 0.03;

        // Lerp Starfield
        tx = THREE.MathUtils.lerp(tx, starfieldPositions[ix], webglState.morphStarfield);
        ty = THREE.MathUtils.lerp(ty, starfieldPositions[ix+1], webglState.morphStarfield);
        tz = THREE.MathUtils.lerp(tz, starfieldPositions[ix+2], webglState.morphStarfield);

        // Lerp Vortex
        tx = THREE.MathUtils.lerp(tx, vortexPositions[ix], webglState.morphVortex);
        ty = THREE.MathUtils.lerp(ty, vortexPositions[ix+1], webglState.morphVortex);
        tz = THREE.MathUtils.lerp(tz, vortexPositions[ix+2], webglState.morphVortex);

        // Lerp Singularity
        tx = THREE.MathUtils.lerp(tx, singularityPositions[ix], webglState.morphSingularity);
        ty = THREE.MathUtils.lerp(ty, singularityPositions[ix+1], webglState.morphSingularity);
        tz = THREE.MathUtils.lerp(tz, singularityPositions[ix+2], webglState.morphSingularity);

        // Radial Shockwave Calculation
        if (p > 0) {
          const dist = Math.sqrt(tx*tx + ty*ty + tz*tz) || 0.001;
          const force = Math.sin(p * Math.PI) * (4.0 / (dist + 0.6));
          tx += (tx / dist) * force;
          ty += (ty / dist) * force;
          tz += (tz / dist) * force;
        }

        currentPos[ix] = tx;
        currentPos[ix+1] = ty;
        currentPos[ix+2] = tz;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      // Update structural opacities
      ring1.material.opacity = webglState.ringsOpacity * 0.6;
      ring2.material.opacity = webglState.ringsOpacity * 0.45;
      ring3.material.opacity = webglState.ringsOpacity * 0.75;
      ring4.material.opacity = webglState.ringsOpacity * 0.85;
      core.material.opacity = webglState.ringsOpacity * 0.8;
      coreOuter.material.opacity = webglState.ringsOpacity * 0.4;
      laser.material.opacity = webglState.ringsOpacity * 0.8;
      crosshairGroup.children.forEach(c => c.material.opacity = webglState.ringsOpacity * 0.6);
      ticksGroup.children.forEach(t => t.material.opacity = webglState.ringsOpacity * 0.35);

      gridHelper.material.opacity = webglState.gridOpacity;

      // Synchronize group transform state variables
      scopeGroup.position.set(webglState.scopeX, webglState.scopeY, webglState.scopeZ);
      scopeGroup.scale.setScalar(webglState.scopeScale);

      renderer.render(scene, camera);
    }

    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // Fade WebGL engine in
    setTimeout(() => {
      webglCanvas.style.opacity = '1';
    }, 150);

  } else {
    // 8. FALLBACK (Legacy 2D canvas particles)
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let W, H, particles = [];
      
      function resize() {
        W = canvas.width = canvas.offsetWidth;
        H = canvas.height = canvas.offsetHeight;
      }
      resize();
      window.addEventListener('resize', resize);

      class Particle {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * W;
          this.y = Math.random() * H;
          this.vx = (Math.random() - 0.5) * 0.3;
          this.vy = (Math.random() - 0.5) * 0.3;
          this.r = Math.random() * 1.2 + 0.3;
          this.a = Math.random() * 0.5 + 0.1;
          this.c = Math.random() > 0.6 ? '#534AB7' : Math.random() > 0.5 ? '#C9A84C' : '#ffffff';
        }
        update() {
          this.x += this.vx; this.y += this.vy;
          if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          ctx.fillStyle = this.c;
          ctx.globalAlpha = this.a;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      for (let i = 0; i < 100; i++) particles.push(new Particle());

      function connectParticles() {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 90) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = '#534AB7';
              ctx.globalAlpha = (1 - dist / 90) * 0.12;
              ctx.lineWidth = 0.5;
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
        }
      }

      function animParticles() {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => { p.update(); p.draw(); });
        connectParticles();
        requestAnimationFrame(animParticles);
      }
      animParticles();
    }
  }

  // 9. LENIS SMOOTH SCROLL INTEGRATION
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      smoothTouch: false,
      infinite: false,
    });

    lenis.on('scroll', () => {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.update();
      }
    });

    if (typeof gsap !== 'undefined') {
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }
});
