import { useLayoutEffect, useRef } from 'react';
import { createPortfolioMotion } from './createPortfolioMotion';

export default function usePortfolioMotion(rootRef) {
  const openingPlayed = useRef(false);
  useLayoutEffect(() => {
    if (!rootRef.current) return;
    let controller;
    try {
      controller = createPortfolioMotion(rootRef.current, openingPlayed);
    } catch (error) {
      controller?.destroy();
      console.warn('Portfolio motion could not initialize.', error);
    }
    return () => controller?.destroy();
  }, [rootRef]);
}
