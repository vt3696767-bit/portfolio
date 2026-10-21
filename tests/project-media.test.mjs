import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openSync, readSync, closeSync, statSync } from 'node:fs';
import { projects } from '../src/content.js';
import { attachProjectPlayback } from '../src/media/projectPlayback.js';

function atoms(path) {
  const file = openSync(path, 'r');
  const bytes = statSync(path).size;
  const header = Buffer.alloc(16);
  const result = [];
  try {
    let offset = 0;
    while (offset < bytes) {
      assert.ok(readSync(file, header, 0, Math.min(16, bytes - offset), offset) >= 8);
      let size = header.readUInt32BE(0);
      const type = header.toString('ascii', 4, 8);
      const headerSize = size === 1 ? 16 : 8;
      if (size === 1) size = Number(header.readBigUInt64BE(8));
      if (size === 0) size = bytes - offset;
      assert.ok(size >= headerSize && offset + size <= bytes, `Invalid ${type} atom`);
      result.push({ type, offset, size });
      offset += size;
    }
    assert.equal(offset, bytes);
  } finally { closeSync(file); }
  return result;
}

test('the original four films retain their titles, selected covers and video mappings', () => {
  assert.deepEqual(projects.filter(project => project.kind !== 'clip').map(project => [project.id, project.title, project.image, project.video]), [
    ['cat-cafe', '猫知道', '/images/projects/cat-cafe.webp', '/videos/projects/cat-cafe-web.mp4'],
    ['lost-memory', '重新认识一下', '/images/projects/lost-memory-portrait.webp', '/videos/projects/lost-memory-web.mp4'],
    ['combat-study', '战斗练习 01', '/images/projects/combat-study-duel.webp', '/videos/projects/combat-study-web.mp4'],
    ['fashion-film', '时尚短片', '/images/projects/fashion-film-closeup.webp', '/videos/projects/fashion-film-web.mp4'],
  ]);
  assert.deepEqual(projects.filter(project => project.kind === 'clip').map(project => [project.id, project.title, project.number]), [
    ['eastern-fantasy-live', '东方奇幻真人实拍', '05'],
    ['song-dynasty', '古风·宋韵', '06'],
    ['otherworld-fantasy', '异世界奇幻', '07'],
    ['western-fantasy', '西式奇幻', '08'],
  ]);
});

test('all eight works have original-frame posters and complete fast-start MP4 files within the Pages limit', () => {
  assert.equal(projects.length, 8);
  assert.equal(new Set(projects.map(project => project.video)).size, projects.length);
  for (const project of projects) {
    assert.ok(project.duration > 0);
    assert.match(project.durationLabel, /^\d{2}:\d{2}$/);
    assert.ok(!project.alt.includes('示意'));
    assert.ok(project.imageWidth > 0 && project.imageHeight > 0);
    if (project.kind === 'clip') {
      assert.equal(project.image, `/images/projects/${project.id}.webp`);
      assert.equal(project.video, `/videos/projects/${project.id}-web.mp4`);
    }
    const poster = new URL(`../public${project.image}`, import.meta.url);
    const imageFile = openSync(poster, 'r');
    const imageHeader = Buffer.alloc(12);
    try { readSync(imageFile, imageHeader, 0, 12, 0); } finally { closeSync(imageFile); }
    assert.equal(imageHeader.toString('ascii', 0, 4), 'RIFF');
    assert.equal(imageHeader.toString('ascii', 8, 12), 'WEBP');
    const video = new URL(`../public${project.video}`, import.meta.url);
    const boxes = atoms(video);
    assert.ok(statSync(video).size > 1_000_000);
    assert.ok(statSync(video).size <= 25 * 1024 * 1024, `${project.id} must fit Cloudflare Pages`);
    assert.equal(boxes[0].type, 'ftyp');
    const moov = boxes.find(box => box.type === 'moov');
    const mdat = boxes.find(box => box.type === 'mdat');
    assert.ok(moov && mdat && moov.offset < mdat.offset, `${project.id} must support early playback`);
  }
});

function playerFixture(play = () => Promise.resolve()) {
  const owner = new EventTarget();
  owner.body = { style: { overflow: 'auto' } };
  owner.hidden = false;
  const dialog = new EventTarget();
  dialog.ownerDocument = owner;
  dialog.open = false;
  dialog.scrollTop = 240;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new Event('close')); };
  const attributes = new Map();
  const video = {
    pauses: 0, loads: 0, plays: 0,
    getAttribute: name => attributes.get(name) ?? null,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: name => attributes.delete(name),
    pause() { this.pauses++; },
    load() { this.loads++; },
    play() { this.plays++; return play(); },
  };
  return { owner, dialog, video };
}

test('closing the dialog stops sound, releases the source and restores scrolling', t => {
  const { owner, dialog, video } = playerFixture();
  const clean = attachProjectPlayback(dialog, video, projects[0].video);
  t.after(clean);
  assert.ok(dialog.open);
  assert.equal(dialog.scrollTop, 0);
  assert.equal(owner.body.style.overflow, 'hidden');
  assert.equal(video.getAttribute('src'), projects[0].video);
  dialog.close();
  assert.equal(video.pauses, 1);
  assert.equal(video.loads, 1);
  assert.equal(video.getAttribute('src'), null);
  assert.equal(owner.body.style.overflow, 'auto');
  clean();
  clean();
  assert.equal(video.loads, 1);
});

test('backgrounding pauses playback and cleanup removes the visibility listener', t => {
  const { owner, dialog, video } = playerFixture();
  const clean = attachProjectPlayback(dialog, video, projects[1].video);
  t.after(clean);
  owner.hidden = true;
  owner.dispatchEvent(new Event('visibilitychange'));
  assert.equal(video.pauses, 1);
  clean();
  owner.dispatchEvent(new Event('visibilitychange'));
  assert.equal(video.pauses, 2);
  assert.equal(video.getAttribute('src'), null);
});

test('an autoplay rejection preserves the open player for manual playback', async t => {
  const { owner, dialog, video } = playerFixture(() => Promise.reject(new Error('NotAllowedError')));
  const clean = attachProjectPlayback(dialog, video, projects[2].video);
  t.after(clean);
  await Promise.resolve();
  assert.ok(dialog.open);
  assert.equal(owner.body.style.overflow, 'hidden');
  assert.equal(video.getAttribute('src'), projects[2].video);
});

test('reattaching after cleanup restores the video source without opening a second dialog', t => {
  const { owner, dialog, video } = playerFixture();
  const first = attachProjectPlayback(dialog, video, projects[3].video);
  first();
  const second = attachProjectPlayback(dialog, video, projects[3].video);
  t.after(second);
  assert.ok(dialog.open);
  assert.equal(video.getAttribute('src'), projects[3].video);
  assert.equal(video.plays, 2);
  second();
  assert.equal(owner.body.style.overflow, 'auto');
});
