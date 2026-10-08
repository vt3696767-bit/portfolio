// Loading is tied to the open dialog, so the gallery only downloads poster images.
export function attachProjectPlayback(dialog, video, source) {
  const owner = dialog.ownerDocument;
  const previousOverflow = owner.body.style.overflow;
  let released = false;

  const release = () => {
    if (released) return;
    released = true;
    video.pause();
    video.removeAttribute('src');
    video.load();
    owner.body.style.overflow = previousOverflow;
  };
  const pauseWhenHidden = () => { if (owner.hidden) video.pause(); };

  dialog.scrollTop = 0;
  if (!dialog.open) dialog.showModal();
  owner.body.style.overflow = 'hidden';
  if (video.getAttribute('src') !== source) video.setAttribute('src', source);
  owner.addEventListener('visibilitychange', pauseWhenHidden);
  dialog.addEventListener('close', release);
  // A browser can require a second click; native controls remain available.
  try { video.play()?.catch(() => {}); } catch { /* Native controls provide manual playback. */ }

  return () => {
    owner.removeEventListener('visibilitychange', pauseWhenHidden);
    dialog.removeEventListener('close', release);
    release();
  };
}
