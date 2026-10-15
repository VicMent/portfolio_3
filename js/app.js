// Section-scrubbed frame animation. Preloads frames, advances per section.

const FRAME_DIR = 'animation/';
const FRAME_COUNT = 170; // 0001-0170

class FrameAnimation {
  constructor(canvas, totalSections = 7) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.frames = [];
    this.currentFrame = 0;
    this.targetFrame = 0;
    this.currentSection = 0;
    this.totalFrames = FRAME_COUNT;
    this.totalSections = totalSections;
    this.framesPerSection = Math.ceil(FRAME_COUNT / (totalSections - 1)); // 28 frames per transition (170/6)
    this.isReady = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.loadedCount = 0;
    this.externallyDriven = false; // Prevent tick() from fighting manual frame control

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  async start() {
    const barFill = document.getElementById('loader-bar-fill');
    const percentText = document.getElementById('loader-percent');
    const statusText = document.getElementById('loader-status');
    const loader = document.getElementById('loader');

    const statuses = [
      'INITIALIZING',
      'LOADING FRAMES',
      'DECODING IMAGES',
      'PREPARING CANVAS',
      'ALMOST READY',
    ];

    const frameUrls = [];
    for (let i = 1; i <= 170; i++) {
      const num = String(i).padStart(4, '0');
      frameUrls.push(`${FRAME_DIR}${num}.png`);
    }

    await Promise.all(frameUrls.map((url, index) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.frames[index] = img;
          this.loadedCount++;
          const pct = Math.round((this.loadedCount / this.totalFrames) * 100);
          if (barFill) barFill.style.width = `${pct}%`;
          if (percentText) percentText.textContent = `${pct}%`;
          const idx = Math.min(statuses.length - 1, Math.floor(pct / (100 / statuses.length)));
          if (statusText) statusText.textContent = statuses[idx];
          resolve();
        };
        img.onerror = () => {
          this.loadedCount++;
          resolve();
        };
        img.src = url;
      });
    }));

    this.isReady = true;
    this.currentFrame = 0;
    this.targetFrame = 0;
    this._render();

    if (barFill) barFill.style.width = '100%';
    if (percentText) percentText.textContent = '100%';
    if (statusText) statusText.textContent = 'READY';

    await new Promise(r => setTimeout(r, 300));
    if (loader) loader.classList.add('hidden');
  }

  _drawCover(img) {
    if (!img) return;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const vw = img.naturalWidth || img.width || 1536;
    const vh = img.naturalHeight || img.height || 864;
    const scale = Math.max(cw / vw, ch / vh);
    const w = vw * scale;
    const h = vh * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    this.ctx.drawImage(img, x, y, w, h);
  }

  _render() {
    this.ctx.fillStyle = '#0d0d0d';
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    const frameIndex = Math.floor(this.currentFrame);
    const frame = this.frames[frameIndex];
    if (frame) {
      this._drawCover(frame);
    }
  }

  goToSection(sectionIndex) {
    if (!this.isReady) return;
    this.currentSection = Math.max(0, Math.min(sectionIndex, this.totalSections - 1));
    this.targetFrame = Math.min(this.totalFrames - 1, this.currentSection * this.framesPerSection);
  }

  nextSection() {
    if (this.currentSection < this.totalSections - 1) {
      this.goToSection(this.currentSection + 1);
    }
  }

  prevSection() {
    if (this.currentSection > 0) {
      this.goToSection(this.currentSection - 1);
    }
  }

  tick() {
    if (!this.isReady || this.externallyDriven) return;

    const diff = this.targetFrame - this.currentFrame;
    const absDiff = Math.abs(diff);
    
    if (absDiff > 0.5) {
      // Fast interpolation for smooth frame-by-frame playback during transitions
      const lerpFactor = 0.35;
      this.currentFrame += diff * lerpFactor;
      
      // Ensure we advance at least 1 frame per tick when far from target
      if (absDiff > 2) {
        const minStep = Math.sign(diff) * 1;
        if (Math.abs(this.currentFrame - (this.currentFrame - diff * lerpFactor)) < 1) {
          this.currentFrame += minStep;
        }
      }
    } else {
      this.currentFrame = this.targetFrame;
    }

    const frameIndex = Math.max(0, Math.min(this.totalFrames - 1, Math.floor(this.currentFrame)));
    this._render();
  }
}

// Plays only the most-visible video inside each carousel row, so we never
// decode several clips at once while the rows are scrolling.
class AutoplayClips {
  constructor() {
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.rows = new Map();
    this.ratios = new WeakMap();
    this.hoveredClip = null; // tile currently under the pointer, plays on hover

    document.querySelectorAll('[data-autoplay]').forEach((video) => {
      const row = video.closest('.marquee');
      if (!row) return;
      if (!this.rows.has(row)) this.rows.set(row, new Set());
      this.rows.get(row).add(video);
      this.ratios.set(video, 0);

      // Hover wins: the hovered tile's video plays and the rest of the
      // row pauses, so only one clip ever plays at a time. On hover end
      // we clear the priority and let visibility-based autoplay resume.
      video.addEventListener('mouseenter', () => {
        this.hoveredClip = video;
        this._syncRow(row);
      });
      video.addEventListener('mouseleave', () => {
        if (this.hoveredClip === video) {
          this.hoveredClip = null;
          this._syncRow(row);
        }
      });
    });

    this.observer = new IntersectionObserver(
      (entries) => {
        const touchedRows = new Set();

        entries.forEach((entry) => {
          this.ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
          const row = entry.target.closest('.marquee');
          if (row) touchedRows.add(row);
        });

        touchedRows.forEach((row) => this._syncRow(row));
      },
      { threshold: [0, 0.25, 0.5, 0.75] }
    );

    this.rows.forEach((clips) => clips.forEach((clip) => this.observer.observe(clip)));
  }

  _syncRow(row) {
    const clips = this.rows.get(row);
    if (!clips) return;

    // The hovered tile takes priority; otherwise the most-visible clip plays.
    let best = null;
    let bestRatio = 0.4; // only autoplay when clearly in view

    if (this.hoveredClip && clips.has(this.hoveredClip)) {
      best = this.hoveredClip;
    } else {
      clips.forEach((clip) => {
        const ratio = this.ratios.get(clip) || 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = clip;
        }
      });
    }

    clips.forEach((clip) => {
      const isHovered = clip === this.hoveredClip;
      const wantPlay = isHovered || (!this.reduced && clip === best);
      if (wantPlay) {
        if (clip.paused) clip.play().catch(() => {});
      } else if (!clip.paused) {
        clip.pause();
      }
    });
  }
}

// ---------------------------------------------------------------
// Double-layered full-bleed infinite carousels.
// Slides are generated from the lists below, so dropping in real
// assets later is just a matter of adding another entry.
//   kind: 'img' | 'video'
// ---------------------------------------------------------------
const CAROUSEL_DATA = [
  {
    key: 'work',
    container: '.marquee-work',
    items: [
      { kind: 'img', src: 'extra_images/ethicallabs_project.png', alt: 'Totally Ethical Labs gameplay' },
      { kind: 'video', src: 'extra_images/TEL-bug.mp4', poster: 'extra_images/TEL-bug-poster.jpg', alt: 'Totally Ethical Labs bug fix' },
      { kind: 'img', src: 'extra_images/TEL%20-%20logo.png', alt: 'Totally Ethical Labs logo' },
      { kind: 'img', src: 'extra_images/tel-image.png', alt: 'Totally Ethical Labs screenshot' },
      { kind: 'img', src: 'extra_images/tel-image%202.png', alt: 'Totally Ethical Labs environment' },
      { kind: 'video', src: 'extra_images/TEL%20chair%20throwing/TEL%20chair%20throwing-1.mp4', poster: 'extra_images/TEL%20chair%20throwing/TEL%20chair%20throwing-1-poster.jpg', alt: 'Totally Ethical Labs magnet ability' },
      { kind: 'video', src: 'extra_images/TEL%20intro%20scene/TEL%20intro%20scene-1.mp4', poster: 'extra_images/TEL%20intro%20scene/TEL%20intro%20scene-1-poster.jpg', alt: 'Totally Ethical Labs intro scene' },
      { kind: 'video', src: 'extra_images/TEL%20main%20menu.mp4', poster: 'extra_images/TEL%20main%20menu-poster.jpg', alt: 'Totally Ethical Labs main menu' },
      { kind: 'video', src: 'extra_images/TEL%20AK%20shooting%20gameplay/TEL%20AK%20shooting%20gameplay-1.mp4', poster: 'extra_images/TEL%20AK%20shooting%20gameplay/TEL%20AK%20shooting%20gameplay-1-poster.jpg', alt: 'Totally Ethical Labs AK shooting' },
      { kind: 'video', src: 'extra_images/TEL%20research/TEL%20research-1.mp4', poster: 'extra_images/TEL%20research/TEL%20research-1-poster.jpg', alt: 'Totally Ethical Labs research' },
      { kind: 'video', src: 'extra_images/TEL%20table%20smash/TEL%20table%20smash-1.mp4', poster: 'extra_images/TEL%20table%20smash/TEL%20table%20smash-1-poster.jpg', alt: 'Totally Ethical Labs table smash' },
    ],
  },
  {
    key: 'unreal',
    container: '.marquee-unreal',
    items: [
      { kind: 'video', src: 'extra_images/RoidRager3.mp4', poster: 'extra_images/RoidRager3-poster.jpg', alt: 'Roid Rager gameplay clip' },
      { kind: 'video', src: 'extra_images/RoidRager4.mp4', poster: 'extra_images/RoidRager4-poster.jpg', alt: 'Roid Rager boss clip' },
      { kind: 'img', src: 'extra_images/RoidRager2.png', alt: 'Roid Rager title screen' },
      { kind: 'img', src: 'extra_images/RoidRager1.png', alt: 'Roid Rager gameplay still' },
      { kind: 'video', src: 'extra_images/RoidRager%20-%20tazer.mp4', poster: 'extra_images/RoidRager%20-%20tazer-poster.jpg', alt: 'Roid Rager tazer weapon' },
      { kind: 'video', src: 'extra_images/roidrager-slots.mp4', poster: 'extra_images/roidrager-slots-poster.jpg', alt: 'Roid Rager slot machine' },
      { kind: 'video', src: 'extra_images/roidrager-menu.mp4', poster: 'extra_images/roidrager-menu-poster.jpg', alt: 'Roid Rager main menu' },
      { kind: 'video', src: 'extra_images/roidrager-beer.mp4', poster: 'extra_images/roidrager-beer-poster.jpg', alt: 'Roid Rager beer pickup' },
      { kind: 'img', src: 'extra_images/roidrager-pig.png', alt: 'Roid Rager pig enemy' },
      { kind: 'img', src: 'extra_images/roidrager3.png', alt: 'Roid Rager gameplay screenshot' },
      { kind: 'img', src: 'extra_images/roidrager4.png', alt: 'Roid Rager boss screenshot' },
    ],
  },
  {
    key: 'unity',
    container: '.marquee-unity',
    items: [
      { kind: 'video', src: 'extra_images/unity_project.mp4', poster: 'extra_images/unity_project-poster.jpg', alt: 'Procedural voxel terrain generator' },
      { kind: 'video', src: 'extra_images/unity_script.mp4', poster: 'extra_images/unity_script-poster.jpg', alt: 'Unity voxel scripting' },
      { kind: 'video', src: 'extra_images/unity-animation.mp4', poster: 'extra_images/unity-animation-poster.jpg', alt: 'Unity character animation' },
      { kind: 'img', src: 'extra_images/image3%20unity.png', alt: 'Unity project screenshot' },
      { kind: 'img', src: 'extra_images/unity%20cave.png', alt: 'Unity cave generation' },
      { kind: 'img', src: 'extra_images/unity%20layers.png', alt: 'Unity terrain layers' },
      { kind: 'img', src: 'extra_images/unity%20map.png', alt: 'Unity voxel map' },
      { kind: 'img', src: 'extra_images/unity-character.png', alt: 'Unity character' },
    ],
  },
  {
    key: 'webdev',
    container: '.marquee-webdev',
    items: [
      { kind: 'video', src: 'extra_images/website.mp4', poster: 'extra_images/website-poster.jpg', alt: 'This portfolio site' },
      { kind: 'video', src: 'extra_images/portfolio_site_1.mp4', poster: 'extra_images/portfolio_site_1-poster.jpg', alt: 'Portfolio site v1' },
      { kind: 'video', src: 'extra_images/old_porfoliosite.mp4', poster: 'extra_images/old_porfoliosite-poster.jpg', alt: 'Old portfolio site' },
      { kind: 'video', src: 'extra_images/kermisfuif_website.mp4', poster: 'extra_images/kermisfuif_website-poster.jpg', alt: 'Kermisfuif website' },
      { kind: 'video', src: 'extra_images/jorismenten_2_website.mp4', poster: 'extra_images/jorismenten_2_website-poster.jpg', alt: 'Joris Menten website' },
      { kind: 'img', src: 'extra_images/clampy2.0%20-%20web.png', alt: 'Clampy 2.0 website' },
      { kind: 'img', src: 'extra_images/web%20game.png', alt: 'Web game project' },
      { kind: 'img', src: 'extra_images/web%20page%20retro%20green.png', alt: 'Retro green web page' },
      { kind: 'video', src: 'extra_images/web%20vm%20dev.mp4', poster: 'extra_images/web%20vm%20dev-poster.jpg', alt: 'Web development process' },
      { kind: 'video', src: 'extra_images/vm%20development%20inro.mp4', poster: 'extra_images/vm%20development%20inro-poster.jpg', alt: 'Development intro' },
      { kind: 'img', src: 'extra_images/web%203d%20model%20viewer.png', alt: 'Three.js 3D model viewer' },
      { kind: 'img', src: 'extra_images/web%20orc.png', alt: 'Web orc character' },
    ],
  },
];

// Builds one marquee track: the row's tiles repeated `copies` times so
// the track is at least twice the container wide and the -50% translateX
// keyframe loops back to an identical frame (seamless, no jump).
function buildMarqueeTrack(items, copies) {
  const track = document.createElement('div');
  track.className = 'marquee-track';

  for (let c = 0; c < copies; c += 1) {
    items.forEach((item) => {
      const tile = document.createElement('div');
      tile.className = 'marquee-tile';

      const media = document.createElement('div');
      media.className = 'tile-media';

      if (item.kind === 'video') {
        const video = document.createElement('video');
        video.src = item.src;
        if (item.poster) video.poster = item.poster;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'none';
        if (item.alt) video.setAttribute('aria-label', item.alt);
        video.setAttribute('data-autoplay', '');
        video.setAttribute('muted', '');
        media.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        media.appendChild(img);
      }

      tile.appendChild(media);
      track.appendChild(tile);
    });
  }

  return track;
}

class PortfolioApp {
  constructor() {
    this.canvas = document.getElementById('scroll-canvas');
    this.progressFill = document.getElementById('scroll-progress-fill');
    this.nav = document.getElementById('nav');
    this.sections = document.querySelectorAll('.section');
    this.heroContent = document.querySelector('.hero-content');
    this.navIndicator = document.createElement('div');
    this.navIndicator.className = 'nav-indicator';
    this.navLinksContainer = document.querySelector('.nav-links');

    this.animation = new FrameAnimation(this.canvas, this.sections.length);
    this.fullpage = null;
    this.currentSectionIndex = 0;
    this.ambientAnimations = [];
    this._triggeredSections = new Set();

    this._init();
  }

  _init() {
    this.animation.start().then(() => {
      this._initFullPage();
      this._bindEvents();
      this._initMagneticButtons();
      this._initTiltEffect();
      // this._initGSAP(); // Disabled - conflicts with FullPage.js
      this._initAnimeAmbient();
      this._initCarousels();
      new AutoplayClips();
      this._loop();
      this._updateNavIndicator();
      
      // Trigger animations for first section immediately
      const firstSection = document.querySelector('#hero');
      if (firstSection) {
        this._triggerSectionAnimations(firstSection);
      }
    });
  }

  _initFullPage() {
    // Custom snappy section scroll - no external dependency
    console.log('[ScrollSnap] Initializing custom section snap');
    this._initSectionSnap();
  }

  _initSectionSnap() {
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.currentSectionIndex = 0;
    this.sections = document.querySelectorAll('.section');
    this.sectionPositions = [];
    
    console.log('[SectionSnap] Found sections:', this.sections.length);
    this.sections.forEach((s, i) => console.log(`[SectionSnap] Section ${i}:`, s.id, 'height:', s.offsetHeight));
    
    // Calculate section positions
    this._updateSectionPositions();
    window.addEventListener('resize', () => this._updateSectionPositions());
    
    // Wheel/touch scroll with snapping
    window.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
    window.addEventListener('touchstart', (e) => this._touchStart = e.touches[0].clientY, { passive: true });
    window.addEventListener('touchend', (e) => this._onTouchEnd(e), { passive: true });
    
    // Keyboard navigation
    window.addEventListener('keydown', (e) => this._onKeydown(e));
    
    // Click navigation
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          const index = Array.from(this.sections).indexOf(target);
          if (index !== -1) this._snapToSection(index);
          this._closeMobileNav();
        }
      });
    });
    
    // Scroll progress tracking (for animation)
    window.addEventListener('scroll', () => this._onNativeScroll(), { passive: true });
  }

  _updateSectionPositions() {
    this.sectionPositions = Array.from(this.sections).map(section => {
      const rect = section.getBoundingClientRect();
      return rect.top + window.scrollY;
    });
    console.log('[SectionSnap] Positions:', this.sectionPositions);
  }

  _onWheel(e) {
    if (this.isScrolling) return;
    
    e.preventDefault();
    
    const direction = e.deltaY > 0 ? 1 : -1;
    const nextIndex = Math.max(0, Math.min(this.sections.length - 1, this.currentSectionIndex + direction));
    
    console.log('[Wheel] currentIndex:', this.currentSectionIndex, 'nextIndex:', nextIndex, 'deltaY:', e.deltaY);
    
    if (nextIndex !== this.currentSectionIndex) {
      this._snapToSection(nextIndex);
    }
  }

  _onTouchEnd(e) {
    if (this.isScrolling || !this._touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientY;
    const diff = this._touchStart - touchEnd;
    this._touchStart = null;
    
    if (Math.abs(diff) > 50) {
      const direction = diff > 0 ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(this.sections.length - 1, this.currentSectionIndex + direction));
      if (nextIndex !== this.currentSectionIndex) {
        this._snapToSection(nextIndex);
      }
    }
  }

  _onKeydown(e) {
    const scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'];
    if (!scrollKeys.includes(e.key)) return;
    
    e.preventDefault();
    
    let nextIndex = this.currentSectionIndex;
    
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
      nextIndex = Math.min(this.sections.length - 1, this.currentSectionIndex + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      nextIndex = Math.max(0, this.currentSectionIndex - 1);
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = this.sections.length - 1;
    }
    
    if (nextIndex !== this.currentSectionIndex) {
      this._snapToSection(nextIndex);
    }
  }

  _snapToSection(index) {
    if (this.isScrolling) return;
    
    this.isScrolling = true;
    this.currentSectionIndex = index;
    
    const targetY = this.sectionPositions[index];
    
    // Calculate frame range for this transition
    const startFrame = this.animation.isReady ? this.animation.currentFrame : 0;
    const endFrame = this.animation.isReady 
      ? Math.min(this.animation.totalFrames - 1, index * this.animation.framesPerSection)
      : 0;
    const frameDistance = endFrame - startFrame;
    
    // Update nav immediately
    this._updateNavForSection(index);
    
    // Trigger section entrance animations
    const targetSection = this.sections[index];
    if (targetSection) {
      this._triggerSectionAnimations(targetSection);
    }
    
    if (this.animation.isReady) {
      this.animation.goToSection(index);
    }
    
    // Smooth scroll with custom easing - also drive frame animation
    const startY = window.scrollY;
    const distance = targetY - startY;
    const duration = 800;
    const startTime = performance.now();
    let lastFrame = -1;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Linear - no easing
      
      // Prevent tick() from fighting manual frame control
      if (this.animation.isReady) this.animation.externallyDriven = true;
      
      // Drive scroll
      window.scrollTo(0, startY + distance * progress);
      
      // Drive frame animation in perfect sync
      if (this.animation.isReady && frameDistance !== 0) {
        this.animation.currentFrame = startFrame + frameDistance * progress;
        const frameIndex = Math.floor(this.animation.currentFrame);
        if (frameIndex !== lastFrame) {
          lastFrame = frameIndex;
        }
        this.animation._render();
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Release frame control back to tick()
        if (this.animation.isReady) this.animation.externallyDriven = false;
        
        this.isScrolling = false;
        this._updateSectionPositions();
        // Ensure exact final frame
        if (this.animation.isReady) {
          this.animation.currentFrame = endFrame;
          this.animation.targetFrame = endFrame;
          this.animation._render();
        }
      }
    };
    
    requestAnimationFrame(animate);
  }

  _onNativeScroll() {
    // Update progress bar and nav based on scroll position
    const scrollY = window.scrollY;
    const progress = this._getScrollProgress(scrollY);
    this.progressFill.style.width = `${progress * 100}%`;
    
    // Update nav based on which section is most visible
    const viewportCenter = scrollY + window.innerHeight / 2;
    let closestIndex = 0;
    let closestDist = Infinity;
    
    this.sectionPositions.forEach((pos, i) => {
      const section = this.sections[i];
      const sectionCenter = pos + section.offsetHeight / 2;
      const dist = Math.abs(viewportCenter - sectionCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });
    
    if (closestIndex !== this.currentSectionIndex && !this.isScrolling) {
      console.log('[NativeScroll] scrollY:', scrollY, 'closestIndex:', closestIndex);
      this.currentSectionIndex = closestIndex;
      this._updateNavForSection(closestIndex);
      if (this.animation.isReady) {
        this.animation.goToSection(closestIndex);
      }
    }
  }

  _getScrollProgress(scrollY) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 0;
    return Math.max(0, Math.min(1, scrollY / docHeight));
  }

  _updateNavForSection(index) {
    const section = this.sections[index];
    if (!section) return;
    
    this.nav.classList.toggle('scrolled', index > 0);
    this._updateActiveNav(section.id);
    this._updateNavAccent(index);
  }

  _getScrollProgress(scrollY) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 0;
    return Math.max(0, Math.min(1, scrollY / docHeight));
  }

  _updateHeroFade(scrollY) {
    if (!this.heroContent) return;
    const fade = Math.min(1, scrollY / (window.innerHeight * 0.55));
    this.heroContent.style.opacity = String(1 - fade);
    this.heroContent.style.transform = `translateY(${fade * 16}px)`;
    this.heroContent.style.pointerEvents = fade > 0.85 ? 'none' : 'auto';
  }

  _updateActiveNav(activeSectionId) {
    const navMap = {
      hero: ['hero'],
      'about-skills': ['about-skills'],
      work: ['work'],
      unreal: ['unreal'],
      unity: ['unity'],
      webdev: ['webdev'],
      contact: ['contact'],
    };

    const activeIds = navMap[activeSectionId] || ['hero'];
    document.querySelectorAll('.nav-links a').forEach((link) => {
      const href = link.getAttribute('href')?.slice(1);
      link.classList.toggle('active', activeIds.includes(href));
    });

    if (this._navIndicatorUpdate) this._navIndicatorUpdate();
  }

  _updateNavAccent(sectionIndexOrProgress) {
    // If called with section index (from FullPage.js)
    const isSectionIndex = Number.isInteger(sectionIndexOrProgress) && sectionIndexOrProgress >= 0 && sectionIndexOrProgress < this.sections.length;
    let progress = isSectionIndex 
      ? sectionIndexOrProgress / (this.sections.length - 1)
      : sectionIndexOrProgress;

    const accentMap = [
      { start: 0, end: 0.15, accent: '#c41e3a' },
      { start: 0.15, end: 0.35, accent: '#c41e3a' },
      { start: 0.35, end: 0.55, accent: '#c41e3a' },
      { start: 0.55, end: 0.75, accent: '#c41e3a' },
      { start: 0.75, end: 1, accent: '#c41e3a' },
    ];

    let currentAccent = '#c41e3a';
    for (const item of accentMap) {
      if (progress >= item.start && progress < item.end) {
        currentAccent = item.accent;
        break;
      }
    }

    document.documentElement.style.setProperty('--nav-accent', currentAccent);
  }

  _updateParallax(scrollY) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    document.querySelectorAll('.parallax-float').forEach((el) => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (center - window.innerHeight / 2) * 0.04;
      el.style.transform = `translateY(${offset}px) scale(1.04)`;
    });
  }

  _triggerSectionAnimations(section) {
    if (typeof anime === 'undefined') return;

    // Animate each section's entrance only once
    if (this._triggeredSections.has(section)) return;
    this._triggeredSections.add(section);

    const reveals = section.querySelectorAll('.reveal');
    reveals.forEach((el, index) => {
      // Carousels get a clean fade-up: no tilt, so the tile grid never looks skewed
      const isCarousel = el.classList.contains('carousel-stack');

      // Reset initial state
      el.style.opacity = '0';
      el.style.transform = isCarousel
        ? 'translateY(40px) scale(0.98)'
        : 'translateY(40px) rotate(-3deg) scale(0.95)';
      
      anime({
        targets: el,
        opacity: [0, 1],
        translateY: [40, 0],
        ...(isCarousel ? {} : { rotate: [{ value: (Math.random() - 0.5) * 6, duration: 0 }, 0] }),
        scale: isCarousel ? [0.98, 1] : [0.95, 1],
        duration: 1000,
        delay: index * 80,
        easing: 'easeOutExpo',
        complete: () => {
          el.classList.add('is-visible');
        }
      });
    });

    const heroContent = section.querySelector('.hero-content');
    if (heroContent) {
      anime({
        targets: heroContent,
        opacity: 1,
        translateY: 0,
        duration: 1200,
        easing: 'easeOutExpo',
      });
    }
  }

  _bindEvents() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target && this.fullpage && this.fullpage.api) {
          const anchor = href.slice(1);
          this.fullpage.api.moveTo(anchor);
          this._closeMobileNav();
        } else if (target) {
          // Fallback: scroll to section
          target.scrollIntoView({ behavior: 'smooth' });
          this._closeMobileNav();
        }
      });
    });

    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const backdrop = document.querySelector('.nav-backdrop');

    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      if (backdrop) backdrop.classList.toggle('open', isOpen);
    });

    if (backdrop) {
      backdrop.addEventListener('click', () => this._closeMobileNav());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this._closeMobileNav();
    });
  }

  _closeMobileNav() {
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const backdrop = document.querySelector('.nav-backdrop');

    navLinks?.classList.remove('open');
    navToggle?.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
    backdrop?.classList.remove('open');
  }

  _initMagneticButtons() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const buttons = document.querySelectorAll('.contact-btn, .project-link, .nav-cta, .dock a');
    buttons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  _initTiltEffect() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const cards = document.querySelectorAll('.glass-card, .lab-board, .roid-board');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / centerY * -3;
        const rotateY = (x - centerX) / centerX * 3;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  _updateNavIndicator() {
    if (!this.navLinksContainer) return;
    const links = this.navLinksContainer.querySelectorAll('a[href^="#"]');
    if (!links.length) return;

    this.navLinksContainer.style.position = 'relative';
    this.navLinksContainer.appendChild(this.navIndicator);

    const updateIndicator = () => {
      const activeLink = this.navLinksContainer.querySelector('a.active');
      if (activeLink) {
        const rect = activeLink.getBoundingClientRect();
        const parentRect = this.navLinksContainer.getBoundingClientRect();
        this.navIndicator.style.left = `${rect.left - parentRect.left}px`;
        this.navIndicator.style.width = `${rect.width}px`;
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    this._navIndicatorUpdate = updateIndicator;
  }

  _updateActiveNav(activeSectionId) {
    const navMap = {
      hero: ['hero'],
      'about-skills': ['about-skills'],
      work: ['work'],
      unreal: ['unreal'],
      unity: ['unity'],
      webdev: ['webdev'],
      contact: ['contact'],
    };

    const activeIds = navMap[activeSectionId] || ['hero'];
    document.querySelectorAll('.nav-links a').forEach((link) => {
      const href = link.getAttribute('href')?.slice(1);
      link.classList.toggle('active', activeIds.includes(href));
    });

    if (this._navIndicatorUpdate) this._navIndicatorUpdate();
  }

  _updateNavAccent(sectionIndex) {
    const accentMap = [
      { index: 0, accent: '#c41e3a' },
      { index: 1, accent: '#c41e3a' },
      { index: 2, accent: '#c41e3a' },
      { index: 3, accent: '#c41e3a' },
      { index: 4, accent: '#c41e3a' },
      { index: 5, accent: '#c41e3a' },
      { index: 6, accent: '#c41e3a' },
    ];

    let currentAccent = '#c41e3a';
    for (const item of accentMap) {
      if (sectionIndex === item.index) {
        currentAccent = item.accent;
        break;
      }
    }

    document.documentElement.style.setProperty('--nav-accent', currentAccent);
  }

  _initAnimeAmbient() {
    if (typeof anime === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    this._animateAmbientGlows();
    this._animateFloatingParticles();
    this._animateMorphingShapes();
    this._animateTextStagger();
    this._animateScrollIndicator();
  }

  _animateAmbientGlows() {
    const glows = document.querySelectorAll('.ambient-glow');
    glows.forEach((glow, i) => {
      const anim = anime({
        targets: glow,
        translateX: [
          { value: (Math.random() - 0.5) * 60, duration: 8000 + i * 2000, easing: 'easeInOutSine' },
          { value: (Math.random() - 0.5) * 60, duration: 8000 + i * 2000, easing: 'easeInOutSine' }
        ],
        translateY: [
          { value: (Math.random() - 0.5) * 60, duration: 10000 + i * 1500, easing: 'easeInOutSine' },
          { value: (Math.random() - 0.5) * 60, duration: 10000 + i * 1500, easing: 'easeInOutSine' }
        ],
        scale: [
          { value: 1 + (Math.random() - 0.5) * 0.3, duration: 12000 + i * 3000, easing: 'easeInOutSine' },
          { value: 1 + (Math.random() - 0.5) * 0.3, duration: 12000 + i * 3000, easing: 'easeInOutSine' }
        ],
        opacity: [
          { value: 0.08 + Math.random() * 0.12, duration: 6000 + i * 2000, easing: 'easeInOutSine' },
          { value: 0.08 + Math.random() * 0.12, duration: 6000 + i * 2000, easing: 'easeInOutSine' }
        ],
        loop: true,
        direction: 'alternate',
        autoplay: true
      });
      this.ambientAnimations.push(anim);
    });
  }

  _animateFloatingParticles() {
    const heroSection = document.querySelector('#hero');
    if (!heroSection) return;

    const particleContainer = document.createElement('div');
    particleContainer.className = 'ambient-particles';
    particleContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;overflow:hidden;';
    heroSection.appendChild(particleContainer);

    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 4 + 1;
      particle.style.cssText = `
        position:absolute;
        width:${size}px;
        height:${size}px;
        background:rgba(196,30,58,${0.3 + Math.random() * 0.4});
        border-radius:50%;
        left:${Math.random() * 100}%;
        top:${Math.random() * 100}%;
        filter:blur(1px);
      `;
      particleContainer.appendChild(particle);

      const anim = anime({
        targets: particle,
        translateX: (Math.random() - 0.5) * 200,
        translateY: (Math.random() - 0.5) * 200,
        scale: [1, 0.3, 1],
        opacity: [0.6, 0.1, 0.6],
        rotate: Math.random() * 360,
        duration: 15000 + Math.random() * 10000,
        easing: 'easeInOutSine',
        loop: true,
        direction: 'alternate',
        delay: Math.random() * 5000,
        autoplay: true
      });
      this.ambientAnimations.push(anim);
    }
  }

  _animateMorphingShapes() {
    const sections = document.querySelectorAll('.section');
    sections.forEach((section, sectionIndex) => {
      const shapeContainer = document.createElement('div');
      shapeContainer.className = 'morphing-shape';
      shapeContainer.style.cssText = `
        position:absolute;
        width:300px;
        height:300px;
        border-radius:50%;
        background:linear-gradient(135deg,rgba(196,30,58,0.08),rgba(123,33,168,0.05));
        filter:blur(80px);
        pointer-events:none;
        z-index:0;
        top:50%;
        left:50%;
        transform:translate(-50%,-50%);
        opacity:0.6;
      `;
      section.appendChild(shapeContainer);

      const anim = anime({
        targets: shapeContainer,
        borderRadius: ['50%', '30% 70% 70% 30% / 30% 30% 70% 70%', '50%'],
        scale: [1, 1.3, 1],
        rotate: [0, 120, 240, 360],
        translateX: (Math.random() - 0.5) * 100,
        translateY: (Math.random() - 0.5) * 100,
        duration: 20000 + sectionIndex * 3000,
        easing: 'easeInOutSine',
        loop: true,
        direction: 'alternate',
        autoplay: true
      });
      this.ambientAnimations.push(anim);
    });
  }

  _animateTextStagger() {
    const headlines = document.querySelectorAll('h1, h2.lab-head-copy h2, h2.roid-head-copy h2, .glass-card h2');
    headlines.forEach((headline) => {
      if (headline.dataset.staggered) return;
      headline.dataset.staggered = 'true';
      
      const text = headline.textContent;
      if (text.length < 3) return;
      
      headline.innerHTML = text.split('').map(char => 
        char === ' ' ? '<span class="char">&nbsp;</span>' : `<span class="char">${char}</span>`
      ).join('');
      
      const chars = headline.querySelectorAll('.char');
      const anim = anime({
        targets: chars,
        opacity: [0, 1],
        translateY: [30, 0],
        rotateX: [-90, 0],
        scale: [0.8, 1],
        duration: 800,
        delay: anime.stagger(40, { start: 200 }),
        easing: 'easeOutExpo',
        autoplay: false
      });
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            anim.play();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      observer.observe(headline);
    });
  }

  _animateScrollIndicator() {
    if (typeof gsap !== 'undefined') return; // GSAP handles this
    
    const scrollDot = document.querySelector('.scroll-indicator-dot');
    if (!scrollDot) return;

    const anim = anime({
      targets: scrollDot,
      translateY: [0, 43],
      opacity: [1, 0.2],
      duration: 1600,
      easing: 'easeInOutQuad',
      loop: true,
      direction: 'alternate',
      autoplay: true
    });
    this.ambientAnimations.push(anim);
  }

  _initCarousels() {
    const MARQUEE_COPIES = 2;

    CAROUSEL_DATA.forEach((config) => {
      const marquee = document.querySelector(config.container);
      if (!marquee) return;

      // Interleave the items: even indices scroll in the top row,
      // odd indices in the bottom row, which runs the other way.
      const topItems = config.items.filter((_, i) => i % 2 === 0);
      const bottomItems = config.items.filter((_, i) => i % 2 === 1);

      const topRow = document.createElement('div');
      topRow.className = 'marquee-row marquee-row--top';
      topRow.appendChild(buildMarqueeTrack(topItems, MARQUEE_COPIES));

      const bottomRow = document.createElement('div');
      bottomRow.className = 'marquee-row marquee-row--bottom';
      bottomRow.appendChild(buildMarqueeTrack(bottomItems, MARQUEE_COPIES));

      marquee.append(topRow, bottomRow);
    });
  }

  _loop(time) {
    if (this.lenis) {
      this.lenis.raf(time);
      this._onScroll(this.lenis.animatedScroll || window.scrollY);
    }
    this.animation.tick();
    requestAnimationFrame((t) => this._loop(t));
  }
}

new PortfolioApp();