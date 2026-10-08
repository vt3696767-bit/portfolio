import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import { CustomEase } from 'gsap/CustomEase.js';

gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('portfolio-settle', '.22,1,.36,1');
CustomEase.create('portfolio-wipe', '.76,0,.24,1');

const OPEN_CLIP = 'inset(0% 0% 0% 0%)';
const CLOSED_CLIP = 'inset(0% 0% 100% 0%)';
const CLEAR_ENTRY = 'transform,clipPath,willChange';

export function createPortfolioMotion(root, openingPlayed = { current: false }) {
  const media = gsap.matchMedia();
  let opening = null;
  let scenes = [];
  let destroyed = false;

  try { media.add({
    desktop: '(min-width: 981px)',
    compact: '(max-width: 980px)',
    finePointer: '(pointer: fine)',
    reduced: '(prefers-reduced-motion: reduce)',
  }, context => {
    const { desktop, finePointer, reduced } = context.conditions;
    scenes = [];
    opening = null;
    const headingScenes = new Map();
    const promoted = new Set();
    let cancelled = false;
    let refreshFrame = 0;
    const initialY = window.scrollY;
    const select = selector => [...root.querySelectorAll(selector)];
    const own = (block, selector) => [...block.querySelectorAll(selector)]
      .filter(element => element.closest('[data-motion-block]') === block);
    const promote = (targets, value = 'transform, clip-path') => {
      targets.forEach(element => { element.style.willChange = value; promoted.add(element); });
    };

    if (reduced) {
      openingPlayed.current = true;
      root.dataset.motion = 'reduced';
      root.dataset.opening = 'complete';
      return () => { delete root.dataset.motion; delete root.dataset.opening; };
    }

    root.dataset.motion = 'active';

    // Gates reposition existing, context-owned timelines; scroll callbacks create no new tweens.
    const prepareScene = (trigger, block, targets, build, lane = 0, isHeading = false) => {
      if (!targets.length) return null;
      const gate = gsap.timeline({ paused: true });
      const timeline = gsap.timeline({ defaults: { duration: 1.55, ease: 'portfolio-settle' } });
      gate.add(timeline, 0);
      build(timeline);
      timeline.set(targets, { clearProps: CLEAR_ENTRY });
      gate.eventCallback('onStart', () => promote(targets));
      const record = { trigger, block, targets, gate, timeline, isHeading, started: false };
      scenes.push(record);
      const play = () => {
        if (record.started || gate.progress() === 1) return;
        record.started = true;
        const heading = headingScenes.get(block);
        let wait = 0;
        if (!isHeading && heading && heading.gate.progress() < 1) {
          if (!heading.started) {
            heading.started = true;
            heading.gate.play();
          }
          wait = Math.max(0, heading.gate.totalDuration() - heading.gate.time());
        }
        gate.add(timeline, wait + lane);
        gate.play(0);
      };
      ScrollTrigger.create({
        trigger,
        start: isHeading ? 'top 86%' : 'top 91%',
        once: true,
        onEnter: play,
        onEnterBack: play,
      });
      if (trigger.getBoundingClientRect().top < -40) gate.progress(1);
      return record;
    };

    select('[data-motion-block]').forEach(block => {
      const masthead = own(block, '.section-masthead')[0];
      if (!masthead) return;
      const words = [...masthead.querySelectorAll('.masthead-word')];
      const heading = prepareScene(masthead, block, words, timeline => {
        timeline.fromTo(words, {
          yPercent: 145, xPercent: -12, scaleX: .64, scaleY: .72, skewY: 7,
          transformOrigin: '0% 100%',
        }, {
          yPercent: 0, xPercent: 0, scaleX: 1, scaleY: 1, skewY: 0,
          duration: desktop ? 1.85 : 1.55, stagger: .17,
        });
      }, 0, true);
      headingScenes.set(block, heading);
    });

    select('[data-motion-copy]').forEach(trigger => {
      const block = trigger.closest('[data-motion-block]');
      const lines = [...trigger.querySelectorAll('.heading-line')];
      const rows = [...trigger.querySelectorAll('[data-copy-row]')];
      prepareScene(trigger, block, [...lines, ...rows], timeline => {
        if (lines.length) timeline.fromTo(lines, {
          yPercent: 125, scaleY: .7, skewY: 5, transformOrigin: '0% 100%',
        }, { yPercent: 0, scaleY: 1, skewY: 0, stagger: .13 }, 0);
        if (rows.length) timeline.fromTo(rows, {
          y: desktop ? 60 : 35, clipPath: CLOSED_CLIP,
        }, { y: 0, clipPath: OPEN_CLIP, stagger: .12, duration: 1.35 }, .38);
      });
    });

    select('[data-motion-portrait]').forEach(trigger => {
      const photo = trigger.querySelector('.portrait-photo');
      if (!photo) return;
      prepareScene(trigger, trigger.closest('[data-motion-block]'), [photo], timeline => {
        timeline.fromTo(photo, {
          y: 95, rotation: -9, scale: 1.09, clipPath: 'inset(0% 100% 0% 0%)',
        }, { y: 0, rotation: -3, scale: 1, clipPath: OPEN_CLIP, duration: 1.8, ease: 'portfolio-wipe' });
      });
    });

    select('[data-motion-trigger]').forEach(trigger => {
      const card = trigger.querySelector('[data-motion-card], .experience-card');
      if (!card) return;
      const block = trigger.closest('[data-motion-block]');
      const columns = window.innerWidth <= 720 ? 1
        : Number(desktop ? block.dataset.columns : block.dataset.tabletColumns || block.dataset.columns) || 1;
      const order = Number(trigger.dataset.motionOrder) || 0;
      const lane = (order % columns) * .19;
      const image = card.querySelector('.project-image');
      const caption = card.querySelector('.project-caption');
      const targets = [card, image, caption].filter(Boolean);
      prepareScene(trigger, block, targets, timeline => {
        timeline.fromTo(card, {
          y: desktop ? 125 : 65, x: desktop ? (order % 2 ? 22 : -22) : 0,
          scale: .91, rotation: desktop ? (order % 2 ? 1.4 : -1.4) : 0,
          clipPath: image ? OPEN_CLIP : CLOSED_CLIP,
          transformOrigin: '50% 100%',
        }, { y: 0, x: 0, scale: 1, rotation: 0, clipPath: OPEN_CLIP, duration: 1.7 }, 0);
        if (image) timeline.fromTo(image, { clipPath: CLOSED_CLIP }, {
          clipPath: OPEN_CLIP, duration: 1.55, ease: 'portfolio-wipe',
        }, .1);
        if (caption) timeline.fromTo(caption, { y: 36, clipPath: CLOSED_CLIP }, {
          y: 0, clipPath: OPEN_CLIP, duration: 1.3,
        }, .4);
      }, lane);
    });

    select('[data-motion-row]').forEach(trigger => {
      const targets = [...trigger.children].filter(element => getComputedStyle(element).display !== 'none');
      prepareScene(trigger, trigger.closest('[data-motion-block]'), targets, timeline => {
        timeline.fromTo(targets, { y: 65, scaleY: .8, clipPath: CLOSED_CLIP }, {
          y: 0, scaleY: 1, clipPath: OPEN_CLIP, stagger: .16, duration: 1.4,
        });
      });
    });

    if (desktop && finePointer) {
      const parallax = (target, trigger, amount) => {
        if (!target) return;
        gsap.fromTo(target, { yPercent: -amount }, {
          yPercent: amount, ease: 'none',
          scrollTrigger: {
            trigger, start: 'top bottom', end: 'bottom top', scrub: 1.25,
            onToggle: self => {
              target.style.willChange = self.isActive ? 'transform' : '';
              promoted.add(target);
            },
          },
        });
      };
      select('.project-visual').forEach(target => parallax(target, target.closest('.project-unit'), 3.2));
      parallax(root.querySelector('.hero-media'), root.querySelector('#home'), 3);
    }

    const curtain = root.querySelector('.opening-curtain');
    const hero = root.querySelector('#home');
    const playOpening = hero && curtain && initialY < 30
      && (!window.location.hash || window.location.hash === '#home') && !openingPlayed.current;
    if (playOpening) {
      const words = [...hero.querySelectorAll('.hero-heading .heading-line')];
      const header = select('.header-inner .brand, .desktop-nav a, .header-contact');
      const details = select('.hero-eyebrow, .hero-intro, .hero-cta, .hero-bottom, .hero-period');
      const poster = hero.querySelector('.hero-poster');
      const targets = [...words, ...header, ...details, poster, curtain].filter(Boolean);
      gsap.set(curtain, { display: 'grid', yPercent: 0 });
      opening = gsap.timeline({
        defaults: { ease: 'portfolio-settle' },
        onStart: () => { root.dataset.opening = 'playing'; promote(targets); },
        onComplete: () => {
          openingPlayed.current = true;
          root.dataset.opening = 'complete';
          window.removeEventListener('scroll', onOpeningScroll);
        },
      });
      opening.fromTo('.opening-mark', { yPercent: 125, scaleY: .65 }, { yPercent: 0, scaleY: 1, duration: 1.05 }, 0)
        .fromTo('.opening-caption', { yPercent: 130 }, { yPercent: 0, duration: .95 }, .16)
        .to(curtain, { yPercent: -102, duration: 1.3, ease: 'portfolio-wipe' }, .85)
        .fromTo(poster, { scale: 1.16 }, { scale: 1, duration: 2.35 }, .95)
        .fromTo(words, {
          yPercent: 138, xPercent: -8, scaleX: .72, scaleY: .55, skewY: 8, transformOrigin: '0% 100%',
        }, {
          yPercent: 0, xPercent: 0, scaleX: 1, scaleY: 1, skewY: 0, duration: 1.95, stagger: .18,
        }, 1.85)
        .fromTo(header, { y: -50, clipPath: CLOSED_CLIP }, { y: 0, clipPath: OPEN_CLIP, duration: 1.3, stagger: .07 }, 1.98)
        .fromTo(details, { y: 48, clipPath: CLOSED_CLIP }, { y: 0, clipPath: OPEN_CLIP, duration: 1.25, stagger: .11 }, 2.35)
        .set(targets.filter(target => target !== curtain), { clearProps: CLEAR_ENTRY })
        .set(curtain, { clearProps: 'all' });
    } else {
      openingPlayed.current = true;
      root.dataset.opening = 'complete';
    }

    function finishOpening() {
      if (opening && opening.progress() < 1) opening.progress(1);
    }
    function finishPassed() {
      scenes.forEach(scene => {
        if (scene.trigger.getBoundingClientRect().top < -40) scene.gate.progress(1);
      });
    }
    function scheduleRefresh() {
      if (cancelled || refreshFrame) return;
      refreshFrame = requestAnimationFrame(() => {
        refreshFrame = 0;
        if (cancelled) return;
        ScrollTrigger.refresh();
        finishPassed();
      });
    }
    function onOpeningScroll() { if (window.scrollY > 35) finishOpening(); }
    const onFocus = event => {
      finishOpening();
      const block = event.target.closest?.('[data-motion-block]');
      headingScenes.get(block)?.gate.progress(1);
      scenes.forEach(scene => { if (scene.trigger.contains(event.target)) scene.gate.progress(1); });
    };
    root.addEventListener('focusin', onFocus);
    if (opening) window.addEventListener('scroll', onOpeningScroll, { passive: true });
    // Image dimensions are reserved in the layout; only font changes require a refresh.
    document.fonts?.ready.then(scheduleRefresh);
    scheduleRefresh();

    return () => {
      cancelled = true;
      cancelAnimationFrame(refreshFrame);
      root.removeEventListener('focusin', onFocus);
      window.removeEventListener('scroll', onOpeningScroll);
      promoted.forEach(element => element.style.removeProperty('will-change'));
      delete root.dataset.motion;
      delete root.dataset.opening;
    };
  }, root); } catch (error) {
    media.revert();
    delete root.dataset.motion;
    delete root.dataset.opening;
    throw error;
  }

  return {
    get opening() { return opening; },
    get scenes() { return scenes; },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      media.revert();
      scenes = [];
      opening = null;
    },
  };
}
