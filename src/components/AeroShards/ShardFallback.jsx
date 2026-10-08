import { memo, useEffect, useRef, useState } from 'react';
import './ShardFallback.css';

const fraction = value => value - Math.floor(value);
const shards = Array.from({ length: 150 }, (_, index) => {
  const phase = fraction(index * 0.61803398875);
  const scatter = fraction(Math.sin(index * 127.1 + 311.7) * 43758.5453);
  return {
    x: -100 + phase * 1400,
    y: 425 + Math.sin((phase * 1.72 - .2) * Math.PI) * 160 + (scatter - .5) * 220,
    size: 6 + fraction(index * .754877666) * 17,
    angle: -75 + fraction(index * .569840291) * 180,
    layer: index % 3,
  };
});

// A lightweight folded-paper background for browsers without WebGPU.
export default memo(function ShardFallback() {
  const root = useRef(null);
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    let inView = false;
    const update = () => setMoving(inView && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    });
    observer.observe(root.current);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return <svg ref={root} className="shards-fallback" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" data-moving={moving} aria-hidden="true">
    <defs><linearGradient id="shards-paper-light" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#f8f0d6" /><stop offset="45%" stopColor="#ebdda9" /><stop offset="100%" stopColor="#cfb76f" />
    </linearGradient></defs>
    {[0, 1, 2].map(layer => <g key={layer} className={`shards-fallback-flow shards-fallback-flow-${layer}`}>
      {shards.filter(shard => shard.layer === layer).map((shard, index) => <g key={index} transform={`translate(${shard.x} ${shard.y}) rotate(${shard.angle}) scale(${shard.size})`}>
        <path d="M-1.3-.3 .5-.65 1.6.1 .15.6Z" fill="url(#shards-paper-light)" opacity=".8" />
        <path d="M-1.3-.3 .15.1 .15.6Z" fill="#cfb76f" opacity=".4" />
        <path d="M-1.3-.3 .15.1 1.6.1" fill="none" stroke="#f8f0d6" strokeWidth=".025" opacity=".9" />
      </g>)}
    </g>)}
  </svg>;
});
