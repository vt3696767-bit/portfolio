import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, statSync } from 'node:fs';
import { backgroundMusic } from '../src/content.js';
import { createBackgroundMusic } from '../src/media/backgroundMusic.js';

function fixture(play = () => Promise.resolve()) {
  const owner = new EventTarget();
  owner.hidden = false;
  owner.defaultView = new EventTarget();
  const audio = new EventTarget();
  audio.ownerDocument = owner;
  audio.volume = 1;
  audio.paused = true;
  audio.plays = audio.pauses = audio.loads = 0;
  const attributes = new Map();
  audio.getAttribute = name => attributes.get(name) ?? null;
  audio.setAttribute = (name, value) => attributes.set(name, value);
  audio.removeAttribute = name => attributes.delete(name);
  audio.play = () => { audio.plays++; audio.paused = false; return play(); };
  audio.pause = () => { audio.pauses++; audio.paused = true; audio.dispatchEvent(new Event('pause')); };
  audio.load = () => { audio.loads++; };
  const updates = [];
  const player = createBackgroundMusic(audio, { source: backgroundMusic.src, volume: backgroundMusic.volume, onChange: state => updates.push(state) });
  return { owner, audio, player, updates };
}

test('the supplied song has a compact MP3 version and an unchanged WAV archive', () => {
  const file = readFileSync(new URL(`../public${backgroundMusic.src}`, import.meta.url));
  assert.equal(file.toString('ascii', 0, 3), 'ID3');
  assert.ok(file.length > 1_000_000 && file.length < 4_000_000);
  const archive = new URL('../assets/source/audio/isekai-life.wav', import.meta.url);
  assert.equal(statSync(archive).size, 25_799_884);
  const manifest = JSON.parse(readFileSync(new URL('../asset-manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.backgroundMusic.projectAsset, backgroundMusic.src);
  assert.equal(manifest.backgroundMusic.bytes, file.length);
});

test('initialization downloads nothing; user playback loops and volume is bounded', async t => {
  const { audio, player } = fixture();
  t.after(() => player.destroy());
  assert.equal(audio.getAttribute('src'), null);
  assert.equal(audio.plays + audio.loads + audio.pauses, 0);
  assert.equal(audio.preload, 'none');
  assert.equal(audio.loop, true);
  assert.equal(audio.volume, 0.3);
  await player.toggle();
  assert.equal(audio.getAttribute('src'), backgroundMusic.src);
  assert.equal(player.state.status, 'playing');
  player.setVolume(0);
  assert.equal(audio.volume, 0);
  player.setVolume(2);
  assert.equal(audio.volume, 1);
  player.setVolume(-1);
  assert.equal(audio.volume, 0);
  player.toggle();
  assert.equal(audio.paused, true);
  assert.equal(player.state.status, 'paused');
});

test('video interruption resumes only a previously active song', async t => {
  const { audio, player } = fixture();
  t.after(() => player.destroy());
  player.setSuspended(true);
  await player.setSuspended(false);
  assert.equal(audio.plays, 0);
  await player.toggle();
  player.setSuspended(true);
  assert.equal(audio.paused, true);
  assert.equal(player.state.status, 'paused');
  await player.toggle();
  assert.equal(audio.plays, 1, 'a video cannot be interrupted by the music button');
  await player.setSuspended(false);
  assert.equal(audio.plays, 2);
  assert.equal(player.state.status, 'playing');
  player.toggle();
  player.setSuspended(true);
  await player.setSuspended(false);
  assert.equal(audio.plays, 2, 'manual pause must remain paused after a video');
});

test('leaving the page pauses music and returning never starts sound on its own', async t => {
  const { audio, player, owner } = fixture();
  t.after(() => player.destroy());
  await player.toggle();
  player.setSuspended(true);
  owner.hidden = true;
  owner.dispatchEvent(new Event('visibilitychange'));
  owner.hidden = false;
  owner.dispatchEvent(new Event('visibilitychange'));
  await player.setSuspended(false);
  assert.equal(audio.plays, 1);
  assert.equal(player.state.status, 'paused');
  await player.toggle();
  owner.defaultView.dispatchEvent(new Event('pagehide'));
  assert.equal(audio.paused, true);
  assert.equal(player.state.status, 'paused');
});

test('late play promises cannot revive sound after pause or interrupt a newer request', async t => {
  const requests = [];
  const { audio, player } = fixture(() => new Promise(resolve => requests.push(resolve)));
  t.after(() => player.destroy());
  const first = player.toggle();
  player.toggle();
  requests[0]();
  await first;
  assert.equal(audio.paused, true);
  assert.equal(player.state.status, 'paused');
  const second = player.toggle();
  player.toggle();
  const third = player.toggle();
  const pauses = audio.pauses;
  requests[1]();
  await second;
  assert.equal(audio.pauses, pauses);
  // A queued pause event from the previous request observes current playback.
  audio.dispatchEvent(new Event('pause'));
  requests[2]();
  await third;
  assert.equal(player.state.status, 'playing');
});

test('playback failure leaves a retryable control and a retry reloads the media', async t => {
  let fail = true;
  const { audio, player } = fixture(() => fail ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve());
  t.after(() => player.destroy());
  await player.toggle();
  assert.equal(player.state.status, 'error');
  fail = false;
  await player.toggle();
  assert.equal(player.state.status, 'playing');
  assert.equal(audio.loads, 1);
  audio.dispatchEvent(new Event('error'));
  assert.equal(player.state.status, 'error');
});

test('unmount cancels loading, frees the audio source and removes lifecycle listeners', async () => {
  let resolve;
  const { owner, audio, player, updates } = fixture(() => new Promise(done => { resolve = done; }));
  const loading = player.toggle();
  player.destroy();
  assert.equal(audio.paused, true);
  assert.equal(audio.getAttribute('src'), null);
  assert.equal(audio.loads, 1);
  const count = updates.length;
  resolve();
  await loading;
  const pauses = audio.pauses;
  owner.hidden = true;
  owner.dispatchEvent(new Event('visibilitychange'));
  owner.defaultView.dispatchEvent(new Event('pagehide'));
  audio.dispatchEvent(new Event('playing'));
  audio.dispatchEvent(new Event('error'));
  player.destroy();
  assert.equal(updates.length, count);
  assert.equal(audio.pauses, pauses);
  assert.equal(audio.loads, 1);
});
