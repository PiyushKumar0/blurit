import type { Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  master: true,
  features: { list: true, header: true, msgs: true },
  radiusPx: 8,
  delayMs: 200,
  revealLatest: false,
  whitelist: [],
};

export const RADIUS_MIN = 4;
export const RADIUS_MAX = 16;
export const DELAY_MIN = 0;
export const DELAY_MAX = 500;
