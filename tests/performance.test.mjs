import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { FRAME_STATES, resolveRenderDpr, resolveCanvasSize } from '../src/components/AeroShards/renderBudget.js';
import { backgroundMusic, profile, projects } from '../src/content.js';

test('background stays within its pixel budget on standard, retina and 4K displays', () => {
  const preset = { dpr: 2, supersamplePixels: 6_000_000 };
  for (const [width, height, deviceDpr] of [[1920, 1080, 1], [1920, 1080, 2], [3840, 2160, 2], [7680, 4320, 3], [500, 700, 3]]) {
    const dpr = resolveRenderDpr(preset, width, height, deviceDpr);
    const [x, y] = resolveCanvasSize(width, height, dpr);
    assert.ok(x * y <= 2_500_000);
    assert.ok(dpr <= Math.min(deviceDpr, 1.25));
    assert.ok(x > 0 && y > 0);
  }
  assert.equal(FRAME_STATES.ambient.continuous, false);
  assert.equal(FRAME_STATES.ambient.interval, 1000 / 30);
  assert.equal(FRAME_STATES.interactive.interval, 1000 / 60);
});

test('hero preload selects the same responsive image as the page', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const preload = html.match(/<link rel="preload" as="image"[^>]+>/)?.[0];
  assert.ok(preload);
  assert.ok(preload.includes(`href="${profile.heroPoster}"`));
  assert.ok(preload.includes(`imagesrcset="${profile.heroPosterSrcSet}"`));
  assert.ok(preload.includes('imagesizes="100vw"'));
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
  assert.equal(browser.document.querySelectorAll('.project-card').length, 4);
  assert.equal(browser.document.querySelectorAll('video').length, 0);
  const audio = browser.document.querySelector('.music-player audio');
  assert.equal(audio.getAttribute('src'), null);
  assert.equal(audio.preload, 'none');
  assert.equal(browser.document.querySelector('.music-toggle').getAttribute('aria-pressed'), 'false');
  const marker = browser.document.querySelector('.header-scroll-marker');
  await act(async () => emitVisibility(marker, false));
  assert.ok(browser.document.querySelector('.site-header').classList.contains('is-scrolled'));
  await act(async () => emitVisibility(marker, true));
  assert.ok(!browser.document.querySelector('.site-header').classList.contains('is-scrolled'));
  assert.equal(browser.document.querySelector('.content-background').dataset.renderer, 'fallback');
  const hero = browser.document.querySelector('.hero-poster');
  assert.equal(hero.getAttribute('srcset'), profile.heroPosterSrcSet);
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
    assert.equal(browser.document.querySelector('.music-toggle').getAttribute('aria-pressed'), 'false');
    assert.ok(mediaCalls.indexOf('audio:pause') < mediaCalls.indexOf('video:play'));
    await act(async () => browser.document.querySelector('.dialog-close').click());
    assert.equal(video.getAttribute('src'), null);
    assert.equal(browser.document.querySelectorAll('video').length, 0);
    assert.equal(browser.document.querySelector('.music-toggle').getAttribute('aria-pressed'), index === 0 ? 'true' : 'false');
    if (index === 0) await act(async () => browser.document.querySelector('.music-toggle').click());
  }
});

test('a background touching the viewport edge does not initialize WebGPU', async t => {
  reduced = false;
  Object.defineProperty(browser.navigator, 'gpu', { configurable: true, value: {} });
  browser.document.body.innerHTML = '<div id="root"></div>';
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const root = createRoot(browser.document.getElementById('root'));
  t.after(async () => { await act(async () => root.unmount()); delete browser.navigator.gpu; });
  await act(async () => root.render(createElement(App)));
  const background = browser.document.querySelector('.content-background');
  await act(async () => {
    for (const observer of Observer.all) if (observer.targets.has(background)) observer.emit(background, true, 0);
    await new Promise(resolve => setTimeout(resolve, 120));
  });
  assert.equal(background.dataset.renderer, 'pending');
  assert.equal(background.querySelector('.aero-shards'), null);
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
