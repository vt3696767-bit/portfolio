import assert from 'node:assert/strict';
import { after, afterEach, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { Window } from 'happy-dom';

// A synthetic DOM checks lifecycle and interaction behavior; it is not a visual browser test.
const browser = new Window({ url: 'http://localhost/' });
browser.happyDOM.setWindowSize({ width: 1440, height: 900 });
let reduced = false;
browser.matchMedia = query => ({
  media: query,
  get matches() {
    if (query.includes('prefers-reduced-motion')) return reduced;
    if (query.includes('pointer: fine')) return true;
    return query.includes('min-width') ? browser.innerWidth >= 981 : browser.innerWidth < 981;
  },
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
});
Object.assign(globalThis, {
  window: browser, document: browser.document,
  Node: browser.Node, Element: browser.Element, HTMLElement: browser.HTMLElement, SVGElement: browser.SVGElement,
  getComputedStyle: browser.getComputedStyle.bind(browser),
  requestAnimationFrame: browser.requestAnimationFrame.bind(browser),
  cancelAnimationFrame: browser.cancelAnimationFrame.bind(browser),
});
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: browser.navigator });
Object.defineProperty(browser.document.documentElement, 'scrollHeight', { configurable: true, value: 7200 });
Object.defineProperty(browser.document.body, 'scrollHeight', { configurable: true, value: 7200 });
browser.document.head.innerHTML = '<style>.opening-curtain { display: none; }</style>';
browser.history.scrollRestoration = 'manual';
const { createPortfolioMotion } = await import('../src/motion/createPortfolioMotion.js');
const { ScrollTrigger } = await import('gsap/ScrollTrigger.js');
const { gsap } = await import('gsap');

function fixture(hash = '', scrollY = 0) {
  browser.location.hash = hash;
  browser.scrollTo(0, scrollY);
  browser.document.body.innerHTML = `<div id="fixture">
    <header><div class="header-inner"><a class="brand" href="#home">S.</a><nav class="desktop-nav"><a href="#chapter">About</a></nav><a class="header-contact" href="#chapter">Contact</a></div></header>
    <section id="home" data-top="0" data-height="900">
      <div class="opening-curtain"><span class="opening-mark">S.</span><span class="opening-caption">SHENG YONGJIE</span></div>
      <div class="hero-media"><img class="hero-poster" /></div>
      <h1 class="hero-heading"><span class="heading-mask"><span class="heading-line">让想象，</span></span><span class="heading-mask"><span class="heading-line">成为画面。</span></span></h1>
      <p class="hero-eyebrow">AI FILM</p><p class="hero-intro">Intro</p><a class="hero-cta">Work</a><div class="hero-bottom">Roles</div><span class="hero-period">✳</span>
    </section>
    <section id="chapter" data-motion-block data-columns="3" data-top="2400" data-height="1400">
      <div class="section-masthead" data-top="2500"><span class="masthead-mask"><span class="masthead-word">MY</span></span><span class="masthead-mask"><span class="masthead-word">JOURNEY</span></span></div>
      <div data-motion-copy data-top="2700"><h2><span class="heading-line">Title</span></h2><p data-copy-row>Copy</p></div>
      <div data-motion-portrait data-top="2700"><figure class="portrait-photo">Photo</figure></div>
      <div data-motion-trigger data-motion-order="0" data-top="3000"><div class="experience-card" tabindex="0" style="--pixel-card-variant-color:#fef08a">Experience</div></div>
      <div class="project-unit" data-motion-trigger data-motion-order="1" data-top="3000"><button data-motion-card><div class="project-image"><div class="project-visual"><img /></div></div><div class="project-caption">Project</div></button></div>
      <div data-motion-row data-top="3400"><span>06</span><span>03</span></div>
    </section>
  </div>`;
  const root = browser.document.getElementById('fixture');
  root.querySelectorAll('*').forEach(element => {
    const positioned = element.closest('[data-top]');
    const top = Number(positioned?.dataset.top) || 0;
    const height = Number(positioned?.dataset.height) || 220;
    element.getBoundingClientRect = () => ({
      top: top - browser.scrollY, bottom: top + height - browser.scrollY,
      left: 0, right: 600, width: 600, height, x: 0, y: top - browser.scrollY,
    });
  });
  return root;
}

test('opening is a multi-stage sequence and keyboard focus exposes content immediately', t => {
  reduced = false;
  const root = fixture();
  const motion = createPortfolioMotion(root);
  t.after(() => motion.destroy());
  assert.ok(motion.opening.duration() >= 3.4);
  assert.equal(root.querySelector('.opening-curtain').style.display, 'grid');
  root.querySelector('.brand').dispatchEvent(new browser.FocusEvent('focusin', { bubbles: true }));
  assert.equal(motion.opening.progress(), 1);
  assert.equal(browser.getComputedStyle(root.querySelector('.opening-curtain')).display, 'none');
  motion.destroy();
  assert.equal(ScrollTrigger.getAll().length, 0);
});

test('reinitializing motion during chapter navigation does not replay the opening', t => {
  for (const [hash, scrollY] of [['#chapter', 0], ['', 1200]]) {
    const root = fixture(hash, scrollY);
    const motion = createPortfolioMotion(root);
    t.after(() => motion.destroy());
    assert.equal(motion.opening, null);
    assert.equal(browser.getComputedStyle(root.querySelector('.opening-curtain')).display, 'none');
    motion.destroy();
  }
});

test('startup returns to the hero while later navigation and image loads preserve user scrolling', async t => {
  const root = fixture('#chapter', 1900);
  browser.history.replaceState({ session: 'preserve' }, '', '/portfolio?lang=zh#chapter');
  const entries = browser.history.length;
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const startup = html.match(/<script id="initial-scroll">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(startup);
  runInNewContext(startup, { window: browser });
  assert.equal(browser.scrollY, 0);
  assert.equal(browser.scrollX, 0);
  assert.equal(browser.location.hash, '');
  assert.equal(browser.location.pathname + browser.location.search, '/portfolio?lang=zh');
  assert.equal(browser.history.length, entries);
  assert.deepEqual(browser.history.state, { session: 'preserve' });
  const motion = createPortfolioMotion(root);
  t.after(() => { motion.destroy(); browser.history.replaceState(null, '', '/'); });
  assert.ok(motion.opening);

  root.querySelector('.brand').dispatchEvent(new browser.FocusEvent('focusin', { bubbles: true }));
  browser.location.hash = '#chapter';
  browser.scrollTo(0, 1800);
  root.querySelector('img').dispatchEvent(new browser.Event('load'));
  await new Promise(resolve => browser.requestAnimationFrame(resolve));
  assert.equal(browser.scrollY, 1800);
  assert.equal(browser.location.hash, '#chapter');
  // A late initial pageshow must not undo navigation made while assets were loading.
  browser.dispatchEvent(new browser.Event('pageshow'));
  assert.equal(browser.scrollY, 1800);
  const restored = new browser.Event('pageshow');
  Object.defineProperty(restored, 'persisted', { value: true });
  browser.dispatchEvent(restored);
  assert.equal(browser.scrollY, 0);
  assert.equal(browser.location.hash, '');
  assert.equal(browser.history.scrollRestoration, 'manual');
});

test('reduced motion preserves readable content and creates no scroll animations', t => {
  reduced = true;
  const root = fixture();
  const motion = createPortfolioMotion(root);
  t.after(() => motion.destroy());
  assert.equal(root.dataset.motion, 'reduced');
  assert.equal(motion.opening, null);
  assert.equal(motion.scenes.length, 0);
  assert.equal(ScrollTrigger.getAll().length, 0);
  assert.equal(root.querySelector('.masthead-word').style.transform, '');
  motion.destroy();
  reduced = false;
});

test('focus completes a masked card and its heading, including PixelCard wrappers', t => {
  const root = fixture('#chapter', 0);
  const motion = createPortfolioMotion(root);
  t.after(() => motion.destroy());
  const card = root.querySelector('.experience-card');
  assert.ok(motion.scenes.some(scene => scene.targets.includes(card)));
  card.dispatchEvent(new browser.FocusEvent('focusin', { bubbles: true }));
  const cardScene = motion.scenes.find(scene => scene.targets.includes(card));
  const headingScene = motion.scenes.find(scene => scene.isHeading);
  assert.equal(cardScene.gate.progress(), 1);
  assert.equal(headingScene.gate.progress(), 1);
  assert.equal(card.style.clipPath, '');
  motion.destroy();
  assert.equal(card.style.getPropertyValue('--pixel-card-variant-color'), '#fef08a');
});

test('large headings lead staggered cards and repeated entry does not restart the sequence', t => {
  const root = fixture('#chapter', 0);
  const motion = createPortfolioMotion(root);
  t.after(() => motion.destroy());
  const heading = motion.scenes.find(scene => scene.isHeading);
  const cards = motion.scenes.filter(scene => scene.targets.some(element => element.matches('.experience-card, [data-motion-card]')));
  const enter = scene => {
    const trigger = ScrollTrigger.getAll().find(item => item.vars.trigger === scene.trigger);
    assert.ok(trigger);
    trigger.vars.onEnter(trigger);
  };
  enter(cards[0]);
  enter(cards[1]);
  assert.ok(heading.started);
  assert.ok(cards[0].timeline.startTime() >= heading.gate.duration() - .02);
  assert.ok(cards[1].timeline.startTime() > cards[0].timeline.startTime() + .15);
  heading.gate.time(.5);
  enter(heading);
  assert.ok(heading.gate.time() >= .5);
  cards[0].gate.time(.3);
  enter(cards[0]);
  assert.ok(cards[0].gate.time() >= .3);
});

test('changing motion preference reverts animations and restores static content', async t => {
  const root = fixture();
  const motion = createPortfolioMotion(root);
  t.after(() => motion.destroy());
  const count = ScrollTrigger.getAll().length;
  assert.ok(motion.opening);
  reduced = true;
  gsap.matchMediaRefresh();
  assert.equal(motion.opening, null);
  assert.equal(motion.scenes.length, 0);
  assert.equal(ScrollTrigger.getAll().length, 0);
  assert.equal(root.querySelector('.heading-line').style.transform, '');
  assert.equal(browser.getComputedStyle(root.querySelector('.opening-curtain')).display, 'none');
  // The synthetic RAF can run immediately; allow GSAP's 2 ms media debounce to elapse.
  await new Promise(resolve => setTimeout(resolve, 10));
  reduced = false;
  gsap.matchMediaRefresh();
  assert.equal(motion.opening, null);
  assert.equal(ScrollTrigger.getAll().length, count);
  assert.equal(root.dataset.opening, 'complete');
});

test('cleanup and reinitialization leave no duplicate triggers or hidden content', t => {
  const root = fixture();
  const motion = createPortfolioMotion(root);
  t.after(() => motion.destroy());
  const triggerCount = ScrollTrigger.getAll().length;
  assert.ok(triggerCount > 0);
  motion.destroy();
  motion.destroy();
  assert.equal(ScrollTrigger.getAll().length, 0);
  assert.equal(root.querySelector('.masthead-word').style.transform, '');
  assert.equal(root.querySelector('.masthead-word').style.willChange, '');
  const next = createPortfolioMotion(root);
  t.after(() => next.destroy());
  assert.equal(ScrollTrigger.getAll().length, triggerCount);
  next.destroy();
  assert.equal(ScrollTrigger.getAll().length, 0);
});

afterEach(() => { reduced = false; });

after(async () => {
  ScrollTrigger.disable();
  gsap.ticker.sleep();
  await browser.happyDOM.abort();
  browser.close();
});
