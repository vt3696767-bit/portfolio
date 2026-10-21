import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { backgroundMusic, profile, projects } from '../src/content.js';

test('the gallery entry point does not import a GPU background', () => {
  const source = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /from ['"][^'"]*AeroShards|import\(['"][^'"]*AeroShards/);
  assert.doesNotMatch(source, /<ContentBackground\b|<AeroShards\b/);
});

test('hero preload selects the same responsive image as the page', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const preload = html.match(/<link rel="preload" as="image"[^>]+>/)?.[0];
  assert.ok(preload);
  assert.ok(preload.includes(`href="${profile.heroPoster}"`));
  assert.ok(preload.includes(`imagesrcset="${profile.heroPosterSrcSet}"`));
  assert.ok(preload.includes(`imagesizes="${profile.heroPosterSizes}"`));
});

// These are DOM/lifecycle contracts, not browser frame-rate measurements.
const browser = new Window({ url: 'http://127.0.0.1:5173/' });
browser.happyDOM.setWindowSize({ width: 1440, height: 900 });
let reduced = false;
browser.matchMedia = query => ({ media: query, get matches() {
  if (query.includes('prefers-reduced-motion')) return reduced;
  return query.includes('min-width') || query.includes('pointer: fine');
}, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
class Observer {
  static all = [];
  constructor(callback) { this.callback = callback; this.targets = new Set(); Observer.all.push(this); }
  observe(target) { this.targets.add(target); }
  disconnect() { this.targets.clear(); }
  emit(target, visible, ratio = visible ? 1 : 0) { this.callback([{ target, isIntersecting: visible, intersectionRatio: ratio, boundingClientRect: { top: visible ? 60 : -20 } }]); }
}
let clock = 0;
let frameId = 0;
const frames = new Map();
const nativePerformance = globalThis.performance;
const virtualPerformance = new Proxy(nativePerformance, {
  get(target, key) {
    if (key === 'now') return () => clock;
    const value = Reflect.get(target, key, target);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});
Object.assign(globalThis, {
  window: browser, document: browser.document, Node: browser.Node, Element: browser.Element,
  HTMLElement: browser.HTMLElement, SVGElement: browser.SVGElement,
  IntersectionObserver: Observer, ResizeObserver: Observer,
  getComputedStyle: browser.getComputedStyle.bind(browser), IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: callback => { const id = ++frameId; frames.set(id, callback); return id; },
  cancelAnimationFrame: id => frames.delete(id),
});
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: browser.navigator });
const drawing = { contexts: 0, clears: 0, dots: 0, colorChanges: 0 };
const context = { clearRect() { drawing.clears++; }, fillRect() { drawing.dots++; }, set fillStyle(value) { drawing.colorChanges++; } };
browser.HTMLCanvasElement.prototype.getContext = () => { drawing.contexts++; return context; };
Object.defineProperty(browser.HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 500 });
Object.defineProperty(browser.HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 310 });
const mediaCalls = [];
browser.HTMLMediaElement.prototype.play = function () { mediaCalls.push(`${this.tagName.toLowerCase()}:play`); return Promise.resolve(); };
browser.HTMLMediaElement.prototype.pause = function () { mediaCalls.push(`${this.tagName.toLowerCase()}:pause`); };
browser.HTMLMediaElement.prototype.load = () => {};
const { createServer } = await import('vite');
const { createElement, act } = await import('react');
const { createRoot } = await import('react-dom/client');
const server = await createServer({ cacheDir: '../.local/performance-audit/test-vite-cache', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
const { default: PixelCard } = await server.ssrLoadModule('/src/components/PixelCard/PixelCard.jsx');
function emitVisibility(target, visible) {
  for (const observer of Observer.all) if (observer.targets.has(target)) observer.emit(target, visible);
}
function advanceFrame(delta) {
  clock += delta;
  const queued = [...frames.values()];
  frames.clear();
  queued.forEach(callback => callback(clock));
}

test('pixel cards allocate only on entering view and pause when offscreen', async t => {
  globalThis.performance = virtualPerformance;
  browser.document.body.innerHTML = '<div id="root"></div>';
  const root = createRoot(browser.document.getElementById('root'));
  t.after(async () => { await act(async () => root.unmount()); globalThis.performance = nativePerformance; });
  await act(async () => root.render(createElement(PixelCard, { variant: 'yellow', gap: 6 }, 'Experience')));
  assert.equal(drawing.contexts, 0);
  const card = browser.document.querySelector('.pixel-card');
  await act(async () => emitVisibility(card, true));
  assert.ok(drawing.contexts > 0);
  advanceFrame(0);
  await act(async () => card.dispatchEvent(new browser.MouseEvent('mouseover', { bubbles: true })));
  drawing.clears = drawing.dots = drawing.colorChanges = 0;
  advanceFrame(0);
  const initialClears = drawing.clears;
  advanceFrame(16);
  assert.equal(drawing.clears, initialClears);
  advanceFrame(18);
  assert.equal(drawing.clears, initialClears + 1);
  for (let index = 0; index < 12; index++) advanceFrame(34);
  assert.ok(drawing.dots > 0);
  assert.ok(drawing.dots <= drawing.clears * 3000);
  assert.ok(drawing.colorChanges <= drawing.clears * 3);
  emitVisibility(card, false);
  assert.equal(frames.size, 0);
});

test('navigation threshold is observed and the gallery has no videos before selection', async t => {
  reduced = true;
  browser.document.body.innerHTML = '<div id="root"></div>';
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const root = createRoot(browser.document.getElementById('root'));
  t.after(async () => { await act(async () => root.unmount()); });
  await act(async () => root.render(createElement(App)));
  assert.equal(browser.document.querySelectorAll('.project-card').length, 8);
  assert.equal(browser.document.querySelectorAll('.project-grid').length, 2);
  assert.equal(browser.document.querySelector('.project-grid[aria-label="完整短片"]').querySelectorAll('.project-card').length, 4);
  assert.equal(browser.document.querySelector('.project-grid[aria-labelledby="clips-title"]').querySelectorAll('.project-card').length, 4);
  assert.match(browser.document.querySelector('.work-footnote').textContent, /08 SELECTED WORKS \/ 04 FILMS \+ 04 CLIPS/);
  assert.deepEqual([...browser.document.querySelectorAll('.stats > div > p')].slice(0, 3).map(element => element.firstChild.textContent), ['07', '04', '03']);
  for (const [index, card] of [...browser.document.querySelectorAll('.project-card')].entries()) {
    const project = projects[index];
    const cover = card.querySelector('img');
    assert.equal(cover.getAttribute('src'), project.image);
    assert.equal(cover.getAttribute('loading'), 'lazy');
    assert.equal(cover.getAttribute('width'), String(project.imageWidth));
    assert.equal(cover.getAttribute('height'), String(project.imageHeight));
    assert.match(card.querySelector('.cover-note').textContent, project.kind === 'clip' ? /VISUAL CLIP$/ : /FULL FILM$/);
    assert.match(card.querySelector('.project-top').textContent, project.kind === 'clip' ? /^CLIP \/ / : /^FILM \/ /);
  }
  assert.equal(browser.document.querySelectorAll('video').length, 0);
  assert.deepEqual([...browser.document.querySelectorAll('main section[id]')].map(section => section.id), ['home', 'work', 'about', 'approach', 'contact']);
  const audio = browser.document.querySelector('.music-player audio');
  assert.equal(audio.getAttribute('src'), null);
  assert.equal(audio.preload, 'none');
  assert.equal(browser.document.querySelector('.music-toggle').getAttribute('aria-pressed'), 'false');
  const marker = browser.document.querySelector('.header-scroll-marker');
  await act(async () => emitVisibility(marker, false));
  assert.ok(browser.document.querySelector('.site-header').classList.contains('is-scrolled'));
  await act(async () => emitVisibility(marker, true));
  assert.ok(!browser.document.querySelector('.site-header').classList.contains('is-scrolled'));
  assert.equal(browser.document.querySelector('.content-background'), null);
  assert.equal(browser.document.querySelector('.aero-shards'), null);
  const ornaments = [...browser.document.querySelectorAll('.gallery-ornament')];
  assert.ok(ornaments.length >= 2);
  ornaments.forEach(ornament => {
    assert.equal(ornament.tagName.toLowerCase(), 'svg');
    assert.equal(ornament.getAttribute('aria-hidden'), 'true');
    assert.equal(ornament.getAttribute('data-renderer'), 'static-svg');
  });
  const hero = browser.document.querySelector('.hero-poster');
  assert.equal(hero.getAttribute('srcset'), profile.heroPosterSrcSet);
  assert.equal(hero.getAttribute('sizes'), profile.heroPosterSizes);
  assert.equal(hero.getAttribute('fetchpriority'), 'high');
  assert.ok(browser.document.querySelector('.hero-arch').contains(hero));
  assert.equal(browser.document.querySelector('h1').textContent, profile.name);
  assert.equal(browser.document.querySelectorAll('h1').length, 1);
  await act(async () => browser.document.querySelector('.music-toggle').click());
  assert.equal(audio.getAttribute('src'), backgroundMusic.src);
  assert.equal(audio.volume, 0.3);
  assert.equal(browser.document.querySelector('.music-toggle').getAttribute('aria-pressed'), 'true');
  await act(async () => browser.document.querySelector('.music-volume-button').click());
  assert.ok(browser.document.querySelector('.music-settings input[type="range"]'));
  await act(async () => browser.document.querySelector('.music-settings-close').click());
  assert.equal(browser.document.querySelector('.music-settings'), null);
  for (const [index, card] of [...browser.document.querySelectorAll('.project-card')].entries()) {
    mediaCalls.length = 0;
    await act(async () => card.click());
    const video = browser.document.querySelector('video');
    assert.equal(video.getAttribute('src'), projects[index].video);
    assert.equal(video.getAttribute('poster'), projects[index].image);
    assert.equal(video.getAttribute('aria-label'), `《${projects[index].title}》${projects[index].kind === 'clip' ? '影像片段' : '完整短片'}`);
    assert.match(browser.document.querySelector('.dialog-film-meta').textContent, projects[index].kind === 'clip' ? /^CLIP / : /^FILM /);
    assert.equal(browser.document.querySelector('.music-toggle').getAttribute('aria-pressed'), 'false');
    assert.ok(mediaCalls.indexOf('audio:pause') < mediaCalls.indexOf('video:play'));
    await act(async () => browser.document.querySelector('.dialog-close').click());
    assert.equal(video.getAttribute('src'), null);
    assert.equal(browser.document.querySelectorAll('video').length, 0);
    assert.equal(browser.document.querySelector('.music-toggle').getAttribute('aria-pressed'), index === 0 ? 'true' : 'false');
    if (index === 0) await act(async () => browser.document.querySelector('.music-toggle').click());
  }
  // The arch is a ninth route to the same existing film, not a second video download.
  const featured = projects.find(project => project.id === 'western-fantasy');
  await act(async () => browser.document.querySelector('.music-toggle').click());
  mediaCalls.length = 0;
  await act(async () => browser.document.querySelector('.hero-art-play').click());
  const featuredVideo = browser.document.querySelector('video');
  assert.equal(featuredVideo.getAttribute('src'), featured.video);
  assert.ok(mediaCalls.indexOf('audio:pause') < mediaCalls.indexOf('video:play'));
  assert.equal(browser.document.querySelector('.music-toggle').getAttribute('aria-pressed'), 'false');
  await act(async () => browser.document.querySelector('.dialog-close').click());
  assert.equal(featuredVideo.getAttribute('src'), null);
  assert.equal(browser.document.querySelectorAll('video').length, 0);
  assert.equal(browser.document.querySelector('.music-toggle').getAttribute('aria-pressed'), 'true');
});

test('decorative backgrounds remain static even when WebGPU is supported and sections enter view', async t => {
  reduced = false;
  let gpuRequests = 0;
  Object.defineProperty(browser.navigator, 'gpu', { configurable: true, value: { requestAdapter() { gpuRequests++; return Promise.resolve(null); } } });
  browser.document.body.innerHTML = '<div id="root"></div>';
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const root = createRoot(browser.document.getElementById('root'));
  t.after(async () => { await act(async () => root.unmount()); delete browser.navigator.gpu; });
  await act(async () => root.render(createElement(App)));
  const ornaments = [...browser.document.querySelectorAll('.gallery-ornament')];
  assert.ok(ornaments.length >= 2);
  await act(async () => {
    for (const observer of Observer.all) for (const target of observer.targets) observer.emit(target, true, 1);
    await new Promise(resolve => setTimeout(resolve, 120));
  });
  assert.equal(gpuRequests, 0);
  assert.equal(browser.document.querySelector('.aero-shards'), null);
  ornaments.forEach(ornament => assert.equal(ornament.querySelector('canvas, animate, animateTransform'), null));
});

after(async () => {
  globalThis.performance = nativePerformance;
  const { ScrollTrigger } = await import('gsap/ScrollTrigger.js');
  const { gsap } = await import('gsap');
  ScrollTrigger.disable();
  gsap.ticker.sleep();
  await server.close();
  await browser.happyDOM.abort();
  browser.close();
});
