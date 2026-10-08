export const FRAME_STATES = {
  interactive: { interval: 1000 / 60, continuous: true },
  settling: { interval: 1000 / 60, continuous: true },
  ambient: { interval: 1000 / 30, continuous: false },
  partial: { interval: 1000 / 12, continuous: false },
};

export function resolveRenderDpr(preset, width, height, deviceDpr = 1) {
  const pixels = Math.max(1, width * height);
  const budget = Math.min(preset.supersamplePixels, 2_500_000);
  // The decorative background can be downsampled on very large displays.
  return Math.min(deviceDpr || 1, preset.dpr, 1.25, Math.sqrt(budget / pixels));
}

export const resolveCanvasSize = (width, height, dpr) => [
  Math.max(1, Math.floor(width * dpr)),
  Math.max(1, Math.floor(height * dpr)),
];
