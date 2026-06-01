import type { FeatureToggles, Settings } from './types';
import { DEFAULT_SETTINGS, RADIUS_MAX, RADIUS_MIN, DELAY_MAX, DELAY_MIN } from './defaults';
import { STORAGE_KEY } from './constants';
import api from './browser-api';

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function sanitize(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_SETTINGS };
  const s = raw as Partial<Settings>;
  const features = s.features ?? DEFAULT_SETTINGS.features;
  return {
    master: typeof s.master === 'boolean' ? s.master : DEFAULT_SETTINGS.master,
    features: {
      list: typeof features.list === 'boolean' ? features.list : true,
      header: typeof features.header === 'boolean' ? features.header : true,
      msgs: typeof features.msgs === 'boolean' ? features.msgs : true,
    },
    radiusPx: clamp(
      typeof s.radiusPx === 'number' ? s.radiusPx : DEFAULT_SETTINGS.radiusPx,
      RADIUS_MIN,
      RADIUS_MAX,
    ),
    delayMs: clamp(
      typeof s.delayMs === 'number' ? s.delayMs : DEFAULT_SETTINGS.delayMs,
      DELAY_MIN,
      DELAY_MAX,
    ),
    revealLatest:
      typeof s.revealLatest === 'boolean' ? s.revealLatest : DEFAULT_SETTINGS.revealLatest,
    whitelist: sanitizeWhitelist(s.whitelist),
  };
}

function sanitizeWhitelist(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export async function loadSettings(): Promise<Settings> {
  const stored = await api.storage.sync.get(STORAGE_KEY);
  return sanitize(stored[STORAGE_KEY]);
}

export async function saveSettings(next: Settings): Promise<void> {
  await api.storage.sync.set({ [STORAGE_KEY]: sanitize(next) });
}

export type SettingsPatch = Partial<Omit<Settings, 'features'>> & {
  features?: Partial<FeatureToggles>;
};

let writeChain: Promise<unknown> = Promise.resolve();

export function updateSettings(
  patchOrFn: SettingsPatch | ((current: Settings) => SettingsPatch),
): Promise<Settings> {
  const result = writeChain.then(async () => {
    const current = await loadSettings();
    const patch = typeof patchOrFn === 'function' ? patchOrFn(current) : patchOrFn;
    const merged: Settings = {
      ...current,
      ...patch,
      features: { ...current.features, ...(patch.features ?? {}) },
    };
    await saveSettings(merged);
    return merged;
  });
  // Re-anchor past errors so a transient failure doesn't poison the chain.
  writeChain = result.catch(() => undefined);
  return result;
}

export type SettingsListener = (next: Settings, prev: Settings) => void;

export function onSettingsChanged(listener: SettingsListener): () => void {
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: chrome.storage.AreaName,
  ) => {
    if (area !== 'sync') return;
    const change = changes[STORAGE_KEY];
    if (!change) return;
    const next = sanitize(change.newValue);
    const prev = sanitize(change.oldValue);
    listener(next, prev);
  };
  api.storage.onChanged.addListener(handler);
  return () => api.storage.onChanged.removeListener(handler);
}
