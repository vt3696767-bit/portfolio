import { useEffect, useRef } from 'react';
import './PixelCard.css';

class Pixel {
  constructor(canvas, context, x, y, color, speed, delay) {
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = this.getRandomValue(0.1, 0.9) * speed;
    this.size = 0;
    this.sizeStep = Math.random() * 0.4;
    this.minSize = 0.5;
    this.maxSizeInteger = 2;
    this.maxSize = this.getRandomValue(this.minSize, this.maxSizeInteger);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 4 + (this.width + this.height) * 0.01;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
  }

  getRandomValue(min, max) {
    return Math.random() * (max - min) + min;
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillRect(this.x + centerOffset, this.y + centerOffset, this.size, this.size);
  }

  appear(step = 1) {
    this.isIdle = false;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep * step;
      return;
    }
    if (this.size >= this.maxSize) {
      this.isShimmer = true;
    }
    if (this.isShimmer) {
      this.shimmer(step);
    } else {
      this.size += this.sizeStep * step;
    }
    this.draw();
  }

  disappear(step = 1) {
    this.isShimmer = false;
    this.counter = 0;
    if (this.size <= 0) {
      this.isIdle = true;
      return;
    } else {
      this.size -= 0.1 * step;
    }
    this.draw();
  }

  shimmer(step = 1) {
    if (this.size >= this.maxSize) {
      this.isReverse = true;
    } else if (this.size <= this.minSize) {
      this.isReverse = false;
    }
    if (this.isReverse) {
      this.size -= this.speed * step;
    } else {
      this.size += this.speed * step;
    }
  }
}

function getEffectiveSpeed(value, reducedMotion) {
  const min = 0;
  const max = 100;
  const throttle = 0.001;
  const parsed = parseInt(value, 10);

  if (parsed <= min || reducedMotion) {
    return min;
  } else if (parsed >= max) {
    return max * throttle;
  } else {
    return parsed * throttle;
  }
}

const VARIANTS = {
  default: {
    activeColor: null,
    gap: 5,
    speed: 35,
    colors: '#f8fafc,#f1f5f9,#cbd5e1',
    noFocus: false
  },
  blue: {
    activeColor: '#e0f2fe',
    gap: 10,
    speed: 25,
    colors: '#e0f2fe,#7dd3fc,#0ea5e9',
    noFocus: false
  },
  yellow: {
    activeColor: '#fef08a',
    gap: 3,
    speed: 20,
    colors: '#fef08a,#fde047,#eab308',
    noFocus: false
  },
  pink: {
    activeColor: '#fecdd3',
    gap: 6,
    speed: 80,
    colors: '#fecdd3,#fda4af,#e11d48',
    noFocus: true
  }
};

export default function PixelCard({ variant = 'default', gap, speed, colors, noFocus, className = '', style, ariaLabel, children }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const pixelsRef = useRef([]);
  const animationRef = useRef(null);
  const timePreviousRef = useRef(performance.now());
  const timeDrawnRef = useRef(performance.now());
  const interactionRef = useRef({ hover: false, focus: false });
  const visibleRef = useRef(false);
  const needsPixelsRef = useRef(true);
  const modeRef = useRef('disappear');
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const variantCfg = VARIANTS[variant] || VARIANTS.default;
  const finalGap = gap ?? variantCfg.gap;
  const finalSpeed = speed ?? variantCfg.speed;
  const finalColors = colors ?? variantCfg.colors;
  const finalNoFocus = noFocus ?? variantCfg.noFocus;

  const initPixels = () => {
    if (!containerRef.current || !canvasRef.current) return false;

    const width = Math.floor(containerRef.current.clientWidth);
    const height = Math.floor(containerRef.current.clientHeight);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx || width <= 0 || height <= 0) return false;

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    canvasRef.current.style.width = `${width}px`;
    canvasRef.current.style.height = `${height}px`;

    const colorsArray = finalColors.split(',').map(color => color.trim()).filter(Boolean);
    let gridGap = Math.max(3, parseInt(finalGap, 10) || 5, Math.ceil(Math.sqrt(width * height / 3000)));
    while (Math.ceil(width / gridGap) * Math.ceil(height / gridGap) > 3000) gridGap++;
    const buckets = colorsArray.map(() => []);
    for (let x = 0; x < width; x += gridGap) {
      for (let y = 0; y < height; y += gridGap) {
        const colorIndex = Math.floor(Math.random() * colorsArray.length);
        const color = colorsArray[colorIndex];

        const dx = x - width / 2;
        const dy = y - height / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const delay = reducedMotion.current ? 0 : distance;

        buckets[colorIndex].push(new Pixel(canvasRef.current, ctx, x, y, color, getEffectiveSpeed(finalSpeed, reducedMotion.current), delay));
      }
    }
    pixelsRef.current = buckets.flat();
    needsPixelsRef.current = false;
    return true;
  };

  const doAnimate = fnName => {
    animationRef.current = null;
    if (!visibleRef.current || document.hidden || !canvasRef.current) return;
    const timeNow = performance.now();
    const timePassed = timeNow - timePreviousRef.current;
    const timeInterval = 1000 / 30;

    if (timePassed < timeInterval) {
      animationRef.current = requestAnimationFrame(() => doAnimate(fnName));
      return;
    }
    timePreviousRef.current = timeNow - (timePassed % timeInterval);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    let allIdle = true;
    let currentColor;
    const step = Math.min(3, (timeNow - timeDrawnRef.current) / (1000 / 60));
    timeDrawnRef.current = timeNow;
    for (let i = 0; i < pixelsRef.current.length; i++) {
      const pixel = pixelsRef.current[i];
      if (pixel.color !== currentColor) { currentColor = pixel.color; ctx.fillStyle = currentColor; }
      pixel[fnName](step);
      if (!pixel.isIdle) {
        allIdle = false;
      }
    }
    if (!allIdle) {
      animationRef.current = requestAnimationFrame(() => doAnimate(fnName));
    }
  };

  const handleAnimation = name => {
    cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    modeRef.current = name;
    if (!visibleRef.current || document.hidden || !canvasRef.current) return;
    if (needsPixelsRef.current && !initPixels()) return;
    if (reducedMotion.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      let currentColor;
      for (const pixel of pixelsRef.current) {
        if (pixel.color !== currentColor) { currentColor = pixel.color; ctx.fillStyle = currentColor; }
        pixel.size = name === 'appear' ? pixel.maxSize : 0;
        pixel.isIdle = name !== 'appear';
        if (pixel.size > 0) pixel.draw();
      }
      return;
    }
    timePreviousRef.current = performance.now() - 1000 / 30;
    timeDrawnRef.current = timePreviousRef.current;
    animationRef.current = requestAnimationFrame(() => doAnimate(name));
  };

  const syncInteraction = () => handleAnimation(
    interactionRef.current.hover || interactionRef.current.focus ? 'appear' : 'disappear'
  );
  const onMouseEnter = () => { interactionRef.current.hover = true; syncInteraction(); };
  const onMouseLeave = () => { interactionRef.current.hover = false; syncInteraction(); };
  const onFocus = e => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    interactionRef.current.focus = true;
    syncInteraction();
  };
  const onBlur = e => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    interactionRef.current.focus = false;
    syncInteraction();
  };

  useEffect(() => {
    const refresh = () => {
      needsPixelsRef.current = true;
      syncInteraction();
    };
    refresh();
    const observer = new ResizeObserver(refresh);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      handleAnimation(modeRef.current);
    });
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = event => { reducedMotion.current = event.matches; refresh(); };
    const onVisibilityChange = () => handleAnimation(modeRef.current);
    if (containerRef.current) {
      observer.observe(containerRef.current);
      visibilityObserver.observe(containerRef.current);
    }
    motionQuery.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      observer.disconnect();
      visibilityObserver.disconnect();
      motionQuery.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
      pixelsRef.current = [];
      needsPixelsRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalGap, finalSpeed, finalColors, finalNoFocus]);

  return (
    <div
      ref={containerRef}
      className={`pixel-card ${className}`}
      style={{ '--pixel-card-variant-color': variantCfg.activeColor || undefined, ...style }}
      role={ariaLabel ? 'group' : undefined}
      aria-label={ariaLabel}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={finalNoFocus ? undefined : onFocus}
      onBlur={finalNoFocus ? undefined : onBlur}
      tabIndex={finalNoFocus ? -1 : 0}
    >
      <canvas className="pixel-canvas" ref={canvasRef} aria-hidden="true" />
      {children}
    </div>
  );
}
