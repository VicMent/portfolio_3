// Scroll-scrubbed canvas. Frames load in background; page is interactive immediately.

const VIDEO_PATH = 'animation.webm';

class ScrollAnimation {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.preload = 'auto';
    this.video.src = VIDEO_PATH;
    this.isReady = false;
    this.duration = 0;
    this.targetTime = 0;
    this.smoothTime = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

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
    await new Promise((resolve) => {
      const onMeta = () => {
        this.duration = this.video.duration;
        this.isReady = true;
        this.video.removeEventListener('loadedmetadata', onMeta);
        resolve();
      };
      this.video.addEventListener('loadedmetadata', onMeta);
      this.video.addEventListener('error', () => {
        console.warn('Animation video failed to load');
        this.video.removeEventListener('loadedmetadata', onMeta);
        resolve();
      }, { once: true });
      this.video.load();
    });

    this.video.currentTime = 0;
    this._render();

    const loader = document.getElementById('loader');
    if (loader) {
      await new Promise(r => setTimeout(r, 600));
      loader.classList.add('hidden');
    }
  }

  _drawCover(el) {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const vw = el.videoWidth || el.naturalWidth || el.width || 1536;
    const vh = el.videoHeight || el.naturalHeight || el.height || 864;
    const scale = Math.max(cw / vw, ch / vh);
    const w = vw * scale;
    const h = vh * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    this.ctx.drawImage(el, x, y, w, h);
  }

  _render() {
    this.ctx.fillStyle = '#0d0d0d';
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    this._drawCover(this.video);
  }

  setProgress(progress) {
    const raw = progress * this.duration;
    this.targetTime = raw;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      this.smoothTime = raw;
    } else {
      const diff = raw - this.smoothTime;
      this.smoothTime += diff * 0.18;
      if (Math.abs(diff) < 0.05) this.smoothTime = raw;
    }
  }

  tick() {
    if (!this.isReady || !this.duration) return;

    if (Math.abs(this.targetTime - this.smoothTime) > 0.05) {
      const diff = this.targetTime - this.smoothTime;
      this.smoothTime += diff * 0.18;
    }

    const target = Math.max(0, Math.min(this.duration, this.smoothTime));
    if (Math.abs(this.video.currentTime - target) > 0.03) {
      this.video.currentTime = target;
    }

    this._render();
  }
}

class AutoplayClips {
  constructor() {
    const videos = document.querySelectorAll('[data-autoplay]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (!reduced && entry.isIntersecting && entry.intersectionRatio > 0.2) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: [0, 0.2, 0.5] });

    videos.forEach((video) => observer.observe(video));
  }
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

    this.animation = new ScrollAnimation(this.canvas);

    this._init();
  }

  _init() {
    this.animation.start().then(() => this._onScroll());
    this._bindEvents();
    this._initMagneticButtons();
    this._initParallaxFloat();
    this._initTiltEffect();
    this._initGSAP();
    this._initLenis();
    new AutoplayClips();
    this._loop();
    this._updateNavIndicator();
  }

  _bindEvents() {
    window.addEventListener('scroll', () => this._onScroll(), { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
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

  _initParallaxFloat() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const floaters = document.querySelectorAll('.parallax-float, .lab-hero img, .roid-tile img, .roid-tile video');
    floaters.forEach((el) => {
      el.classList.add('parallax-float');
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

  _initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('GSAP or ScrollTrigger not loaded');
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const reveals = document.querySelectorAll('.reveal');

    const sectionAnims = {
      'hero':       { x: 0, y: 40, rotate: 0, scale: 1 },
      'work':       { x: -80, y: 60, rotate: -3, scale: 0.95 },
      'about':      { x: 80, y: 60, rotate: 3, scale: 0.95 },
      'roid':       { x: -80, y: 50, rotate: -2, scale: 0.96 },
      'assets':     { x: 80, y: 50, rotate: 2, scale: 0.96 },
      'skills':     { x: -60, y: 40, rotate: -1, scale: 0.98 },
      'contact':    { x: 60, y: 40, rotate: 1, scale: 0.98 },
    };

    reveals.forEach((el, index) => {
      const parent = el.closest('.section');
      if (!parent) return;

      const sectionId = parent.id || 'hero';
      const anim = sectionAnims[sectionId] || sectionAnims['hero'];
      const isHero = sectionId === 'hero';

      const fromVars = {
        opacity: 0,
        x: anim.x,
        y: anim.y,
        rotate: anim.rotate,
        scale: anim.scale,
      };

      const toVars = {
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        duration: 1.1,
        ease: 'power3.out',
      };

      if (isHero) {
        toVars.delay = 0.2 + index * 0.1;
      } else {
        toVars.scrollTrigger = {
          trigger: el,
          start: 'top 90%',
          end: 'top 15%',
          scrub: 1.5,
        };
        toVars.delay = 0;
      }

      gsap.fromTo(el, fromVars, toVars);
    });

    const scrollDot = document.querySelector('.scroll-indicator-dot');
    if (scrollDot) {
      gsap.set(scrollDot, { y: 0, opacity: 1 });

      const dotTl = gsap.timeline({ repeat: -1, repeatDelay: 0.3 });
      dotTl.to(scrollDot, {
        y: 43,
        opacity: 0.2,
        duration: 1.6,
        ease: 'power2.in',
      }).to(scrollDot, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
      });

      ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        onLeave: () => dotTl.pause(),
        onEnterBack: () => dotTl.resume(),
      });
    }

    ScrollTrigger.refresh();
  }

  _initLenis() {
    if (!window.Lenis) {
      console.warn('Lenis not loaded');
      return;
    }

    this.lenis = new Lenis({
      autoRaf: false,
      lerp: 0.1,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    this.lenis.on('scroll', ({ animatedScroll }) => {
      this._onScroll();
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.update();
      }
    });

    window.addEventListener('keydown', (e) => {
      const scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' '];
      if (!scrollKeys.includes(e.key)) return;

      e.preventDefault();
      const viewportH = window.innerHeight;
      const currentScroll = this.lenis.animatedScroll || window.scrollY;
      let targetY = currentScroll;

      if (e.key === 'ArrowDown') {
        let best = null;
        let bestDist = Infinity;
        this.sections.forEach(section => {
          const rect = section.getBoundingClientRect();
          const sectionTop = rect.top + currentScroll;
          if (sectionTop > currentScroll + viewportH * 0.15) {
            const dist = sectionTop - currentScroll;
            if (dist < bestDist) {
              best = section;
              bestDist = dist;
            }
          }
        });
        if (best) {
          const rect = best.getBoundingClientRect();
          const sectionTop = rect.top + currentScroll;
          const sectionHeight = rect.height;
          targetY = sectionTop + sectionHeight / 2 - viewportH / 2;
        } else {
          targetY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        }
      } else if (e.key === 'ArrowUp') {
        let best = null;
        let bestDist = Infinity;
        this.sections.forEach(section => {
          const rect = section.getBoundingClientRect();
          const sectionTop = rect.top + currentScroll;
          const sectionBottom = sectionTop + rect.height;
          if (sectionBottom < currentScroll - viewportH * 0.15) {
            const dist = currentScroll - sectionBottom;
            if (dist < bestDist) {
              best = section;
              bestDist = dist;
            }
          }
        });
        if (best) {
          const rect = best.getBoundingClientRect();
          const sectionTop = rect.top + currentScroll;
          const sectionHeight = rect.height;
          targetY = sectionTop + sectionHeight / 2 - viewportH / 2;
        } else {
          targetY = 0;
        }
      } else if (e.key === ' ' || e.key === 'PageDown') {
        targetY = currentScroll + viewportH * 0.8;
      } else if (e.key === 'PageUp') {
        targetY = currentScroll - viewportH * 0.8;
      }

      this.lenis.scrollTo(targetY, { immediate: false });
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

  _getScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 0;
    return Math.max(0, Math.min(1, scrollTop / docHeight));
  }

  _onScroll() {
    const progress = this._getScrollProgress();

    if (this.animation.isReady) {
      this.animation.setProgress(progress);
    }

    this.progressFill.style.width = `${progress * 100}%`;
    this.nav.classList.toggle('scrolled', window.scrollY > 60);

    this._updateHeroFade();
    this._updateActiveNav(progress);
    this._updateNavAccent(progress);
    this._updateParallax();

    if (this._navIndicatorUpdate) this._navIndicatorUpdate();
  }

  _updateHeroFade() {
    if (!this.heroContent) return;
    const fade = Math.min(1, window.scrollY / (window.innerHeight * 0.55));
    this.heroContent.style.opacity = String(1 - fade);
    this.heroContent.style.transform = `translateY(${fade * 16}px)`;
    this.heroContent.style.pointerEvents = fade > 0.85 ? 'none' : 'auto';
  }

  _updateActiveNav(progress) {
    const navMap = [
      { id: 'hero', start: 0, end: 0.12 },
      { id: 'work', start: 0.12, end: 0.32 },
      { id: 'about', start: 0.32, end: 0.55 },
      { id: 'skills', start: 0.72, end: 0.88 },
      { id: 'contact', start: 0.88, end: 1 },
    ];

    let active = 'hero';
    for (const item of navMap) {
      if (progress >= item.start && progress < item.end) {
        active = item.id;
        break;
      }
    }
    if (progress >= 0.88) active = 'contact';

    document.querySelectorAll('.nav-links a').forEach((link) => {
      const href = link.getAttribute('href')?.slice(1);
      link.classList.toggle('active', href === active);
    });
  }

  _updateNavAccent(progress) {
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

  _updateParallax() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const scrollY = window.scrollY;
    document.querySelectorAll('.parallax-float').forEach((el) => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const offset = (center - window.innerHeight / 2) * 0.04;
      el.style.transform = `translateY(${offset}px) scale(1.04)`;
    });
  }

  _loop(time) {
    if (this.lenis) {
      this.lenis.raf(time);
      ScrollTrigger.update();
    }
    this.animation.tick();
    requestAnimationFrame((t) => this._loop(t));
  }
}

new PortfolioApp();
