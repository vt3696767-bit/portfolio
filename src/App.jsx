import { memo, useEffect, useRef, useState } from 'react';
import { backgroundMusic, capabilities, experiences, profile, projects } from './content';
import { GalleryDivider, GalleryOrnament, RosetteMark } from './components/GalleryOrnament';
import PixelCard from './components/PixelCard/PixelCard';
import BackgroundMusic from './components/BackgroundMusic/BackgroundMusic';
import usePortfolioMotion from './motion/usePortfolioMotion';
import { attachProjectPlayback } from './media/projectPlayback';

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
  const links = [{ id: 'work', label: '精选作品' }, { id: 'about', label: '关于我' }, { id: 'approach', label: '创作能力' }];
  return <><span ref={scrollMarker} className="header-scroll-marker" aria-hidden="true" /><header className={`site-header ${scrolled ? 'is-scrolled' : ''} ${menuOpen ? 'menu-open' : ''}`}>
    <div className="header-inner container">
      <a className="brand" href="#home" onClick={() => setMenuOpen(false)} aria-label="盛勇杰，回到首页"><span className="brand-text">盛勇杰<span>SHENG YONGJIE</span></span></a>
      <nav className="desktop-nav" aria-label="主导航">{links.map(link => <a key={link.id} className={active === link.id ? 'active' : ''} href={`#${link.id}`} aria-current={active === link.id ? 'location' : undefined}>{link.label}</a>)}</nav>
      <a className="header-contact" href="#contact" onClick={() => setMenuOpen(false)} aria-label="联系盛勇杰"><span>联系</span><RosetteMark /></a>
      <button className="menu-toggle" aria-label={menuOpen ? '关闭导航' : '打开导航'} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen(v => !v)}><Icon name={menuOpen ? 'close' : 'menu'} /></button>
    </div>
    {menuOpen && <nav id="mobile-nav" className="mobile-nav" aria-label="移动端导航">{[...links, { id: 'contact', label: '联系我' }].map(link => <a key={link.id} href={`#${link.id}`} onClick={() => setMenuOpen(false)}>{link.label}</a>)}</nav>}
  </header></>;
});

function Hero({ onSelect }) {
  const heroProject = projects.find(project => project.id === 'western-fantasy');
  return <section className="hero" id="home" aria-labelledby="hero-title">
    <GalleryOrnament position="hero" />
    <div className="opening-curtain" aria-hidden="true"><div className="opening-identity"><span className="opening-mark-mask"><span className="opening-mark"><RosetteMark /></span></span><span className="opening-caption-mask"><span className="opening-caption">{profile.englishName}</span></span></div><div className="opening-meta container"><span>PORTFOLIO / {new Date().getFullYear()}</span><span>AI FILM & VISUAL CREATION</span></div></div>
    <div className="hero-inner container">
      <div className="hero-copy">
        <p className="hero-eyebrow">AI FILMMAKER<br />&amp; DESIGNER</p>
        <div className="hero-identity">
          <div className="hero-name-mask"><h1 className="hero-name" id="hero-title">{profile.name}</h1></div>
          <p className="hero-english">{profile.englishName}</p>
          <p className="hero-roles">{profile.roles.map(role => <span key={role}>{role}</span>)}</p>
        </div>
        <span className="hero-rule" aria-hidden="true" />
        <MaskedHeading as="p" className="hero-heading" lines={['让想象，', '成为画面。']} />
        <p className="hero-intro">在想象与现实之间，<br />探索影像的更多可能。</p>
        <a href="#work" className="hero-cta">观看作品 <span aria-hidden="true">↗</span></a>
      </div>
      <div className="hero-art">
        <span className="hero-side-mark" aria-hidden="true">✦</span>
        <div className="hero-arch"><div className="hero-media"><img className="hero-poster" src={profile.heroPoster} srcSet={profile.heroPosterSrcSet} sizes={profile.heroPosterSizes} width="1280" height="720" alt="《西式奇幻》原片画面：窗光中手捧织物的女性" fetchPriority="high" decoding="async" /></div></div>
        <div className="hero-art-caption"><span>FRAME NO. 08</span><span>西式奇幻 / {heroProject.durationLabel}</span></div>
        <button className="hero-art-play" onClick={() => onSelect(heroProject)} aria-label="播放《西式奇幻》影像片段" aria-haspopup="dialog"><Icon name="play" size={18} /><span>观看原片</span></button>
      </div>
    </div>
    <div className="hero-bottom container"><GalleryDivider /><a className="scroll-cue" href="#work">探索影像 <span aria-hidden="true">↓</span></a></div>
  </section>;
}

const About = memo(function About() {
  return <section className="about section-space" id="about" aria-labelledby="about-title" data-motion-block>
    <GalleryOrnament position="about" />
    <div className="container">
      <SectionLabel number="02">ABOUT ME / 关于我</SectionLabel>
      <SectionMasthead words={['ABOUT', 'ME']} />
      <div className="about-grid">
        <div className="portrait-composition" data-motion-portrait>
          <div className="portrait-top"><span>THE PERSON BEHIND THE FRAME</span><span>杭州，中国</span></div>
          <RosetteMark className="portrait-letter" />
          <figure className="portrait-photo"><img src={profile.portrait} srcSet={profile.portraitSrcSet} sizes="(max-width: 720px) 240px, 295px" alt={profile.portraitAlt} width="890" height="1234" loading="lazy" decoding="async" /><figcaption>SHENG YONGJIE<span>盛勇杰</span></figcaption></figure>
          <div className="portrait-bottom"><span>保持好奇。持续创作。</span><RosetteMark className="portrait-symbol" /></div>
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
      <div className="stats" aria-label="个人项目数据" data-motion-row><div><p>07<span>部</span></p><span>独立完成的 AI 短片</span></div><div><p>04<span>部</span></p><span>时长超过 1 分钟</span></div><div><p>03<span>部</span></p><span>时长约 30 秒</span></div><div className="stats-note"><RosetteMark className="asterisk" /><p>从第一帧想象，<br />到最后一秒表达。</p></div></div>
      <div className="experience-block" data-motion-block data-columns="3" data-tablet-columns="3">
        <div className="experience-heading" id="experience"><h3>一路积累，一路创作。</h3><span>EXPERIENCE & EDUCATION</span></div>
        <SectionMasthead words={['MY', 'JOURNEY']} />
        <div className="experience-list">{experiences.map((item, i) => <div className="experience-unit" key={item.role} data-motion-trigger data-motion-order={i}><PixelCard variant="yellow" colors="#e9ddc6,#cabc9e,#b4a17b" gap={8} speed={15} className="experience-card" ariaLabel={`${item.role}，${item.place}，${item.date}`}><article className="experience-item"><p className="experience-date"><span>0{i + 1}</span>{item.date}</p><h4>{item.role}</h4><p className="experience-place">{item.place}</p><p className="body-copy">{item.description}</p></article></PixelCard></div>)}</div>
      </div>
    </div>
  </section>;
});

function ProjectCard({ project, index, onSelect }) {
  const isClip = project.kind === 'clip';
  return <div className={`project-unit project-${project.id}`} data-motion-trigger data-motion-order={index}>
    <button className="project-card" data-motion-card onClick={() => onSelect(project)} aria-label={`播放《${project.title}》，${project.category}`} aria-haspopup="dialog">
      <div className="project-image">
        <div className="project-visual"><img src={project.image} alt={project.alt} loading="lazy" decoding="async" width={project.imageWidth} height={project.imageHeight} /></div>
        <div className="project-image-shade" />
        <div className="project-top"><span>{isClip ? 'CLIP' : 'FILM'} / {project.number}</span><span className="project-kind">{project.category}</span></div>
        <span className="cover-note">{project.durationLabel} / {isClip ? 'VISUAL CLIP' : 'FULL FILM'}</span>
        <span className="project-open"><Icon name="play" size={28} /><span>{isClip ? '播放片段' : '播放短片'}</span></span>
      </div>
      <div className="project-caption"><span className="project-index">{project.number}</span><span className="project-caption-line" aria-hidden="true" /><div className="project-title-group"><p className="project-label">{project.label}</p><h3>{project.title}</h3><span className="project-english">{project.english}</span></div><span className="project-arrow" aria-hidden="true">↗</span></div>
    </button>
  </div>;
}

const Work = memo(function Work({ onSelect }) {
  const films = projects.filter(project => project.kind !== 'clip');
  const clips = projects.filter(project => project.kind === 'clip');
  const count = value => String(value).padStart(2, '0');
  return <section className="work section-space" id="work" aria-labelledby="work-title" data-motion-block data-columns="2" data-tablet-columns="2">
    <GalleryOrnament position="work" />
    <div className="container">
      <SectionLabel number="01">THE MOVING IMAGE / 影像档案</SectionLabel>
      <div className="gallery-section-heading"><SectionMasthead words={['SELECTED', 'WORK']} /><h2 id="work-title">精选影像</h2><p className="gallery-section-note">AI × FILM × DESIGN<span>用 AI 连接想象与真实</span></p></div>
      <div className="project-grid" role="group" aria-label="完整短片">{films.map((project, i) => <ProjectCard key={project.id} project={project} index={i} onSelect={onSelect} />)}</div>
      {clips.length > 0 && <div className="project-collection">
        <div className="project-collection-heading" data-motion-copy><p id="clips-title" data-copy-row>VISUAL STUDIES <span>影像片段</span></p><p data-copy-row>风格、场景与镜头的持续探索。<span>{count(clips.length)} CLIPS</span></p></div>
        <div className="project-grid" role="group" aria-labelledby="clips-title">{clips.map((project, i) => <ProjectCard key={project.id} project={project} index={i} onSelect={onSelect} />)}</div>
      </div>}
      <p className="work-footnote"><span className="footnote-line" />持续创作，持续更新。<span>{count(projects.length)} SELECTED WORKS / {count(films.length)} FILMS{clips.length > 0 ? ` + ${count(clips.length)} CLIPS` : ''} · 点击封面，观看作品。</span></p>
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
  return <section className="contact" id="contact" aria-labelledby="contact-title" data-motion-block><GalleryOrnament position="contact" /><div className="contact-inner container">
    <SectionLabel number="04">LET'S CONNECT / 联系我</SectionLabel>
    <SectionMasthead words={['LET’S', 'CONNECT']} />
    <div className="contact-main" data-motion-copy><div className="contact-title-wrap"><p className="contact-pretitle" data-copy-row>好故事，始于一次交流。</p><MaskedHeading id="contact-title" lines={['下一个故事，', '一起创作。']} /><p className="contact-script" data-copy-row>Let’s make something <em>meaningful.</em></p></div><div className="contact-details" data-copy-row><p className="contact-invitation">关于 AI 影像、视觉创作，<br />或是一个还没成形的想法，<br />都欢迎和我聊聊。</p><div className="contact-email"><span>EMAIL</span><a href={`mailto:${profile.email}`}>{profile.email}</a><button className="copy-button" aria-label="复制电子邮箱" onClick={() => onCopy(profile.email)}><Icon name="copy" size={20} /></button></div><div className="contact-other"><div><span>PHONE</span><a href={`tel:${profile.phone}`}>{profile.phone}</a></div><div><span>BASED IN</span><p>{profile.location}，中国</p></div></div></div></div>
    <div className="contact-footer"><a className="footer-brand" href="#home" aria-label="盛勇杰，回到首页"><RosetteMark /></a><p>© {new Date().getFullYear()} {profile.englishName}<span>保持好奇，持续创作。</span></p><a href="#home" className="back-to-top">回到顶部 ↑</a></div>
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
      <video ref={video} key={project.id} src={project.video} poster={project.image} controls autoPlay playsInline preload="metadata" aria-label={`《${project.title}》${project.kind === 'clip' ? '影像片段' : '完整短片'}`} onCanPlay={() => setFailedSource('')} onError={() => setFailedSource(project.video)} />
      {failedSource === project.video && <p className="video-error" role="status">视频暂时无法播放，<a href={project.video} target="_blank" rel="noopener noreferrer">单独打开视频</a>。</p>}
    </div>
    <div className="dialog-content">
      <div className="dialog-film-meta"><p className="overline">{project.kind === 'clip' ? 'CLIP' : 'FILM'} {project.number} / {project.category}</p><span>{project.durationLabel}</span><a href={project.video} target="_blank" rel="noopener noreferrer">单独观看 ↗</a></div>
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
  return <div className="portfolio-page" ref={page}><a className="skip-link" href="#work">跳到主要内容</a><Header active={active} /><main><Hero onSelect={setProject} /><div className="light-sections"><Work onSelect={setProject} /><About /></div><Approach /><Contact onCopy={copyEmail} /></main><BackgroundMusic track={backgroundMusic} suspended={Boolean(project)} /><ProjectDialog project={project} onClose={() => setProject(null)} /><div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast}</div></div>;
}
