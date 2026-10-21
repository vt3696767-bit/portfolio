import { memo } from 'react';

// One four-lobed outline is repeated throughout the gallery, like a maker's mark.
const quatrefoil = 'M100 100a100 100 0 0 1 200 0 100 100 0 0 1 0 200 100 100 0 0 1-200 0 100 100 0 0 1 0-200Z';

export function RosetteMark({ className = '', ...props }) {
  return <svg className={`gallery-rosette ${className}`} viewBox="-12 -12 424 424" fill="none" aria-hidden="true" focusable="false" {...props}>
    <path d={quatrefoil} stroke="currentColor" strokeWidth="9" />
    <text x="200" y="274" textAnchor="middle" fill="currentColor" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="216">S</text>
  </svg>;
}

export const GalleryOrnament = memo(function GalleryOrnament({ position }) {
  return <svg className={`gallery-ornament gallery-ornament--${position}`} viewBox="0 0 720 1200" fill="none" aria-hidden="true" focusable="false" data-renderer="static-svg">
    <g stroke="currentColor" strokeWidth="1">
      {[0, 1, 2].map(row => <g key={row} transform={`translate(-102 ${row * 414 - 126})`}>
        {[1, 0.97, 0.94, 0.87].map(scale => <path key={scale} d={quatrefoil} transform={`translate(${200 * (1 - scale)} ${200 * (1 - scale)}) scale(${scale})`} />)}
        <path d="M200 404v10M404 200h64" />
      </g>)}
    </g>
  </svg>;
});

export function GalleryDivider() {
  return <div className="gallery-divider" aria-hidden="true"><span /><RosetteMark /><span /></div>;
}
