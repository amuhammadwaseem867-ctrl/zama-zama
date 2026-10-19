/* ==========================================================================
   Zama Zama Autofitment — interactions & motion
   GSAP + ScrollTrigger + SplitText + Flip, Lenis smooth scrolling.
   Everything degrades gracefully: without these libraries (or with
   "reduce motion" switched on) the page is fully usable and static.
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- Business settings — edit these ---------- */
  const CONFIG = {
    businessName: 'Zama Zama Autofitment',
    whatsappNumber: '27718956445', // 071 895 6445 — international format, digits only (no +, spaces or dashes)
    timeZone: 'Africa/Johannesburg', // shop's time zone, so 'Open now' is right for every visitor
    // Opening hours per weekday (0 = Sunday … 6 = Saturday) as [open, close] in 24h hours, or null when closed.
    hours: { 0: [10, 16], 1: [8, 20], 2: [8, 20], 3: [8, 20], 4: [8, 20], 5: [8, 20], 6: [8, 20] },
    defaultQuoteQty: 4,
  };

  /* ---------- Helpers ---------- */
  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const { gsap, ScrollTrigger, SplitText, Flip, Lenis } = window;
  const canAnimate = Boolean(gsap && ScrollTrigger) && !reduceMotion;
  if (gsap) gsap.registerPlugin(...[ScrollTrigger, SplitText, Flip].filter(Boolean));
  if (!canAnimate) root.classList.add('no-anim');

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    },
  };
  const waLink = (text) => `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  const fmtHour = (h) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  const imgReady = (img) => new Promise((resolve) => {
    if (!img || img.complete) return resolve();
    img.addEventListener('load', resolve, { once: true });
    img.addEventListener('error', resolve, { once: true });
  });

  // Images that finished before this script ran
  $$('img').forEach((img) => { if (img.complete && img.naturalWidth) img.classList.add('is-loaded'); });
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Toast ---------- */
  const toastEl = $('.toast');
  let toastTimer;
  function toast(message) {
    if (!toastEl) return;
    $('span', toastEl).textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 3200);
  }

  /* ==========================================================================
     Smooth scroll
     ========================================================================== */
  let lenis = null;
  if (canAnimate && Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const lockScroll = (lock) => {
    if (lenis) lock ? lenis.stop() : lenis.start();
    document.body.style.overflow = lock ? 'hidden' : '';
  };
  function scrollToTarget(target) {
    if (target == null) return;
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reduceMotion ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  // Scroll velocity, shared by the tyre and the marquee
  let lastY = window.scrollY;
  let nativeVelocity = 0;
  const scrollVelocity = () => (lenis ? lenis.velocity : nativeVelocity);

  /* ==========================================================================
     SVG tyre (drawn in code so it can spin and show a live size)
     ========================================================================== */
  const polar = (r, deg) => {
    const a = (deg * Math.PI) / 180;
    return `${(r * Math.sin(a)).toFixed(2)},${(-r * Math.cos(a)).toFixed(2)}`;
  };
  const sector = (r1, r2, a1, a2) =>
    `M${polar(r2, a1)} A${r2} ${r2} 0 0 1 ${polar(r2, a2)} L${polar(r1, a2)} A${r1} ${r1} 0 0 0 ${polar(r1, a1)} Z`;

  function buildTyre(svg, uid, size) {
    if (!svg) return null;
    const id = (n) => `${uid}-${n}`;
    let grooves = '';
    for (let i = 0; i < 72; i++) {
      grooves += `<rect x="-2.6" y="-300" width="5.2" height="${i % 2 ? 13 : 20}" rx="1.6" transform="rotate(${i * 5})"/>`;
    }
    let holes = '';
    for (let i = 0; i < 36; i++) {
      const [x1, y1] = polar(152, i * 10).split(',');
      const [x2, y2] = polar(134, i * 10 + 5).split(',');
      holes += `<circle cx="${x1}" cy="${y1}" r="3.3"/><circle cx="${x2}" cy="${y2}" r="3.3"/>`;
    }
    let spokes = '';
    for (let i = 0; i < 5; i++) {
      [-7.5, 7.5].forEach((off) => {
        const c = i * 72 + off;
        spokes += `<path d="M${polar(64, c - 5.5)} L${polar(197, c - 3)} A197 197 0 0 1 ${polar(197, c + 3)} L${polar(64, c + 5.5)} Z"/>`;
      });
    }
    let nuts = '';
    for (let i = 0; i < 5; i++) {
      const [x, y] = polar(38, i * 72 + 36).split(',');
      nuts += `<circle cx="${x}" cy="${y}" r="7.5" fill="url(#${id('metal')})"/><circle cx="${x}" cy="${y}" r="3.4" fill="#16161a"/>`;
    }

    svg.innerHTML = `
      <defs>
        <radialGradient id="${id('rubber')}" r=".5" cx=".5" cy=".5">
          <stop offset=".64" stop-color="#202026"/><stop offset=".86" stop-color="#141418"/>
          <stop offset=".96" stop-color="#0b0b0d"/><stop offset="1" stop-color="#050506"/>
        </radialGradient>
        <linearGradient id="${id('metal')}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f6f6f8"/><stop offset=".38" stop-color="#9c9ca6"/>
          <stop offset=".58" stop-color="#e3e3e8"/><stop offset="1" stop-color="#5f5f68"/>
        </linearGradient>
        <radialGradient id="${id('disc')}" r=".5">
          <stop offset=".55" stop-color="#2a2a30"/><stop offset=".92" stop-color="#3b3b43"/><stop offset="1" stop-color="#232328"/>
        </radialGradient>
        <linearGradient id="${id('accent')}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff4d1c"/><stop offset="1" stop-color="#ffb21e"/>
        </linearGradient>
        <linearGradient id="${id('gloss')}" x1="0" y1="0" x2=".75" y2=".95">
          <stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/>
        </linearGradient>
        <path id="${id('arc')}" d="M0,-242 A242,242 0 1,1 0,242 A242,242 0 1,1 0,-242" fill="none"/>
        <path id="${id('cal')}" d="M${polar(150, 56)} A150 150 0 0 1 ${polar(150, 96)}" fill="none"/>
      </defs>

      <circle r="299" fill="url(#${id('rubber')})"/>
      <g class="spin">
        <g fill="#050506">${grooves}</g>
        <circle r="281" fill="none" stroke="rgba(255,255,255,.05)"/>
        <circle r="214" fill="none" stroke="rgba(255,255,255,.05)"/>
        <text class="tyre__text"><textPath href="#${id('arc')}" textLength="1500" lengthAdjust="spacing">ZAMA ZAMA AUTOFITMENT • ULTRA HIGH PERFORMANCE • <tspan class="tyre__size">${size} 94W</tspan> • TUBELESS RADIAL • GRIP ENGINEERED •</textPath></text>
      </g>

      <circle r="209" fill="url(#${id('metal')})"/>
      <circle r="200" fill="#0b0b0e"/>
      <circle r="176" fill="url(#${id('disc')})"/>
      <g class="spin" fill="#111114">${holes}</g>
      <circle r="112" fill="#1b1b20" stroke="rgba(255,255,255,.06)"/>

      <g class="tyre__caliper">
        <path d="${sector(120, 182, 50, 102)}" fill="url(#${id('accent')})" stroke="url(#${id('accent')})" stroke-width="12" stroke-linejoin="round"/>
        <text font-family="Unbounded, sans-serif" font-weight="800" font-size="17" letter-spacing="3" fill="#160a00"><textPath href="#${id('cal')}" startOffset="50%" text-anchor="middle">ZAMA</textPath></text>
      </g>

      <circle r="64" fill="#1f1f24"/>
      <g class="spin">
        <g fill="url(#${id('metal')})" stroke="rgba(0,0,0,.45)" stroke-width="1.5">${spokes}</g>
        <circle r="60" fill="url(#${id('metal')})"/>
        ${nuts}
      </g>
      <circle r="200" fill="none" stroke="rgba(0,0,0,.55)" stroke-width="7"/>
      <circle r="24" fill="#0c0c0f" stroke="url(#${id('accent')})" stroke-width="2.5"/>
      <path d="M-8 -8H8L-8 8H8" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
      <circle r="299" fill="url(#${id('gloss')})" pointer-events="none"/>
    `;

    const groups = $$('.spin', svg);
    return {
      svg,
      angle: 0,
      setAngle(a) {
        this.angle = a;
        groups.forEach((g) => g.setAttribute('transform', `rotate(${(a % 360).toFixed(2)})`));
      },
      setSize(text) {
        const el = $('.tyre__size', svg);
        if (el) el.textContent = `${text} 94W`;
      },
    };
  }

  const heroTyre = buildTyre($('#heroTyre'), 'ht', '225/45 R17');
  const finderTyre = buildTyre($('#finderTyre'), 'ft', '225/45 R17');

  /* ==========================================================================
     Preloader + hero intro
     ========================================================================== */
  const preloader = $('.preloader');
  const heroRoll = { x: 0, offset: 0 };

  function runPreloader() {
    return new Promise((resolve) => {
      if (!canAnimate || !preloader) {
        if (preloader) preloader.remove();
        resolve();
        return;
      }
      lockScroll(true);
      const num = $('.preloader__num', preloader);
      const bar = $('.preloader__bar i', preloader);
      const letters = $$('.preloader__word span', preloader);
      const state = { p: 0 };
      const render = () => {
        num.textContent = Math.round(state.p);
        bar.style.setProperty('--p', state.p / 100);
      };
      const start = performance.now();

      gsap.fromTo(letters, { yPercent: 110 }, { yPercent: 0, duration: .9, ease: 'expo.out', stagger: .05 });
      gsap.to(state, { p: 86, duration: 1.8, ease: 'power2.out', onUpdate: render });

      const ready = Promise.race([
        Promise.all([document.fonts ? document.fonts.ready : null, imgReady($('.hero__media img'))]),
        wait(2800),
      ]);

      ready.then(() => {
        const minRemaining = Math.max(0, 1.3 - (performance.now() - start) / 1000);
        gsap.to(state, {
          p: 100, duration: .55, delay: minRemaining, ease: 'power2.inOut', overwrite: true, onUpdate: render,
          onComplete() {
            gsap.set(preloader, { clipPath: 'inset(0% 0% 0% 0%)' });
            gsap.timeline({ onComplete: () => { preloader.remove(); lockScroll(false); } })
              .to(letters, { yPercent: -110, duration: .5, ease: 'power3.in', stagger: .03 })
              .to($('.preloader__inner', preloader), { opacity: 0, duration: .3 }, '-=.2')
              .to(preloader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.05, ease: 'expo.inOut' }, '-=.1')
              .add(resolve, '-=.7');
          },
        });
      });
    });
  }

  function heroIntro() {
    if (!canAnimate) {
      $$('.hero [data-count]').forEach((el) => countUp(el, true));
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    gsap.set('.hero [data-hero]', { opacity: 1 });

    tl.fromTo('.hero__media', { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 2.6, ease: 'power3.out' }, 0)
      .fromTo('.hero__line-inner', { yPercent: 112 }, { yPercent: 0, duration: 1.5, stagger: .12 }, .1)
      .fromTo('.hero [data-hero="fade"]', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2, stagger: .1 }, .45)
      .fromTo('.hero__stats li', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.1, stagger: .08 }, .75)
      .add(() => $$('.hero__stats [data-count]').forEach((el) => countUp(el)), .85)
      .fromTo('.tyre-stage__ring', { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: 1.6 }, .6)
      .fromTo('.hero [data-hero="badge"]', { opacity: 0, scale: .8, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: 1.1, stagger: .15, ease: 'back.out(1.7)' }, 1.3)
      .fromTo('.scroll-cue', { opacity: 0 }, { opacity: 1, duration: 1 }, 1.6);

    // The tyre rolls in from the right; rotation matches the distance travelled.
    if (heroTyre) {
      const svg = heroTyre.svg;
      const radius = () => svg.getBoundingClientRect().width / 2 || 250;
      heroRoll.x = window.innerWidth * .65;
      heroRoll.offset = (heroRoll.x / radius()) * (180 / Math.PI);
      gsap.set(svg, { x: heroRoll.x });
      tl.fromTo(heroRoll, { x: heroRoll.x }, {
        x: 0, duration: 2.2, ease: 'expo.out',
        onUpdate() {
          heroRoll.offset = (heroRoll.x / radius()) * (180 / Math.PI);
          gsap.set(svg, { x: heroRoll.x });
        },
      }, .15);
    }
  }

  /* ---------- Hero tyre spin: idle rotation + scroll velocity ---------- */
  function initTyreSpin() {
    if (!canAnimate) {
      heroTyre && heroTyre.setAngle(18);
      finderTyre && finderTyre.setAngle(-30);
      return;
    }
    const visible = new Map();
    const io = new IntersectionObserver((entries) => entries.forEach((e) => visible.set(e.target, e.isIntersecting)));
    [heroTyre, finderTyre].forEach((t) => t && io.observe(t.svg));

    let heroSpeed = .3;
    let base = 0;
    gsap.ticker.add((time, delta) => {
      const step = delta / 16.67;
      const v = scrollVelocity();
      if (heroTyre && visible.get(heroTyre.svg)) {
        const target = .3 + clamp(v * .55, -14, 14);
        heroSpeed += (target - heroSpeed) * .08;
        base += heroSpeed * step;
        heroTyre.setAngle(base + heroRoll.offset);
      }
      if (finderTyre && visible.get(finderTyre.svg)) {
        finderTyre.boost = (finderTyre.boost || 0) * .94;
        finderTyre.setAngle(finderTyre.angle + (.18 + finderTyre.boost) * step);
      }
    });
  }

  /* ==========================================================================
     Header, menu, progress, nav state
     ========================================================================== */
  const header = $('.header');
  const progressBar = $('.scroll-progress');
  const fabTop = $('.fab__top');
  let ticking = false;
  let lastDir = 0;

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(y / max, 0, 1) : 0;
    nativeVelocity = y - lastY;
    const dir = Math.sign(y - lastY) || lastDir;
    lastY = y;
    lastDir = dir;

    header.classList.toggle('is-scrolled', y > 30);
    const menuOpen = root.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && dir > 0 && y > 500);
    progressBar && progressBar.style.setProperty('--p', p);
    if (fabTop) {
      fabTop.classList.toggle('is-visible', y > 700);
      fabTop.style.setProperty('--p', p);
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // Active nav link
  const navLinks = $$('.nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    const map = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.remove('is-active'));
        const link = map.get(e.target.id);
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  // Mobile menu
  const menu = $('#mobileMenu');
  const menuToggle = $('.menu-toggle');
  function setMenu(open) {
    if (!menu) return;
    root.classList.toggle('menu-open', open);
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    header.classList.remove('is-hidden');
    lockScroll(open);
  }
  menuToggle && menuToggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));

  // In-page links: smooth scroll, close overlays, prefill booking service
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href === '#') { e.preventDefault(); return; }
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    if (menu && menu.classList.contains('is-open')) setMenu(false);
    if (drawer && drawer.classList.contains('is-open')) setDrawer(false);
    if (link.dataset.service) {
      const select = $('#b-service');
      if (select) select.value = link.dataset.service;
    }
    scrollToTarget(href === '#home' ? 0 : target);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (menu && menu.classList.contains('is-open')) setMenu(false);
    if (drawer && drawer.classList.contains('is-open')) setDrawer(false);
  });

  /* ==========================================================================
     Scroll-driven animation
     ========================================================================== */
  function initReveals() {
    const els = $$('[data-reveal], .bento__item');
    if (!canAnimate || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      const entering = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      entering
        .sort((a, b) => {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          return ra.top - rb.top || ra.left - rb.left;
        })
        .forEach((el, i) => {
          el.style.setProperty('--d', `${Math.min(i, 6) * .08}s`);
          el.classList.add('is-in');
          io.unobserve(el);
        });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
  }

  function initSplitHeadings() {
    const els = $$('[data-split]');
    if (!canAnimate || !SplitText) {
      els.forEach((el) => { el.style.opacity = 1; });
      return;
    }
    els.forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { opacity: 1 });
          return gsap.from(self.lines, {
            yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: .09,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          });
        },
      });
    });
  }

  function initStatement() {
    const el = $('.statement__text');
    if (!el || !canAnimate || !SplitText) return;
    SplitText.create(el, {
      type: 'words',
      wordsClass: 'word',
      onSplit(self) {
        // Gradient text must live on the word itself so its opacity can animate.
        self.words.forEach((w) => { if (w.closest('.hl')) w.classList.add('word--hl'); });
        $$('.hl', el).forEach((h) => h.classList.remove('hl'));
        return gsap.fromTo(self.words, { opacity: .14 }, {
          opacity: 1, ease: 'none', stagger: .12,
          scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: .6 },
        });
      },
    });
  }

  function initParallax() {
    if (!canAnimate) return;
    gsap.to('.hero__media img', {
      yPercent: 14, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__content', {
      y: -80, opacity: .15, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: '25% top', end: 'bottom top', scrub: true },
    });
    $$('[data-parallax]').forEach((img) => {
      gsap.fromTo(img, { yPercent: -7 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: img.closest('[data-parallax-wrap]') || img, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    [['.statement__media', '.statement'], ['.cta__media', '.cta__card']].forEach(([target, trigger]) => {
      if (!$(target)) return;
      gsap.fromTo(target, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
    gsap.fromTo('.about__img--inset', { y: 60 }, {
      y: -40, ease: 'none',
      scrollTrigger: { trigger: '.about__visual', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.from('.footer__word span', {
      yPercent: 100, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: .06,
      scrollTrigger: { trigger: '.footer__word', start: 'top 95%', once: true },
    });
  }

  function initProcess() {
    if (!canAnimate) return;
    const section = $('.process');
    const track = $('.process__track');
    const bar = $('.process__progress');
    if (!section || !track) return;

    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.process__pin',
          pin: true,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => bar && bar.style.setProperty('--p', self.progress),
        },
      });
      $$('.step', track).forEach((step, i) => {
        const img = $('.step__media img', step);
        if (img) {
          gsap.fromTo(img, { xPercent: -6 }, {
            xPercent: 6, ease: 'none',
            scrollTrigger: { trigger: step, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          });
        }
        // The first step is already in view when pinning starts, so it reveals on vertical scroll.
        gsap.from($$('.step__text > *', step), {
          y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08,
          scrollTrigger: i === 0
            ? { trigger: step, start: 'top 85%', once: true }
            : { trigger: step, containerAnimation: tween, start: 'left 75%', once: true },
        });
      });
    });
    mm.add('(max-width: 900px)', () => {
      $$('.step', track).forEach((step) => {
        gsap.from(step, {
          y: 60, opacity: 0, duration: 1.1, ease: 'expo.out',
          scrollTrigger: { trigger: step, start: 'top 88%', once: true },
        });
      });
    });
  }

  /* ---------- Marquee speed follows scroll velocity ---------- */
  function initBands() {
    if (!canAnimate) return;
    const anims = $$('.band__track')
      .map((el) => (el.getAnimations ? el.getAnimations()[0] : null))
      .filter(Boolean);
    if (!anims.length) return;
    anims.forEach((a) => { a.currentTime = 3600 * 1000; });
    let rate = 1;
    gsap.ticker.add(() => {
      const v = scrollVelocity();
      const target = (1 + clamp(Math.abs(v) * .18, 0, 6)) * (v < -.5 ? -1 : 1);
      rate += (target - rate) * .08;
      anims.forEach((a) => { a.playbackRate = rate; });
    });
  }

  /* ---------- Counters ---------- */
  function countUp(el, instant) {
    if (el.dataset.counted) return;
    el.dataset.counted = '1';
    const end = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const out = (v) => { el.textContent = v.toFixed(decimals); };
    if (instant || !canAnimate) { out(end); return; }
    const t0 = performance.now();
    const dur = 2000;
    const tick = (now) => {
      const t = clamp((now - t0) / dur, 0, 1);
      out(end * (1 - Math.pow(2, -10 * t)));
      if (t < 1) requestAnimationFrame(tick); else out(end);
    };
    requestAnimationFrame(tick);
  }
  function initCounters() {
    const els = $$('[data-count]').filter((el) => !el.closest('.hero'));
    if (!canAnimate || !('IntersectionObserver' in window)) { els.forEach((el) => countUp(el, true)); return; }
    els.forEach((el) => { el.textContent = (0).toFixed(parseInt(el.dataset.decimals || '0', 10)); });
    $$('.hero [data-count]').forEach((el) => { el.textContent = '0'; });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { countUp(e.target); io.unobserve(e.target); } });
    }, { threshold: .6 });
    els.forEach((el) => io.observe(el));
  }

  /* ==========================================================================
     Tyre finder
     ========================================================================== */
  const finderForm = $('#finderForm');
  const sizeSelects = {
    width: $('[data-size="width"]'),
    profile: $('[data-size="profile"]'),
    rim: $('[data-size="rim"]'),
  };
  const range = (from, to, step) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
  const fillSelect = (sel, values, selected, suffix = '') => {
    if (!sel) return;
    sel.innerHTML = values.map((v) => `<option value="${v}"${v === selected ? ' selected' : ''}>${v}${suffix}</option>`).join('');
  };
  fillSelect(sizeSelects.width, range(155, 325, 10), 225);
  fillSelect(sizeSelects.profile, range(25, 80, 5), 45, '%');
  fillSelect(sizeSelects.rim, range(13, 22, 1), 17, '"');

  const currentSize = () => `${sizeSelects.width.value}/${sizeSelects.profile.value} R${sizeSelects.rim.value}`;

  function updateReadout(changed) {
    const vals = { width: sizeSelects.width.value, profile: sizeSelects.profile.value, rim: sizeSelects.rim.value };
    Object.entries(vals).forEach(([key, val]) => {
      const seg = $(`[data-seg="${key}"]`);
      const legend = $(`[data-legend="${key}"]`);
      if (seg && seg.textContent !== val) {
        seg.textContent = val;
        if (!changed || changed === key || changed === 'all') {
          seg.classList.remove('is-flash');
          void seg.offsetWidth;
          seg.classList.add('is-flash');
        }
      }
      if (legend) legend.textContent = key === 'rim' ? `${val}"` : val;
    });
    if (finderTyre) {
      finderTyre.setSize(currentSize());
      finderTyre.boost = 9;
    }
  }
  Object.entries(sizeSelects).forEach(([key, sel]) => sel && sel.addEventListener('change', () => updateReadout(key)));

  function applyPreset(size) {
    const m = /^(\d+)\/(\d+) R(\d+)$/.exec(size || '');
    if (!m) return;
    sizeSelects.width.value = m[1];
    sizeSelects.profile.value = m[2];
    sizeSelects.rim.value = m[3];
    updateReadout('all');
  }
  $$('input[name="vehicle"]').forEach((input) => {
    input.addEventListener('change', () => {
      applyPreset(input.dataset.sizePreset);
      const season = $('#finderSeason');
      if (season) season.value = input.dataset.catPreset || 'all';
    });
  });

  // Tabs
  const tabs = $$('.tabs__btn');
  const indicator = $('.tabs__indicator');
  function moveIndicator() {
    const active = $('.tabs__btn.is-active');
    if (!active || !indicator) return;
    indicator.style.setProperty('--w', `${active.offsetWidth}px`);
    indicator.style.setProperty('--x', `${active.offsetLeft}px`);
  }
  function selectTab(tab) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    moveIndicator();
    if (tab.id === 'tab-vehicle') {
      const checked = $('input[name="vehicle"]:checked');
      if (checked) applyPreset(checked.dataset.sizePreset);
    }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      selectTab(next);
    });
  });
  moveIndicator();
  window.addEventListener('resize', moveIndicator);
  if (document.fonts) document.fonts.ready.then(moveIndicator);

  finderForm && finderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const size = currentSize();
    const season = $('#finderSeason').value;
    shop.cat = season;
    shop.size = size;
    setActiveChip(season);
    const bookingSize = $('#b-size');
    if (bookingSize && !bookingSize.value) bookingSize.value = size;
    applyFilter();
    scrollToTarget($('#shop'));
  });

  /* ==========================================================================
     Shop: filters (with Flip), size selects, quote
     ========================================================================== */
  const products = $$('.product');
  const shop = { cat: 'all', size: null };
  const sizesOf = (card) => card.dataset.sizes.split(',').map((s) => s.trim());
  let productReveal = null;

  products.forEach((card, i) => {
    const sel = $('.product__size', card);
    if (sel) sel.innerHTML = sizesOf(card).map((s) => `<option>${s}</option>`).join('');
    card.style.setProperty('--d', `${(i % 4) * .1}s`);
  });

  if (canAnimate && products.length) {
    productReveal = gsap.from(products, {
      opacity: 0, y: 60, duration: 1.1, ease: 'expo.out', stagger: .08,
      scrollTrigger: {
        trigger: '.products', start: 'top 85%', once: true,
        onEnter: () => products.forEach((p) => p.classList.add('is-in')),
      },
      clearProps: 'transform',
    });
  } else {
    products.forEach((p) => p.classList.add('is-in'));
  }

  const chips = $$('.chip[data-filter]');
  function setActiveChip(cat) {
    chips.forEach((c) => {
      const on = c.dataset.filter === cat;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-pressed', String(on));
    });
  }
  chips.forEach((chip) => chip.addEventListener('click', () => {
    shop.cat = chip.dataset.filter;
    setActiveChip(shop.cat);
    applyFilter();
  }));

  const notice = $('.shop__notice');
  const emptyMsg = $('.shop__empty');
  $('.shop__notice-clear') && $('.shop__notice-clear').addEventListener('click', () => {
    shop.size = null;
    applyFilter();
  });

  function applyFilter() {
    if (productReveal) {
      productReveal.progress(1);
      if (productReveal.scrollTrigger) productReveal.scrollTrigger.kill();
      productReveal = null;
      products.forEach((p) => p.classList.add('is-in'));
    }
    const state = canAnimate && Flip ? Flip.getState(products) : null;
    let shown = 0;
    products.forEach((card) => {
      const okCat = shop.cat === 'all' || card.dataset.cat === shop.cat;
      const okSize = !shop.size || sizesOf(card).includes(shop.size);
      const show = okCat && okSize;
      card.classList.toggle('is-hidden', !show);
      if (show) {
        shown++;
        if (shop.size) $('.product__size', card).value = shop.size;
      }
    });

    if (notice) {
      notice.hidden = !shop.size;
      if (shop.size) {
        $('.shop__notice-text', notice).textContent = shown
          ? `Showing ${shown} tyre${shown === 1 ? '' : 's'} available in ${shop.size}`
          : `No featured tyres in ${shop.size} for this category yet`;
      }
    }
    if (emptyMsg) emptyMsg.hidden = shown > 0;

    if (state) {
      Flip.from(state, {
        duration: .75, ease: 'power3.inOut', absolute: true, scale: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: .6, ease: 'power3.out' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: .9, duration: .4, ease: 'power2.in' }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    } else if (ScrollTrigger) {
      ScrollTrigger.refresh();
    }
  }

  /* ---------- Quote drawer ---------- */
  const drawer = $('#quoteDrawer');
  const overlay = $('.drawer-overlay');
  const quoteToggle = $('.quote-toggle');
  const quoteCount = $('.quote-count');
  let quote = store.get('zz-quote', []);
  if (!Array.isArray(quote)) quote = [];
  let lastFocus = null;

  function setDrawer(open) {
    if (!drawer) return;
    if (open) {
      lastFocus = document.activeElement;
      overlay.hidden = false;
      requestAnimationFrame(() => overlay.classList.add('is-open'));
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      quoteToggle.setAttribute('aria-expanded', 'true');
      lockScroll(true);
      setTimeout(() => $('.drawer__close', drawer).focus(), 80);
    } else {
      overlay.classList.remove('is-open');
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      quoteToggle.setAttribute('aria-expanded', 'false');
      lockScroll(false);
      setTimeout(() => { overlay.hidden = true; }, 500);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
  }
  quoteToggle && quoteToggle.addEventListener('click', () => setDrawer(true));
  overlay && overlay.addEventListener('click', () => setDrawer(false));
  drawer && $('.drawer__close', drawer).addEventListener('click', () => setDrawer(false));
  drawer && drawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusables = $$('a[href], button:not([disabled]), input, select', drawer).filter((el) => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  function quoteMessage() {
    const lines = quote.map((q) => `• ${q.qty} × ${q.brand} ${q.name} (${q.size})`);
    return `Hello ${CONFIG.businessName}! Please send me a price for:\n${lines.join('\n')}\n\nPlease confirm availability and fitting times. Thank you!`;
  }

  function renderQuote(bump) {
    store.set('zz-quote', quote);
    const list = $('.drawer__list');
    const totalQty = quote.reduce((s, q) => s + q.qty, 0);

    if (quoteCount) {
      quoteCount.textContent = totalQty;
      quoteCount.classList.toggle('has-items', totalQty > 0);
      if (bump) {
        quoteCount.classList.remove('is-bump');
        void quoteCount.offsetWidth;
        quoteCount.classList.add('is-bump');
      }
    }
    if (!drawer || !list) return;
    drawer.classList.toggle('is-empty', quote.length === 0);
    list.innerHTML = '';
    quote.forEach((q, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="drawer__thumb media"><img alt="" loading="lazy"></div>
        <div class="drawer__info">
          <small>${q.brand}</small>
          <strong>${q.name}</strong>
          <small>${q.size}</small>
        </div>
        <div class="drawer__side">
          <div class="qty">
            <button type="button" data-qty="-1" aria-label="Decrease quantity"><svg class="ic"><use href="#i-minus"/></svg></button>
            <output aria-live="polite">${q.qty}</output>
            <button type="button" data-qty="1" aria-label="Increase quantity"><svg class="ic"><use href="#i-plus"/></svg></button>
          </div>
          <button class="drawer__remove" type="button">Remove</button>
        </div>`;
      const img = $('img', li);
      img.src = q.img || '';
      img.addEventListener('load', () => img.classList.add('is-loaded'));
      $$('[data-qty]', li).forEach((b) => b.addEventListener('click', () => {
        quote[i].qty = clamp(quote[i].qty + Number(b.dataset.qty), 1, 12);
        renderQuote();
      }));
      $('.drawer__remove', li).addEventListener('click', () => { quote.splice(i, 1); renderQuote(); });
      list.appendChild(li);
    });
    const send = $('.drawer__send');
    if (send) send.href = waLink(quoteMessage());
  }
  $('.drawer__clear') && $('.drawer__clear').addEventListener('click', () => { quote = []; renderQuote(); });

  function flyToQuote(card) {
    const img = $('.product__media img', card);
    if (!canAnimate || !img || !quoteToggle) return;
    const from = img.getBoundingClientRect();
    const to = quoteToggle.getBoundingClientRect();
    const ghost = document.createElement('div');
    Object.assign(ghost.style, {
      position: 'fixed', zIndex: 260, pointerEvents: 'none', borderRadius: '18px',
      left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`,
      background: `#18181d center / cover no-repeat url("${img.currentSrc || img.src}")`,
      boxShadow: '0 20px 50px rgba(0,0,0,.5)',
    });
    document.body.appendChild(ghost);
    header.classList.remove('is-hidden');
    gsap.to(ghost, {
      left: to.left + to.width / 2 - 20, top: to.top + to.height / 2 - 20, width: 40, height: 40,
      borderRadius: '50%', opacity: .2, duration: .85, ease: 'power3.inOut',
      onComplete: () => ghost.remove(),
    });
  }

  $$('.add-to-quote').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.product');
      const size = $('.product__size', card).value;
      const existing = quote.find((q) => q.id === card.dataset.id && q.size === size);
      const label = `${card.dataset.brand} ${card.dataset.name}`;
      if (existing) {
        toast(`${label} (${size}) is already in your quote`);
        setDrawer(true);
        return;
      }
      const img = $('.product__media img', card);
      quote.push({
        id: card.dataset.id,
        brand: card.dataset.brand,
        name: card.dataset.name,
        size,
        qty: CONFIG.defaultQuoteQty,
        img: img ? img.currentSrc || img.src : '',
      });
      flyToQuote(card);
      setTimeout(() => renderQuote(true), canAnimate ? 800 : 0);
      toast(`Added ${CONFIG.defaultQuoteQty} × ${label} (${size}) to your quote`);
      const span = $('.btn__label > span', btn);
      btn.classList.add('is-added');
      if (span) span.textContent = 'Added to quote';
      setTimeout(() => {
        btn.classList.remove('is-added');
        if (span) span.textContent = 'Add to quote';
      }, 2200);
    });
  });
  // Clicking a product image is a shortcut to add it
  $$('.product__media').forEach((m) => m.addEventListener('click', () => $('.add-to-quote', m.closest('.product')).click()));
  renderQuote();

  /* ==========================================================================
     Opening hours + booking form
     ========================================================================== */
  function shopClock() {
    const now = new Date();
    if (!CONFIG.timeZone) return { day: now.getDay(), hour: now.getHours() + now.getMinutes() / 60, date: now };
    try {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
        timeZone: CONFIG.timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
      }).formatToParts(now).map((p) => [p.type, p.value]));
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return { day: days.indexOf(parts.weekday), hour: Number(parts.hour) + Number(parts.minute) / 60, date: now };
    } catch (e) {
      return { day: now.getDay(), hour: now.getHours() + now.getMinutes() / 60, date: now };
    }
  }

  function updateOpenStatus() {
    const { day, hour } = shopClock();
    const today = CONFIG.hours[day];
    const isOpen = Boolean(today && hour >= today[0] && hour < today[1]);
    let text;
    if (isOpen) {
      text = `Open now · until ${fmtHour(today[1])}`;
    } else {
      let label = '';
      let opens = null;
      if (today && hour < today[0]) { opens = today[0]; label = 'today'; }
      else {
        for (let i = 1; i <= 7; i++) {
          const d = (day + i) % 7;
          if (CONFIG.hours[d]) {
            opens = CONFIG.hours[d][0];
            label = i === 1 ? 'tomorrow' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d];
            break;
          }
        }
      }
      text = opens === null ? 'Closed' : `Closed · opens ${fmtHour(opens)} ${label}`;
    }
    $$('[data-open-status]').forEach((el) => {
      el.classList.toggle('is-open', isOpen);
      el.classList.toggle('is-closed', !isOpen);
      $('span', el).textContent = text;
    });
    $$('.hours__list li').forEach((li) => li.classList.toggle('is-today', Number(li.dataset.day) === day));
  }
  updateOpenStatus();
  setInterval(updateOpenStatus, 60000);

  const bookingForm = $('#bookingForm');
  const bookingSuccess = $('.booking-success');
  const dateInput = $('#b-date');
  const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  function updateSlots() {
    if (!dateInput) return;
    const value = dateInput.value;
    const slots = $$('input[name="time"]');
    if (!value) { slots.forEach((s) => { s.disabled = false; }); return; }
    const [y, m, d] = value.split('-').map(Number);
    const day = new Date(y, m - 1, d).getDay();
    const hours = CONFIG.hours[day];
    const { hour: nowHour } = shopClock();
    const isToday = value === isoDate(new Date());
    slots.forEach((s) => {
      const [hh, mm] = s.value.split(':').map(Number);
      const h = hh + mm / 60;
      const closed = !hours || h < hours[0] || h > hours[1] - .5;
      const past = isToday && h < nowHour + .5;
      s.disabled = closed || past;
      if (s.disabled && s.checked) s.checked = false;
    });
  }
  if (dateInput) {
    dateInput.min = isoDate(new Date());
    dateInput.addEventListener('change', updateSlots);
  }

  const setError = (container, message) => {
    if (!container) return;
    container.classList.toggle('is-invalid', Boolean(message));
    const err = $('.field__error', container);
    if (err) err.textContent = message || '';
  };

  function validateBooking() {
    const f = bookingForm.elements;
    const checks = [
      [f.name, f.name.value.trim().length >= 2, 'Please enter your name'],
      [f.phone, /^[0-9+()\-\s]{7,}$/.test(f.phone.value.trim()), 'Please enter a valid phone number'],
      [f.vehicle, f.vehicle.value.trim().length >= 2, 'Tell us which car you drive'],
      [f.service, Boolean(f.service.value), 'Choose a service'],
      [f.date, Boolean(f.date.value) && f.date.value >= isoDate(new Date()), 'Pick a date from today onwards'],
    ];
    let firstInvalid = null;
    checks.forEach(([input, ok, msg]) => {
      setError(input.closest('.field, .select-field'), ok ? '' : msg);
      if (!ok && !firstInvalid) firstInvalid = input;
    });
    const slotSet = $('.slots', bookingForm);
    const slotOk = Boolean($('input[name="time"]:checked', bookingForm));
    setError(slotSet, slotOk ? '' : 'Choose an available time');
    if (!slotOk && !firstInvalid) firstInvalid = $('input[name="time"]:not(:disabled)', bookingForm);
    return firstInvalid;
  }

  if (bookingForm) {
    bookingForm.addEventListener('input', (e) => {
      const box = e.target.closest('.field, .select-field, .slots');
      if (box && box.classList.contains('is-invalid')) setError(box, '');
    });
    bookingForm.addEventListener('change', (e) => {
      const box = e.target.closest('.select-field, .slots');
      if (box && box.classList.contains('is-invalid')) setError(box, '');
    });
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const invalid = validateBooking();
      if (invalid) { invalid.focus({ preventScroll: true }); return; }
      const f = bookingForm.elements;
      const time = $('input[name="time"]:checked', bookingForm).value;
      const date = new Date(`${f.date.value}T00:00:00`);
      const nice = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      const msg = [
        `Hello ${CONFIG.businessName}! I'd like to book:`,
        `• Service: ${f.service.value}`,
        `• Date: ${nice} at ${time}`,
        `• Vehicle: ${f.vehicle.value.trim()}`,
        f.size.value.trim() ? `• Tyre size: ${f.size.value.trim()}` : '',
        `• Name: ${f.name.value.trim()}`,
        `• Phone: ${f.phone.value.trim()}`,
        f.notes.value.trim() ? `• Notes: ${f.notes.value.trim()}` : '',
      ].filter(Boolean).join('\n');

      $('.booking-success__summary').textContent = `${f.service.value} on ${nice} at ${time}. Tap below to send your booking to our team on WhatsApp — we'll confirm your slot within minutes.`;
      $('.booking-success__wa').href = waLink(msg);
      bookingForm.hidden = true;
      bookingSuccess.hidden = false;
      bookingSuccess.focus({ preventScroll: true });
      if (canAnimate) gsap.from(bookingSuccess.children, { y: 24, opacity: 0, duration: .8, ease: 'expo.out', stagger: .08 });
      ScrollTrigger && ScrollTrigger.refresh();
    });
    $('.booking-success__again').addEventListener('click', () => {
      bookingForm.reset();
      updateSlots();
      bookingSuccess.hidden = true;
      bookingForm.hidden = false;
      ScrollTrigger && ScrollTrigger.refresh();
    });
  }

  /* ---------- WhatsApp links ---------- */
  $$('[data-whatsapp]').forEach((a) => { a.href = waLink(`Hi ${CONFIG.businessName}! I have a question about tyres.`); });

  /* ==========================================================================
     FAQ accordion
     ========================================================================== */
  $$('.accordion__item button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      $$('.accordion__item button').forEach((b) => {
        b.setAttribute('aria-expanded', 'false');
        document.getElementById(b.getAttribute('aria-controls')).classList.remove('is-open');
      });
      btn.setAttribute('aria-expanded', String(open));
      document.getElementById(btn.getAttribute('aria-controls')).classList.toggle('is-open', open);
      if (ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 650);
    });
  });

  /* ==========================================================================
     Reviews slider (native scroll-snap + buttons + mouse drag)
     ========================================================================== */
  const track = $('.slider__track');
  if (track) {
    const bar = $('.slider__progress');
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const ratio = track.clientWidth / track.scrollWidth;
      const p = max > 0 ? track.scrollLeft / max : 1;
      bar && bar.style.setProperty('--p', clamp(ratio + (1 - ratio) * p, 0, 1));
    };
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    $$('[data-slide]').forEach((b) => b.addEventListener('click', () => {
      const card = $('.review', track);
      const step = card ? card.getBoundingClientRect().width + 20 : 400;
      track.scrollBy({ left: step * Number(b.dataset.slide), behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') $('[data-slide="1"]').click();
      if (e.key === 'ArrowLeft') $('[data-slide="-1"]').click();
    });

    let down = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4 && !moved) { moved = true; track.classList.add('is-dragging'); }
      if (moved) track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (moved) {
        track.classList.remove('is-dragging');
        const card = $('.review', track);
        const step = card ? card.getBoundingClientRect().width + 20 : 400;
        track.scrollTo({ left: Math.round(track.scrollLeft / step) * step, behavior: 'smooth' });
      }
    });
  }

  /* ==========================================================================
     Pointer effects: custom cursor, magnetic buttons, card spotlight
     ========================================================================== */
  function initPointer() {
    if (!finePointer || !canAnimate) return;
    root.classList.add('has-cursor');
    const cursor = $('.cursor');
    const ring = $('.cursor__ring');
    const dot = $('.cursor__dot');
    const label = $('.cursor__label');
    const ringX = gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3.out' });
    const dotX = gsap.quickTo(dot, 'x', { duration: .08 });
    const dotY = gsap.quickTo(dot, 'y', { duration: .08 });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      cursor.classList.remove('is-hidden');
      ringX(e.clientX); ringY(e.clientY); dotX(e.clientX); dotY(e.clientY);
    }, { passive: true });
    root.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mouseover', (e) => {
      const labelled = e.target.closest('[data-cursor]');
      const interactive = e.target.closest('a, button, select, label, input, textarea, .chip');
      if (labelled && !e.target.closest('button, select, a:not([data-cursor])')) {
        label.textContent = labelled.dataset.cursor;
        cursor.classList.add('is-label');
        cursor.classList.remove('is-hover');
      } else {
        cursor.classList.remove('is-label');
        cursor.classList.toggle('is-hover', Boolean(interactive));
      }
    });

    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * .28);
        yTo((e.clientY - (r.top + r.height / 2)) * .38);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  $$('.service-card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ==========================================================================
     Boot
     ========================================================================== */
  root.classList.add('is-ready');
  initReveals();
  initCounters();
  initTyreSpin();
  initPointer();

  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), wait(2500)]);
  fontsReady.then(() => {
    initSplitHeadings();
    initStatement();
    initParallax();
    initProcess();
    initBands();
    moveIndicator();
    // Triggers were created out of page order; sort so ones below the pinned section account for its pin spacing.
    if (ScrollTrigger) { ScrollTrigger.sort(); ScrollTrigger.refresh(); }
  });

  runPreloader().then(heroIntro);
  window.addEventListener('load', () => ScrollTrigger && ScrollTrigger.refresh());
})();
