// Vic Menten portfolio
//
// The background is a 170-frame image sequence drawn to a fixed canvas.
// The scroll position always decides which frame is shown, so the
// animation follows the page whether the visitor snaps section by
// section (desktop) or scrolls freely (phones, tablets).

const FRAME_COUNT = 170;

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
// Touch devices and narrow screens scroll natively instead of snapping.
const useFreeScroll = () => window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------------------------------------------------------------
// Background frame sequence
// ---------------------------------------------------------------
class FrameAnimation {
  constructor(canvas, sectionCount) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.frames = new Array(FRAME_COUNT);
    this.current = 0;
    this.target = 0;
    this.drawnImage = null;
    this.framesPerSection = (FRAME_COUNT - 1) / Math.max(1, sectionCount - 1);
    // Phones get a lighter 768px-wide set; larger screens the full 1536px set.
    this.dir = window.innerWidth <= 900 ? 'frames/sm/' : 'frames/lg/';

    this._resize();
    window.addEventListener('resize', () => {
      this._resize();
      this.render(true);
    });
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingQuality = 'high';
  }

  _load(index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        this.frames[index] = img;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = `${this.dir}${String(index + 1).padStart(4, '0')}.webp`;
    });
  }

  // Loads the frames for the first transition (enough to start), then
  // streams the rest in the background, in order, a few at a time.
  async start(onProgress) {
    const firstBatch = Math.ceil(this.framesPerSection) + 1;
    let loaded = 0;

    await Promise.all(
      Array.from({ length: firstBatch }, (_, i) =>
        this._load(i).then(() => onProgress(++loaded / firstBatch))
      )
    );
    this.render(true);

    const queue = Array.from({ length: FRAME_COUNT - firstBatch }, (_, i) => i + firstBatch);
    const worker = async () => {
      while (queue.length) await this._load(queue.shift());
    };
    Array.from({ length: 6 }, worker);
  }

  frameForSection(index) {
    return index * this.framesPerSection;
  }

  // Falls back to the closest frame that has arrived so far.
  _imageFor(index) {
    if (this.frames[index]) return this.frames[index];
    for (let d = 1; d < FRAME_COUNT; d++) {
      if (this.frames[index - d]) return this.frames[index - d];
      if (this.frames[index + d]) return this.frames[index + d];
    }
    return null;
  }

  render(force = false) {
    const index = clamp(Math.round(this.current), 0, FRAME_COUNT - 1);
    const img = this._imageFor(index);
    if (!img || (!force && img === this.drawnImage)) return;
    this.drawnImage = img;

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    // Landscape screens: cover the whole screen. Portrait screens: a
    // wide band through the middle, so the 16:9 frames are not cropped
    // down to a sliver.
    const portrait = this.height > this.width;
    const scale = portrait
      ? Math.max(this.width / iw, (this.height * 0.6) / ih)
      : Math.max(this.width / iw, this.height / ih);
    const w = iw * scale;
    const h = ih * scale;
    const x = (this.width - w) / 2;
    // On portrait the band sits a little high, leaving room for the hero text below it.
    const y = portrait ? Math.max(0, this.height * 0.36 - h / 2) : (this.height - h) / 2;

    const ctx = this.ctx;
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.drawImage(img, x, y, w, h);

    if (h < this.height) {
      const fade = Math.min(120, h * 0.25);
      const top = ctx.createLinearGradient(0, y, 0, y + fade);
      top.addColorStop(0, '#0d0d0d');
      top.addColorStop(1, 'rgba(13,13,13,0)');
      ctx.fillStyle = top;
      ctx.fillRect(0, y, this.width, fade);
      const bottom = ctx.createLinearGradient(0, y + h - fade, 0, y + h);
      bottom.addColorStop(0, 'rgba(13,13,13,0)');
      bottom.addColorStop(1, '#0d0d0d');
      ctx.fillStyle = bottom;
      ctx.fillRect(0, y + h - fade, this.width, fade);
    }
  }

  tick() {
    const diff = this.target - this.current;
    this.current = Math.abs(diff) < 0.3 ? this.target : this.current + diff * 0.3;
    this.render();
  }
}

// ---------------------------------------------------------------
// Carousel videos: only the most visible clip in a row plays, the
// hovered clip always wins, and nothing downloads until the carousel
// is close to the screen.
// ---------------------------------------------------------------
class AutoplayClips {
  constructor() {
    this.rows = new Map();
    this.ratios = new WeakMap();
    this.hoveredClip = null;

    document.querySelectorAll('video[data-autoplay]').forEach((video) => {
      const row = video.closest('.marquee-row');
      if (!row) return;
      if (!this.rows.has(row)) this.rows.set(row, new Set());
      this.rows.get(row).add(video);

      const tile = video.parentElement;
      video.addEventListener('play', () => tile.classList.add('is-playing'));
      video.addEventListener('pause', () => tile.classList.remove('is-playing'));

      video.addEventListener('mouseenter', () => {
        this.hoveredClip = video;
        this._syncRow(row);
      });
      video.addEventListener('mouseleave', () => {
        if (this.hoveredClip !== video) return;
        this.hoveredClip = null;
        this._syncRow(row);
      });
    });

    // Attach sources once a carousel is within a screen of the viewport.
    const hydrate = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.querySelectorAll('video[data-src]').forEach((video) => {
            video.poster = video.dataset.poster || '';
            video.src = video.dataset.src;
            video.removeAttribute('data-src');
          });
          hydrate.unobserve(entry.target);
        });
      },
      { rootMargin: '50% 0px' }
    );
    document.querySelectorAll('.marquee').forEach((m) => hydrate.observe(m));

    this.visibility = new IntersectionObserver(
      (entries) => {
        const touched = new Set();
        entries.forEach((entry) => {
          this.ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
          touched.add(entry.target.closest('.marquee-row'));
        });
        touched.forEach((row) => this._syncRow(row));
      },
      { threshold: [0, 0.5, 0.75, 1] }
    );
    this.rows.forEach((clips) => clips.forEach((clip) => this.visibility.observe(clip)));
  }

  _syncRow(row) {
    const clips = this.rows.get(row);
    if (!clips) return;

    let best = null;
    if (this.hoveredClip && clips.has(this.hoveredClip)) {
      best = this.hoveredClip;
    } else if (!reducedMotion()) {
      let bestRatio = 0.6;
      clips.forEach((clip) => {
        const ratio = this.ratios.get(clip) || 0;
        if (ratio > bestRatio) {
          bestRatio = ratio;
          best = clip;
        }
      });
    }

    clips.forEach((clip) => {
      if (clip === best) {
        if (clip.paused && !clip.dataset.src) clip.play().catch(() => {});
      } else if (!clip.paused) {
        clip.pause();
      }
    });
  }
}

// ---------------------------------------------------------------
// Media carousels. Each section's items are split over two rows that
// scroll in opposite directions. Add a project by adding an entry.
//   kind: 'img' | 'video'
// ---------------------------------------------------------------
const CAROUSEL_DATA = [
  {
    key: 'work',
    container: '.marquee-work',
    items: [
      { kind: 'img', src: 'extra_images/ethicallabs_project.webp', alt: 'Totally Ethical Labs gameplay' },
      { kind: 'video', src: 'extra_images/TEL-bug.mp4', poster: 'extra_images/TEL-bug-poster.webp', alt: 'Totally Ethical Labs bug fix' },
      { kind: 'img', src: 'extra_images/TEL%20-%20logo.png', alt: 'Totally Ethical Labs logo' },
      { kind: 'img', src: 'extra_images/tel-image.webp', alt: 'Totally Ethical Labs screenshot' },
      { kind: 'img', src: 'extra_images/tel-image%202.webp', alt: 'Totally Ethical Labs environment' },
      { kind: 'video', src: 'extra_images/TEL%20chair%20throwing/TEL%20chair%20throwing-1.mp4', poster: 'extra_images/TEL%20chair%20throwing/TEL%20chair%20throwing-1-poster.webp', alt: 'Totally Ethical Labs magnet ability' },
      { kind: 'video', src: 'extra_images/TEL%20intro%20scene/TEL%20intro%20scene-1.mp4', poster: 'extra_images/TEL%20intro%20scene/TEL%20intro%20scene-1-poster.webp', alt: 'Totally Ethical Labs intro scene' },
      { kind: 'video', src: 'extra_images/TEL%20main%20menu.mp4', poster: 'extra_images/TEL%20main%20menu-poster.webp', alt: 'Totally Ethical Labs main menu' },
      { kind: 'video', src: 'extra_images/TEL%20AK%20shooting%20gameplay/TEL%20AK%20shooting%20gameplay-1.mp4', poster: 'extra_images/TEL%20AK%20shooting%20gameplay/TEL%20AK%20shooting%20gameplay-1-poster.webp', alt: 'Totally Ethical Labs AK shooting' },
      { kind: 'video', src: 'extra_images/TEL%20research/TEL%20research-1.mp4', poster: 'extra_images/TEL%20research/TEL%20research-1-poster.webp', alt: 'Totally Ethical Labs research' },
      { kind: 'video', src: 'extra_images/TEL%20table%20smash/TEL%20table%20smash-1.mp4', poster: 'extra_images/TEL%20table%20smash/TEL%20table%20smash-1-poster.webp', alt: 'Totally Ethical Labs table smash' },
    ],
  },
  {
    key: 'unreal',
    container: '.marquee-unreal',
    items: [
      { kind: 'video', src: 'extra_images/RoidRager3.mp4', poster: 'extra_images/RoidRager3-poster.webp', alt: 'Roid Rager gameplay clip' },
      { kind: 'video', src: 'extra_images/RoidRager4.mp4', poster: 'extra_images/RoidRager4-poster.webp', alt: 'Roid Rager boss clip' },
      { kind: 'img', src: 'extra_images/RoidRager2.webp', alt: 'Roid Rager title screen' },
      { kind: 'img', src: 'extra_images/RoidRager1.webp', alt: 'Roid Rager gameplay still' },
      { kind: 'video', src: 'extra_images/RoidRager%20-%20tazer.mp4', poster: 'extra_images/RoidRager%20-%20tazer-poster.webp', alt: 'Roid Rager tazer weapon' },
      { kind: 'video', src: 'extra_images/roidrager-slots.mp4', poster: 'extra_images/roidrager-slots-poster.webp', alt: 'Roid Rager slot machine' },
      { kind: 'video', src: 'extra_images/roidrager-menu.mp4', poster: 'extra_images/roidrager-menu-poster.webp', alt: 'Roid Rager main menu' },
      { kind: 'video', src: 'extra_images/roidrager-beer.mp4', poster: 'extra_images/roidrager-beer-poster.webp', alt: 'Roid Rager beer pickup' },
      { kind: 'img', src: 'extra_images/roidrager-pig.webp', alt: 'Roid Rager pig enemy' },
      { kind: 'img', src: 'extra_images/roidrager3.webp', alt: 'Roid Rager gameplay screenshot' },
      { kind: 'img', src: 'extra_images/roidrager4.webp', alt: 'Roid Rager boss screenshot' },
    ],
  },
  {
    key: 'unity',
    container: '.marquee-unity',
    items: [
      { kind: 'video', src: 'extra_images/unity_project.mp4', poster: 'extra_images/unity_project-poster.webp', alt: 'Procedural voxel terrain generator' },
      { kind: 'video', src: 'extra_images/unity_script.mp4', poster: 'extra_images/unity_script-poster.webp', alt: 'Unity voxel scripting' },
      { kind: 'video', src: 'extra_images/unity-animation.mp4', poster: 'extra_images/unity-animation-poster.webp', alt: 'Unity character animation' },
      { kind: 'img', src: 'extra_images/image3%20unity.webp', alt: 'Unity project screenshot' },
      { kind: 'img', src: 'extra_images/unity%20cave.webp', alt: 'Unity cave generation' },
      { kind: 'img', src: 'extra_images/unity%20layers.webp', alt: 'Unity terrain layers' },
      { kind: 'img', src: 'extra_images/unity%20map.webp', alt: 'Unity voxel map' },
      { kind: 'img', src: 'extra_images/unity-character.webp', alt: 'Unity character' },
    ],
  },
  {
    key: 'webdev',
    container: '.marquee-webdev',
    items: [
      { kind: 'video', src: 'extra_images/website.mp4', poster: 'extra_images/website-poster.webp', alt: 'This portfolio site' },
      { kind: 'video', src: 'extra_images/portfolio_site_1.mp4', poster: 'extra_images/portfolio_site_1-poster.webp', alt: 'Portfolio site v1' },
      { kind: 'video', src: 'extra_images/old_porfoliosite.mp4', poster: 'extra_images/old_porfoliosite-poster.webp', alt: 'Old portfolio site' },
      { kind: 'video', src: 'extra_images/kermisfuif_website.mp4', poster: 'extra_images/kermisfuif_website-poster.webp', alt: 'Kermisfuif website' },
      { kind: 'video', src: 'extra_images/jorismenten_2_website.mp4', poster: 'extra_images/jorismenten_2_website-poster.webp', alt: 'Joris Menten website' },
      { kind: 'img', src: 'extra_images/clampy2.0%20-%20web.webp', alt: 'Clampy 2.0 website' },
      { kind: 'img', src: 'extra_images/web%20game.webp', alt: 'Web game project' },
      { kind: 'img', src: 'extra_images/web%20page%20retro%20green.png', alt: 'Retro green web page' },
      { kind: 'video', src: 'extra_images/web%20vm%20dev.mp4', poster: 'extra_images/web%20vm%20dev-poster.webp', alt: 'Web development process' },
      { kind: 'video', src: 'extra_images/vm%20development%20inro.mp4', poster: 'extra_images/vm%20development%20inro-poster.webp', alt: 'Development intro' },
      { kind: 'img', src: 'extra_images/web%203d%20model%20viewer.webp', alt: 'Three.js 3D model viewer' },
      { kind: 'img', src: 'extra_images/web%20orc.webp', alt: 'Web orc character' },
    ],
  },
];

// One marquee track holds the row's tiles twice, so the -50% translate
// keyframe loops back onto an identical frame without a visible jump.
function buildMarqueeTrack(items) {
  const track = document.createElement('div');
  track.className = 'marquee-track';
  track.style.setProperty('--marquee-duration', `${Math.max(30, items.length * 8)}s`);

  for (let copy = 0; copy < 2; copy++) {
    items.forEach((item) => {
      const tile = document.createElement('div');
      tile.className = 'marquee-tile';
      if (copy === 1) tile.setAttribute('aria-hidden', 'true');

      const media = document.createElement('div');
      media.className = 'tile-media';
      media.dataset.kind = item.kind;

      if (item.kind === 'video') {
        const video = document.createElement('video');
        video.dataset.src = item.src;
        if (item.poster) video.dataset.poster = item.poster;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'none';
        video.setAttribute('muted', '');
        video.setAttribute('data-autoplay', '');
        if (item.alt) video.setAttribute('aria-label', item.alt);
        media.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = copy === 0 ? item.alt || '' : '';
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

// ---------------------------------------------------------------
// App
// ---------------------------------------------------------------
class PortfolioApp {
  constructor() {
    this.sections = Array.from(document.querySelectorAll('.section'));
    this.nav = document.getElementById('nav');
    this.navLinks = document.querySelector('.nav-links');
    this.navToggle = document.getElementById('nav-toggle');
    this.navBackdrop = document.querySelector('.nav-backdrop');
    this.progressFill = document.getElementById('scroll-progress-fill');

    this.animation = new FrameAnimation(document.getElementById('scroll-canvas'), this.sections.length);
    this.freeScroll = useFreeScroll();
    this.index = 0;
    this.isSnapping = false;
    this.wheelLockUntil = 0;

    this._buildCarousels();
    this._bindNavigation();
    this._initNavIndicator();
    this._initReveals();
    this._initHeadlines();
    this._initPointerEffects();
    this._initAmbient();
    new AutoplayClips();

    window.addEventListener('scroll', () => this._onScroll(), { passive: true });
    window.addEventListener('resize', () => {
      this.freeScroll = useFreeScroll();
      this._onScroll();
    });
    this._onScroll();

    this._startLoader();
    this._loop();
  }

  // ---------------- Loader ----------------
  _startLoader() {
    const loader = document.getElementById('loader');
    const bar = document.getElementById('loader-bar-fill');
    const percent = document.getElementById('loader-percent');
    const status = document.getElementById('loader-status');

    const hide = () => loader?.classList.add('hidden');
    // Never keep anyone stuck behind the loader on a slow connection.
    const fallback = setTimeout(hide, 8000);

    this.animation
      .start((progress) => {
        const pct = Math.round(progress * 100);
        if (bar) bar.style.width = `${pct}%`;
        if (percent) percent.textContent = `${pct}%`;
        if (status) status.textContent = pct < 100 ? 'Loading' : 'Ready';
      })
      .then(() => {
        clearTimeout(fallback);
        setTimeout(hide, 200);
      });
  }

  // ---------------- Scroll position ----------------
  _sectionTop(i) {
    return this.sections[i].offsetTop;
  }

  // Index of the section that contains the middle of the viewport.
  _sectionAtViewport() {
    const mid = window.scrollY + window.innerHeight / 2;
    let found = 0;
    this.sections.forEach((s, i) => {
      if (s.offsetTop <= mid) found = i;
    });
    return found;
  }

  // Maps the scroll position to a (fractional) frame: section i's top
  // shows that section's frame, and positions in between blend smoothly.
  _frameForScroll() {
    const y = window.scrollY;
    const last = this.sections.length - 1;
    for (let i = 0; i < last; i++) {
      const top = this._sectionTop(i);
      const next = this._sectionTop(i + 1);
      if (y < next) {
        const t = clamp((y - top) / (next - top), 0, 1);
        return this.animation.frameForSection(i + t);
      }
    }
    return this.animation.frameForSection(last);
  }

  _onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (this.progressFill) this.progressFill.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
    this.nav.classList.toggle('scrolled', y > 40);

    this.animation.target = this._frameForScroll();

    const index = this._sectionAtViewport();
    if (!this.isSnapping && index !== this.index) {
      this.index = index;
      this._setActiveNav(index);
    }
  }

  // ---------------- Snapping (desktop) ----------------
  // True when the current section is taller than the screen and there is
  // still part of it to scroll through in that direction.
  _canScrollInside(dir) {
    const section = this.sections[this.index];
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight - window.innerHeight;
    const y = window.scrollY;
    return dir > 0 ? y < bottom - 2 : y > top + 2;
  }

  _onWheel(e) {
    if (this.freeScroll || e.ctrlKey) return;

    const now = performance.now();
    if (this.isSnapping || now < this.wheelLockUntil) {
      // Swallow trackpad momentum so one swipe moves one section.
      e.preventDefault();
      this.wheelLockUntil = Math.max(this.wheelLockUntil, now + 150);
      return;
    }

    const dir = Math.sign(e.deltaY);
    if (!dir || this._canScrollInside(dir)) return;

    e.preventDefault();
    this.goTo(this.index + dir, dir);
  }

  _onKeydown(e) {
    if (this.freeScroll || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest('input, textarea, select, button, [contenteditable]')) return;

    const keys = {
      ArrowDown: 1, PageDown: 1, ' ': 1,
      ArrowUp: -1, PageUp: -1,
    };
    if (e.key === ' ' && e.shiftKey) keys[' '] = -1;

    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      this.goTo(e.key === 'Home' ? 0 : this.sections.length - 1);
      return;
    }

    const dir = keys[e.key];
    if (!dir) return;
    if (this._canScrollInside(dir)) return;
    e.preventDefault();
    if (!this.isSnapping) this.goTo(this.index + dir, dir);
  }

  goTo(index, dir = 0) {
    index = clamp(index, 0, this.sections.length - 1);
    const section = this.sections[index];
    // Coming back up into a tall section lands on its bottom edge.
    const overflow = section.offsetHeight - window.innerHeight;
    const targetY = dir < 0 && overflow > 0 ? section.offsetTop + overflow : section.offsetTop;

    this.index = index;
    this._setActiveNav(index);

    if (this.freeScroll || reducedMotion()) {
      window.scrollTo({ top: targetY, behavior: reducedMotion() ? 'auto' : 'smooth' });
      return;
    }

    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 1) return;

    const duration = clamp(500 + Math.abs(distance) * 0.25, 700, 1200);
    const startTime = performance.now();
    this.isSnapping = true;

    const step = (now) => {
      const t = clamp((now - startTime) / duration, 0, 1);
      window.scrollTo(0, startY + distance * easeInOutCubic(t));
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        this.isSnapping = false;
        this.wheelLockUntil = performance.now() + 250;
      }
    };
    requestAnimationFrame(step);
  }

  // ---------------- Navigation ----------------
  _bindNavigation() {
    window.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
    window.addEventListener('keydown', (e) => this._onKeydown(e));

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      const target = document.querySelector(link.getAttribute('href'));
      const index = this.sections.indexOf(target);
      if (index === -1) return;
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this._closeMobileNav();
        this.goTo(index);
      });
    });

    this.navToggle.addEventListener('click', () => {
      const open = this.navLinks.classList.toggle('open');
      this.navToggle.classList.toggle('open', open);
      this.navToggle.setAttribute('aria-expanded', String(open));
      this.navBackdrop?.classList.toggle('open', open);
    });
    this.navBackdrop?.addEventListener('click', () => this._closeMobileNav());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this._closeMobileNav();
    });
  }

  _closeMobileNav() {
    this.navLinks.classList.remove('open');
    this.navToggle.classList.remove('open');
    this.navToggle.setAttribute('aria-expanded', 'false');
    this.navBackdrop?.classList.remove('open');
  }

  _setActiveNav(index) {
    const id = this.sections[index]?.id;
    this.navLinks.querySelectorAll('a[href^="#"]').forEach((link) => {
      const active = link.getAttribute('href') === `#${id}` && !link.classList.contains('nav-cta');
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    this._updateNavIndicator?.();
  }

  _initNavIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'nav-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    this.navLinks.appendChild(indicator);

    this._updateNavIndicator = () => {
      const active = this.navLinks.querySelector('a.active');
      if (!active) {
        indicator.style.opacity = '0';
        return;
      }
      const rect = active.getBoundingClientRect();
      const parent = this.navLinks.getBoundingClientRect();
      indicator.style.opacity = '1';
      indicator.style.left = `${rect.left - parent.left}px`;
      indicator.style.width = `${rect.width}px`;
    };
    window.addEventListener('resize', this._updateNavIndicator);
    document.fonts?.ready.then(this._updateNavIndicator);
  }

  // ---------------- Content ----------------
  _buildCarousels() {
    CAROUSEL_DATA.forEach((config) => {
      const marquee = document.querySelector(config.container);
      if (!marquee) return;

      // Even items run in the top row, odd items in the bottom row.
      const rows = [
        ['marquee-row marquee-row--top', config.items.filter((_, i) => i % 2 === 0)],
        ['marquee-row marquee-row--bottom', config.items.filter((_, i) => i % 2 === 1)],
      ];
      rows.forEach(([className, items]) => {
        const row = document.createElement('div');
        row.className = className;
        row.appendChild(buildMarqueeTrack(items));
        marquee.appendChild(row);
      });
    });
  }

  // Fade content up as each section comes into view.
  _initReveals() {
    const items = document.querySelectorAll('.reveal');
    if (reducedMotion() || typeof anime === 'undefined') {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          observer.unobserve(el);
          const siblings = Array.from(el.closest('.section')?.querySelectorAll('.reveal') || [el]);
          anime({
            targets: el,
            opacity: [0, 1],
            translateY: [32, 0],
            duration: 900,
            delay: Math.max(0, siblings.indexOf(el)) * 90,
            easing: 'easeOutExpo',
            complete: () => {
              el.classList.add('is-visible');
              el.style.transform = '';
            },
          });
        });
      },
      { threshold: 0.15 }
    );
    items.forEach((el) => observer.observe(el));
  }

  // Letter-by-letter entrance for headings. Words stay unbroken so lines
  // still wrap between words, and screen readers get the plain text.
  _initHeadlines() {
    if (reducedMotion() || typeof anime === 'undefined') return;

    document.querySelectorAll('.glass-card h2, .section-header h2').forEach((heading) => {
      const text = heading.textContent.trim();
      heading.setAttribute('aria-label', text);
      heading.innerHTML = text
        .split(' ')
        .map((word) =>
          `<span class="word" aria-hidden="true" style="display:inline-block;white-space:nowrap">${
            Array.from(word).map((c) => `<span class="char">${c}</span>`).join('')
          }</span>`
        )
        .join(' ');

      const chars = heading.querySelectorAll('.char');
      chars.forEach((c) => (c.style.opacity = '0'));
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          observer.disconnect();
          anime({
            targets: chars,
            opacity: [0, 1],
            translateY: [24, 0],
            duration: 700,
            delay: anime.stagger(28, { start: 150 }),
            easing: 'easeOutExpo',
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(heading);
    });
  }

  // ---------------- Pointer effects (mouse only) ----------------
  _initPointerEffects() {
    if (reducedMotion() || !finePointer()) return;

    document.querySelectorAll('.contact-btn, .project-link').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.25}px)`;
      });
      btn.addEventListener('mouseleave', () => (btn.style.transform = ''));
    });

    document.querySelectorAll('.glass-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -4;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 4;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
      });
      card.addEventListener('mouseleave', () => (card.style.transform = ''));
    });
  }

  _initAmbient() {
    if (reducedMotion() || typeof anime === 'undefined') return;

    const hero = document.getElementById('hero');
    if (hero) {
      const container = document.createElement('div');
      container.className = 'ambient-particles';
      container.setAttribute('aria-hidden', 'true');
      hero.appendChild(container);

      for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        const size = Math.random() * 3 + 1.5;
        p.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;` +
          `background:rgba(196,30,58,${0.3 + Math.random() * 0.4});` +
          `left:${Math.random() * 100}%;top:${Math.random() * 100}%;`;
        container.appendChild(p);
        anime({
          targets: p,
          translateX: (Math.random() - 0.5) * 200,
          translateY: (Math.random() - 0.5) * 200,
          opacity: [0.6, 0.1],
          duration: 15000 + Math.random() * 10000,
          easing: 'easeInOutSine',
          loop: true,
          direction: 'alternate',
          delay: Math.random() * 4000,
        });
      }
    }

    const dot = document.querySelector('.scroll-indicator-dot');
    if (dot) {
      anime({
        targets: dot,
        translateY: [0, 43],
        opacity: [1, 0.2],
        duration: 1600,
        easing: 'easeInOutQuad',
        loop: true,
        direction: 'alternate',
      });
    }
  }

  _loop() {
    this.animation.tick();
    requestAnimationFrame(() => this._loop());
  }
}

new PortfolioApp();
