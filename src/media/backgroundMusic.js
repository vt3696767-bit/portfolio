const clampVolume = value => Number.isFinite(Number(value)) ? Math.min(1, Math.max(0, Number(value))) : 0.3;

// No source is attached until a user requests playback. Progress stays in the
// native media element, so looping music creates no timers or React frame updates.
export function createBackgroundMusic(audio, { source, volume = 0.3, onChange = () => {} }) {
  const owner = audio.ownerDocument;
  let state = { status: 'idle', volume: clampVolume(volume) };
  let wanted = false;
  let suspended = false;
  let disposed = false;
  let generation = 0;
  audio.volume = state.volume;
  audio.loop = true;
  audio.preload = 'none';

  const hasSource = () => Boolean(audio.getAttribute('src'));
  const allowed = () => wanted && !suspended && !owner.hidden && !disposed;
  const publish = status => {
    if (disposed || (state.status === status && state.volume === audio.volume)) return;
    state = { status, volume: audio.volume };
    onChange({ ...state });
  };
  const stop = (forget = true) => {
    generation++;
    if (forget) wanted = false;
    publish(hasSource() ? 'paused' : 'idle');
    if (hasSource()) audio.pause();
  };
  const start = async () => {
    if (!allowed()) return;
    const retry = state.status === 'error';
    const ticket = ++generation;
    if (!hasSource()) audio.setAttribute('src', source);
    if (retry) audio.load();
    publish('loading');
    try {
      await audio.play();
      if (ticket !== generation || !allowed()) {
        // A late play() must not resurrect sound after pause or unmount, nor
        // interrupt a newer playback request for this same media element.
        if (!allowed()) audio.pause();
        return;
      }
      publish('playing');
    } catch {
      if (disposed || ticket !== generation) return;
      wanted = false;
      publish('error');
    }
  };
  const onPlaying = () => {
    if (allowed()) publish('playing');
    else audio.pause();
  };
  const onPause = () => {
    if (disposed || suspended || !audio.paused || !wanted || !['playing', 'loading'].includes(state.status)) return;
    generation++;
    wanted = false;
    publish('paused');
  };
  const onError = () => {
    if (disposed || !hasSource()) return;
    generation++;
    wanted = false;
    publish('error');
  };
  const onVolume = () => publish(state.status);
  const onVisibility = () => { if (owner.hidden) stop(); };
  const onPageHide = () => stop();
  const listeners = { playing: onPlaying, pause: onPause, error: onError, volumechange: onVolume };
  Object.entries(listeners).forEach(([type, callback]) => audio.addEventListener(type, callback));
  owner.addEventListener('visibilitychange', onVisibility);
  owner.defaultView?.addEventListener('pagehide', onPageHide);

  return {
    get state() { return { ...state }; },
    toggle() {
      if (disposed || suspended) return;
      if (wanted) stop();
      else { wanted = true; return start(); }
    },
    setVolume(value) {
      if (disposed) return;
      audio.volume = clampVolume(value);
      publish(state.status);
    },
    setSuspended(value) {
      if (disposed || suspended === Boolean(value)) return;
      suspended = Boolean(value);
      if (suspended) stop(false);
      else if (wanted && !owner.hidden) return start();
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      generation++;
      wanted = false;
      Object.entries(listeners).forEach(([type, callback]) => audio.removeEventListener(type, callback));
      owner.removeEventListener('visibilitychange', onVisibility);
      owner.defaultView?.removeEventListener('pagehide', onPageHide);
      if (hasSource()) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
    },
  };
}
