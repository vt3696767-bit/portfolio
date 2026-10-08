import { memo, useId, useLayoutEffect, useRef, useState } from 'react';
import { createBackgroundMusic } from '../../media/backgroundMusic';
import './BackgroundMusic.css';

function MusicSymbol({ playing }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {playing ? <path d="M8 5v14M16 5v14" /> : <path d="m8 5 11 7-11 7Z" />}
  </svg>;
}

function VolumeSymbol({ muted }) {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4 6 8H3v8h3l5 4Z" />{muted ? <path d="m16 9 5 6m0-6-5 6" /> : <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></>}</svg>;
}

const labels = { idle: '点击播放', loading: '正在加载', playing: '正在播放', paused: '已暂停', error: '点击重试' };

export default memo(function BackgroundMusic({ track, suspended = false }) {
  const audio = useRef(null);
  const player = useRef(null);
  const settingsButton = useRef(null);
  const panelId = useId();
  const sliderId = useId();
  const [state, setState] = useState({ status: 'idle', volume: track.volume });
  const [expanded, setExpanded] = useState(false);
  useLayoutEffect(() => {
    const controller = createBackgroundMusic(audio.current, { source: track.src, volume: track.volume, onChange: setState });
    player.current = controller;
    setState(controller.state);
    return () => { controller.destroy(); player.current = null; };
  }, [track.src, track.volume]);
  // Layout effects pause music before the video's passive playback effect runs.
  useLayoutEffect(() => {
    player.current?.setSuspended(suspended);
    if (suspended) setExpanded(false);
  }, [suspended, track.src, track.volume]);
  const playing = state.status === 'playing' || state.status === 'loading';
  const volume = Math.round(state.volume * 100);
  const closeSettings = () => { setExpanded(false); settingsButton.current?.focus(); };
  return <aside className={`music-player ${suspended ? 'is-suspended' : ''}`} aria-label="背景音乐" onKeyDown={event => {
    if (event.key === 'Escape' && expanded) { event.stopPropagation(); closeSettings(); }
  }}>
    <audio ref={audio} preload="none" loop aria-hidden="true" />
    {expanded && <div className="music-settings" id={panelId}>
      <div className="music-settings-heading"><p>背景音乐<span>{track.durationLabel} · 循环播放</span></p><button type="button" className="music-settings-close" onClick={closeSettings} aria-label="关闭音乐设置">×</button></div>
      <label htmlFor={sliderId}>音量<output htmlFor={sliderId}>{volume}%</output></label>
      <input id={sliderId} type="range" min="0" max="100" step="1" value={volume} aria-label="背景音乐音量" style={{ '--music-volume': `${volume}%` }} onChange={event => player.current?.setVolume(Number(event.target.value) / 100)} />
    </div>}
    <div className="music-bar">
      <button type="button" className="music-toggle" disabled={suspended} aria-label={`${playing ? '暂停' : '播放'}背景音乐《${track.title}》`} aria-pressed={playing} aria-busy={state.status === 'loading'} onClick={() => player.current?.toggle()}>
        <span className={`music-disc ${state.status === 'playing' ? 'is-playing' : ''}`}><MusicSymbol playing={playing} /></span>
        <span className="music-track"><span>{track.title}</span><span>{labels[state.status]}<span className="music-loop" aria-hidden="true"> / MUSIC</span></span></span>
      </button>
      <button type="button" ref={settingsButton} className="music-volume-button" disabled={suspended} aria-label="调节背景音乐音量" aria-controls={expanded ? panelId : undefined} aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><VolumeSymbol muted={volume === 0} /></button>
    </div>
    <span className="music-status" role="status" aria-live="polite">{state.status === 'error' ? '音乐暂时无法播放，请点击播放按钮重试。' : ''}</span>
  </aside>;
});
