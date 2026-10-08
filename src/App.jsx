import { lazy, memo, Suspense, useEffect, useRef, useState } from 'react';
import { backgroundMusic, capabilities, experiences, profile, projects } from './content';
import ShardFallback from './components/AeroShards/ShardFallback';
import PixelCard from './components/PixelCard/PixelCard';
import BackgroundMusic from './components/BackgroundMusic/BackgroundMusic';
import usePortfolioMotion from './motion/usePortfolioMotion';
import { attachProjectPlayback } from './media/projectPlayback';

const AeroShards = lazy(() => import('./components/AeroShards/AeroShards'));

function Icon({ name, size = 24, ...props }) {
  const paths = {
    pause: <><path d="M9 6v12M15 6v12" /></>,
    play: <path d="m9 5 11 7-11 7Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    menu: <path d="M4 8h16M4 16h16" />,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>,
    story: <><rect x="3" y="6" width="18" height="15" rx="1" /><path d="m3 6 16-4 2 4M8 5l2-3M14 4l2-3M8 13h8M8 17h5" /></>,
    frames: <><rect x="3" y="3" width="13" height="13" rx="1" /><path d="M8 20h12V8M3 11l4-4 5 5 4-3" /><circle cx="12" cy="7" r="1" /></>,
    sound: <path d="M3 10v4M7 6v12M12 3v18M17 7v10M21 10v4" />,
    lens: <><rect x="2" y="6" width="20" height="15" rx="2" /><path d="m7 6 2-3h6l2 3" /><circle cx="12" cy="13" r="4" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

function SectionLabel({ number, children }) {
  return <p className="section-label"><span>{number}</span><span className="label-line" /><span>{children}</span></p>;
}

function SectionMasthead({ words }) {
  return <div className="section-masthead" aria-hidden="true">{words.map(word => <span className="masthead-mask" key={word}><span className="masthead-word">{word}</span></span>)}</div>;
}

function MaskedHeading({ as: Tag = 'h2', id, className = '', lines }) {
  return <Tag id={id} className={className}>{lines.map((line, index) => <span className="heading-mask" key={index}><span className="heading-line">{line}</span></span>)}</Tag>;
}

const Header = memo(function Header({ active }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollMarker = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setScrolled(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    if (scrollMarker.current) observer.observe(scrollMarker.current);
    return () => observer.disconnect();
  }, []);
  const links = [{ id: 'about', label: '关于我' }, { id: 'work', label: '精选作品' }, { id: 'approach', label: '创作能力' }];
  return <><span ref={scrollMarker} className="header-scroll-marker" aria-hidden="true" /><header className={`site-header ${scrolled ? 'is-scrolled' : ''} ${menuOpen ? 'menu-open' : ''}`}>
    <div className="header-inner container">
      <a className="brand" href="#home" onClick={() => setMenuOpen(false)} aria-label="盛勇杰，回到首页"><span className="brand-mark">S.</span><span className="brand-text">盛勇杰<span>CREATIVE PORTFOLIO</span></span></a>
      <nav className="desktop-nav" aria-label="主导航">{links.map(link => <a key={link.id} className={active === link.id ? 'active' : ''} href={`#${link.id}`} aria-current={active === link.id ? 'location' : undefined}>{link.label}</a>)}</nav>
      <a className="header-contact" href="#contact" onClick={() => setMenuOpen(false)}>聊聊你的想法<span className="contact-star" aria-hidden="true">✳</span></a>
      <button className="menu-toggle" aria-label={menuOpen ? '关闭导航' : '打开导航'} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen(v => !v)}><Icon name={menuOpen ? 'close' : 'menu'} /></button>
    </div>
    {menuOpen && <nav id="mobile-nav" className="mobile-nav" aria-label="移动端导航">{[...links, { id: 'contact', label: '联系我' }].map(link => <a key={link.id} href={`#${link.id}`} onClick={() => setMenuOpen(false)}>{link.label}</a>)}</nav>}
  </header></>;
});

function Hero() {
  const hasVideo = Boolean(profile.heroVideo);
  const video = useRef(null);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const element = video.current;
    if (!element || unavailable) return;
    const update = () => {
      if (paused || document.hidden) element.pause();
      else element.play().catch(() => setPaused(true));
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [paused, unavailable, hasVideo]);
  useEffect(() => {
    if (!hasVideo) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { if (media.matches) setPaused(true); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [hasVideo]);
  return <section className="hero" id="home" aria-labelledby="hero-title">
    <div className="opening-curtain" aria-hidden="true"><div className="opening-identity"><span className="opening-mark-mask"><span className="opening-mark">S.</span></span><span className="opening-caption-mask"><span className="opening-caption">{profile.englishName}</span></span></div><div className="opening-meta container"><span>CREATIVE PORTFOLIO / {new Date().getFullYear()}</span><span>AI FILM & VISUAL CREATION</span></div></div>
    <div className="hero-media" aria-hidden="true">
      <img className="hero-poster" src={profile.heroPoster} srcSet={profile.heroPosterSrcSet} sizes="100vw" width="2912" height="1632" alt="" fetchPriority="high" decoding="async" />
      {hasVideo && <video ref={video} className={ready ? 'is-ready' : ''} muted loop playsInline autoPlay={!paused} preload="metadata" poster={profile.heroPoster} onPlaying={() => setReady(true)} onError={() => { setUnavailable(true); setPaused(true); }}><source src={profile.heroVideo} type="video/mp4" /></video>}
    </div>
    <div className="hero-shade" />
    <div className="hero-main container">
      <p className="hero-eyebrow"><span className="eyebrow-dash" />AI FILM & VISUAL CREATION</p>
      <div className="hero-title-row"><MaskedHeading as="h1" id="hero-title" className="hero-heading" lines={['让想象，', '成为画面。']} /><span className="hero-period" aria-hidden="true">✳</span></div>
      <div className="hero-intro"><p>我是盛勇杰。<br />在想象与现实之间，探索影像的更多可能。</p></div>
      <a href="#work" className="hero-cta">探索我的作品 <span className="small-plus" aria-hidden="true">+</span></a>
    </div>
    <div className="hero-bottom container">
      <div className="hero-roles">{profile.roles.map(role => <span key={role}>{role}</span>)}</div>
      <a className="scroll-cue" href="#about"><span className="scroll-line" aria-hidden="true" />向下探索</a>
      {hasVideo && !unavailable && <button className="video-control" onClick={() => setPaused(p => !p)} aria-label={paused ? '播放背景视频' : '暂停背景视频'} aria-pressed={paused}><Icon name={paused ? 'play' : 'pause'} size={17} /><span>{paused ? '播放' : '暂停'}背景影像</span></button>}
    </div>
  </section>;
}

const ContentBackground = memo(function ContentBackground() {
  const [error, setError] = useState('');
  const [active, setActive] = useState(false);
  const [eligible, setEligible] = useState(false);
  const background = useRef(null);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    let idle = null;
    let inView = false;
    let started = false;
    const cancelIdle = () => {
      if (idle === null) return;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
      idle = null;
    };
    const allowed = () => !motion.matches && Boolean(navigator.gpu) && !connection?.saveData;
    const activate = () => {
      if (!inView || document.hidden || !allowed()) { cancelIdle(); return; }
      if (started || idle !== null) return;
      const load = () => {
        idle = null;
        if (!inView || document.hidden || !allowed()) return;
        started = true;
        setActive(true);
        observer.disconnect();
      };
      if (window.requestIdleCallback) idle = window.requestIdleCallback(load, { timeout: 800 });
      else idle = setTimeout(load, 100);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.02;
      activate();
    }, { threshold: [0, 0.02] });
    const update = () => {
      cancelIdle();
      setEligible(allowed());
      if (!allowed()) { started = false; setActive(false); observer.disconnect(); }
      else if (!started && background.current) observer.observe(background.current);
    };
    update();
    motion.addEventListener('change', update);
    connection?.addEventListener?.('change', update);
    document.addEventListener('visibilitychange', activate);
    return () => { cancelIdle(); observer.disconnect(); motion.removeEventListener('change', update); connection?.removeEventListener?.('change', update); document.removeEventListener('visibilitychange', activate); };
  }, []);
  return <div ref={background} className="content-background" aria-hidden="true" data-error={error || undefined} data-renderer={error || !eligible ? 'fallback' : active ? 'webgpu' : 'pending'}>
    <div className="content-background-viewport">
      {error || !active ? <ShardFallback /> : <Suspense fallback={<ShardFallback />}><AeroShards
        backgroundColor="#f8f0d6"
        shardColor="#ebdda9"
        accentColor="#cfb76f"
        placement="full"
        flow="stream"
        material="pearl"
        detail="balanced"
        effect="none"
        density={1.15}
        shardSize={1.1}
        speed={0.55}
        spin={0.65}
        interaction="repel"
        bloom={0}
        grain={0}
        chromaticAberration={0}
        onError={failure => setError(failure.message)}
      /></Suspense>}
    </div>
  </div>;
});

const About = memo(function About() {
  return <section className="about section-space" id="about" aria-labelledby="about-title" data-motion-block>
    <div className="container">
      <SectionLabel number="01">ABOUT ME / 关于我</SectionLabel>
      <SectionMasthead words={['ABOUT', 'ME']} />
      <div className="about-grid">
        <div className="portrait-composition" data-motion-portrait>
          <div className="portrait-top"><span>THE PERSON BEHIND THE FRAME</span><span>杭州，中国</span></div>
          <span className="portrait-letter" aria-hidden="true">S.</span>
          <figure className="portrait-photo"><img src={profile.portrait} srcSet={profile.portraitSrcSet} sizes="(max-width: 720px) 240px, 295px" alt={profile.portraitAlt} width="890" height="1234" loading="lazy" decoding="async" /><figcaption>SHENG YONGJIE<span>盛勇杰</span></figcaption></figure>
          <div className="portrait-bottom"><span>保持好奇。持续创作。</span><span className="portrait-symbol" aria-hidden="true">✳</span></div>
        </div>
        <div className="about-copy" data-motion-copy>
          <p className="overline" data-copy-row>A LITTLE ABOUT ME</p>
          <MaskedHeading id="about-title" lines={['用创意发问，', <>用<span className="accent-word">影像</span>回答。</>]} />
          <p className="about-lead" data-copy-row>你好，我是盛勇杰，一名从数字媒体出发的 AI 影像创作者。</p>
          <p className="body-copy" data-copy-row>我喜欢把一句话的想法，变成有角色、有情绪、有节奏的画面。从选题、剧本、分镜，到 AI 生成和剪辑成片，我在个人创作中持续练习完整的制作流程。</p>
          <p className="body-copy" data-copy-row>摄影让我更关注构图与光线，AI 则打开了新的表达空间。我希望将两者结合，做出让人愿意停留的影像。</p>
          <div className="about-meta" data-copy-row><div><span>所在地</span><p>{profile.location}</p></div><div><span>电子邮箱</span><a href={`mailto:${profile.email}`}>{profile.email}</a></div></div>
        </div>
      </div>
      <div className="stats" aria-label="个人项目数据" data-motion-row><div><p>07<span>部</span></p><span>独立完成的 AI 短片</span></div><div><p>04<span>部</span></p><span>时长超过 1 分钟</span></div><div><p>03<span>部</span></p><span>时长约 30 秒</span></div><div className="stats-note"><span className="asterisk" aria-hidden="true">✳</span><p>从第一帧想象，<br />到最后一秒表达。</p></div></div>
      <div className="experience-block" data-motion-block data-columns="3" data-tablet-columns="3">
        <div className="experience-heading" id="experience"><h3>一路积累，一路创作。</h3><span>EXPERIENCE & EDUCATION</span></div>
        <SectionMasthead words={['MY', 'JOURNEY']} />
        <div className="experience-list">{experiences.map((item, i) => <div className="experience-unit" key={item.role} data-motion-trigger data-motion-order={i}><PixelCard variant="yellow" colors="#edd38a,#d6b04c,#cfb76f" gap={6} speed={20} className="experience-card" ariaLabel={`${item.role}，${item.place}，${item.date}`}><article className="experience-item"><p className="experience-date"><span>0{i + 1}</span>{item.date}</p><h4>{item.role}</h4><p className="experience-place">{item.place}</p><p className="body-copy">{item.description}</p></article></PixelCard></div>)}</div>
      </div>
    </div>
  </section>;
});

const Work = memo(function Work({ onSelect }) {
  return <section className="work section-space" id="work" aria-labelledby="work-title" data-motion-block data-columns="2" data-tablet-columns="2">
    <div className="container">
      <SectionLabel number="02">SELECTED WORK / 精选作品</SectionLabel>
      <SectionMasthead words={['SELECTED', 'WORK']} />
      <div className="section-heading" data-motion-copy><MaskedHeading id="work-title" lines={['把想法，', <span className="accent-word">放进画面里。</span>]} /><div className="section-side" data-copy-row><p className="serif-note">Ideas into images.</p><p>故事、人物与视觉风格。<br />这里记录我的影像创作与探索。</p></div></div>
      <div className="project-grid">{projects.map((project, i) => <div key={project.id} className={`project-unit project-${project.id}`} data-motion-trigger data-motion-order={i}>
        <button className="project-card" data-motion-card onClick={() => onSelect(project)} aria-label={`播放《${project.title}》，${project.category}`} aria-haspopup="dialog">
          <div className="project-image" style={{ '--project-aspect': `${project.imageWidth} / ${project.imageHeight}` }}>
            <div className="project-visual"><img src={project.image} alt={project.alt} loading="lazy" decoding="async" width={project.imageWidth} height={project.imageHeight} /></div>
            <div className="project-image-shade" />
            <div className="project-top"><span>FILM / {project.number}</span><span className="project-kind">{project.category}</span></div>
            <span className="cover-note">{project.durationLabel} / FULL FILM</span>
            <span className="project-open"><Icon name="play" size={28} /><span>播放短片</span></span>
          </div>
          <div className="project-caption"><div><p className="project-label">{project.label}</p><h3>{project.title}</h3></div><span className="project-english">{project.english}</span></div>
        </button>
      </div>)}</div>
      <p className="work-footnote"><span className="footnote-line" />持续创作，持续更新。<span>04 SELECTED FILMS / 点击封面，观看完整短片。</span></p>
    </div>
  </section>;
});

const Approach = memo(function Approach() {
  return <section className="approach section-space" id="approach" aria-labelledby="approach-title" data-motion-block data-columns="4" data-tablet-columns="2"><div className="container">
    <SectionLabel number="03">MY APPROACH / 创作能力</SectionLabel>
    <SectionMasthead words={['MY', 'APPROACH']} />
    <div className="section-heading" data-motion-copy><MaskedHeading id="approach-title" lines={['从一个想法，', <>到一个<span className="warm-word">完整的作品。</span></>]} /><p className="approach-intro" data-copy-row>技术是工具，表达是目的。<br />让每一步创作，都服务于最后的画面。</p></div>
    <div className="capabilities-grid">{capabilities.map((item, i) => <div className="capability-unit" key={item.title} data-motion-trigger data-motion-order={i}><article className="capability" data-motion-card><div className="capability-top"><Icon name={item.icon} size={34} /><span>0{i + 1}</span></div><p className="capability-english">{item.english}</p><h3>{item.title}</h3><p className="capability-description">{item.description}</p><p className="capability-tools">{item.tools}</p></article></div>)}</div>
    <div className="approach-bottom" data-motion-row><span>IDEA</span><span className="process-line" /><span>STORY</span><span className="process-line" /><span>FRAME</span><span className="process-line" /><span>FILM</span><span className="approach-bottom-note">让每一帧，都有它的理由。</span></div>
  </div></section>;
});

function Contact({ onCopy }) {
  return <section className="contact" id="contact" aria-labelledby="contact-title" data-motion-block><div className="contact-inner container">
    <SectionLabel number="04">LET'S CONNECT / 联系我</SectionLabel>
    <SectionMasthead words={['LET’S', 'CONNECT']} />
    <div className="contact-main" data-motion-copy><div className="contact-title-wrap"><p className="contact-pretitle" data-copy-row>好故事，始于一次交流。</p><MaskedHeading id="contact-title" lines={['下一个故事，', '一起创作。']} /><p className="contact-script" data-copy-row>Let’s make something <em>meaningful.</em></p></div><div className="contact-details" data-copy-row><p className="contact-invitation">关于 AI 影像、视觉创作，<br />或是一个还没成形的想法，<br />都欢迎和我聊聊。</p><div className="contact-email"><span>EMAIL</span><a href={`mailto:${profile.email}`}>{profile.email}</a><button className="copy-button" aria-label="复制电子邮箱" onClick={() => onCopy(profile.email)}><Icon name="copy" size={20} /></button></div><div className="contact-other"><div><span>PHONE</span><a href={`tel:${profile.phone}`}>{profile.phone}</a></div><div><span>BASED IN</span><p>{profile.location}，中国</p></div></div></div></div>
    <div className="contact-footer"><a className="footer-brand" href="#home" aria-label="盛勇杰，回到首页">S.</a><p>© {new Date().getFullYear()} {profile.englishName}<span>保持好奇，持续创作。</span></p><a href="#home" className="back-to-top">回到顶部</a></div>
  </div></section>;
}

function ProjectDialog({ project, onClose }) {
  const dialog = useRef(null);
  const video = useRef(null);
  const [failedSource, setFailedSource] = useState('');
  useEffect(() => {
    if (project && dialog.current && video.current) {
      return attachProjectPlayback(dialog.current, video.current, project.video);
    }
    if (dialog.current?.open) dialog.current.close();
  }, [project]);
  return <dialog className="project-dialog" ref={dialog} aria-labelledby="dialog-title" onClose={onClose} onClick={event => {
    if (event.target !== dialog.current) return;
    const box = dialog.current.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.current.close();
  }}>{project && <>
    <button className="dialog-close" aria-label="关闭视频" onClick={() => dialog.current.close()}><Icon name="close" /></button>
    <div className="dialog-player" style={{ '--video-aspect': `${project.imageWidth} / ${project.imageHeight}` }}>
      <video ref={video} key={project.id} src={project.video} poster={project.image} controls autoPlay playsInline preload="metadata" aria-label={`《${project.title}》完整短片`} onCanPlay={() => setFailedSource('')} onError={() => setFailedSource(project.video)} />
      {failedSource === project.video && <p className="video-error" role="status">视频暂时无法播放，<a href={project.video} target="_blank" rel="noopener noreferrer">单独打开视频</a>。</p>}
    </div>
    <div className="dialog-content">
      <div className="dialog-film-meta"><p className="overline">FILM {project.number} / {project.category}</p><span>{project.durationLabel}</span><a href={project.video} target="_blank" rel="noopener noreferrer">单独观看 ↗</a></div>
      <h2 id="dialog-title">{project.title}</h2><p className="dialog-summary">{project.summary}</p><p className="dialog-role">{project.responsibility}</p>
      <div className="dialog-notes">{project.notes.map((note, i) => <p key={note}><span>0{i + 1}</span>{note}</p>)}</div>
    </div>
  </>}</dialog>;
}

export default function App() {
  const page = useRef(null);
  usePortfolioMotion(page);
  const [active, setActive] = useState('home');
  const [project, setProject] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef();
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
    return () => { observer.disconnect(); clearTimeout(toastTimer.current); };
  }, []);
  async function copyEmail(value) {
    let copied = false;
    try { await navigator.clipboard.writeText(value); copied = true; }
    catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand('copy');
      textarea.remove();
    }
    setToast(copied ? '邮箱已复制，期待你的消息。' : `请手动复制：${value}`);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  }
  return <div className="portfolio-page" ref={page}><a className="skip-link" href="#about">跳到主要内容</a><Header active={active} /><main><Hero /><div className="light-sections"><ContentBackground /><About /><Work onSelect={setProject} /></div><Approach /><Contact onCopy={copyEmail} /></main><BackgroundMusic track={backgroundMusic} suspended={Boolean(project)} /><ProjectDialog project={project} onClose={() => setProject(null)} /><div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast}</div></div>;
}
