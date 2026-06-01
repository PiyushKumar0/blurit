import { loadSettings, onSettingsChanged, updateSettings } from '../shared/settings';
import type { SettingsPatch } from '../shared/settings';
import { COMMAND_TOGGLE_MASTER } from '../shared/constants';
import api, { supportsCommandsRebind } from '../shared/browser-api';

type El<T extends HTMLElement = HTMLElement> = T;

function $<T extends HTMLElement>(id: string): El<T> {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing`);
  return el as El<T>;
}

const master = $<HTMLInputElement>('master');
const featureList = $<HTMLInputElement>('feature-list');
const featureHeader = $<HTMLInputElement>('feature-header');
const featureMsgs = $<HTMLInputElement>('feature-msgs');
const revealLatest = $<HTMLInputElement>('reveal-latest');
const radius = $<HTMLInputElement>('radius');
const radiusVal = $<HTMLOutputElement>('radius-val');
const delay = $<HTMLInputElement>('delay');
const delayVal = $<HTMLOutputElement>('delay-val');
const shortcutKbd = $<HTMLElement>('shortcut');
const rebind = $<HTMLAnchorElement>('rebind');
const rebindReset = $<HTMLButtonElement>('rebind-reset');
const captureBanner = $<HTMLDivElement>('capture-banner');
const captureMsg = captureBanner.querySelector<HTMLSpanElement>('.capture-msg')!;
const whitelistChips = $<HTMLDivElement>('whitelist-chips');
const whitelistForm = $<HTMLFormElement>('whitelist-form');
const whitelistInput = $<HTMLInputElement>('whitelist-input');
const toast = $<HTMLDivElement>('toast');

let toastTimer: number | undefined;
function showError(message: string): void {
  toast.textContent = message;
  toast.classList.add('show');
  if (toastTimer !== undefined) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('show');
    toastTimer = undefined;
  }, 3500);
}

function paint(settings: Awaited<ReturnType<typeof loadSettings>>): void {
  master.checked = settings.master;
  featureList.checked = settings.features.list;
  featureHeader.checked = settings.features.header;
  featureMsgs.checked = settings.features.msgs;
  revealLatest.checked = settings.revealLatest;
  radius.value = String(settings.radiusPx);
  radiusVal.value = `${settings.radiusPx}px`;
  delay.value = String(settings.delayMs);
  delayVal.value = `${settings.delayMs}ms`;

  const disabled = !settings.master;
  for (const input of [featureList, featureHeader, featureMsgs, revealLatest, radius, delay]) {
    input.disabled = disabled;
  }
  renderWhitelist(settings.whitelist);
}

function renderWhitelist(names: string[]): void {
  whitelistChips.replaceChildren();
  for (const name of names) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    const label = document.createElement('span');
    label.textContent = name;
    label.title = name;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remove ${name}`);
    remove.addEventListener('click', () => {
      updateWhitelist((current) => current.filter((n) => n !== name));
    });
    chip.append(label, remove);
    whitelistChips.append(chip);
  }
}

function updateWhitelist(compute: (current: string[]) => string[]): void {
  updateSettings((current) => ({ whitelist: compute(current.whitelist) })).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[BlurIt] whitelist save failed', err);
    showError("Couldn't save the contact list. Try again.");
  });
}

whitelistForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = whitelistInput.value.trim();
  if (!raw) return;
  whitelistInput.value = '';
  const lower = raw.toLowerCase();
  updateWhitelist((current) =>
    current.some((n) => n.toLowerCase() === lower) ? current : [...current, raw],
  );
});

async function showCurrentShortcut(): Promise<void> {
  try {
    const commands = await api.commands.getAll();
    const cmd = commands.find((c) => c.name === COMMAND_TOGGLE_MASTER);
    if (cmd?.shortcut) shortcutKbd.textContent = cmd.shortcut;
    else shortcutKbd.textContent = 'unbound';
  } catch {
    // ignore — keep default text
  }
}

// ─── Rebind UI ─────────────────────────────────────────────────────────────
//
// On Chrome the only option is to open the manage-shortcuts page (there's no
// runtime API for it). On Firefox we have commands.update / commands.reset,
// so an inline keystroke-capture flow lives in the popup instead.
//
// Visibility is driven by `supportsCommandsRebind`, a runtime check rather
// than a build flag so the same code ships to both engines.

// navigator.platform is deprecated; the modern read uses userAgentData when
// present (Chromium 90+) and falls back to userAgent everywhere else (Firefox
// doesn't ship userAgentData yet but exposes 'Mac' in its UA on macOS).
const IS_MAC = (() => {
  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } })
    .userAgentData;
  if (uaData?.platform) return uaData.platform === 'macOS';
  return /Mac/i.test(navigator.userAgent);
})();

if (supportsCommandsRebind) {
  // Firefox: "Rebind…" link launches the in-popup keystroke-capture flow.
  // A small "Reset" button appears next to it for reverting to the default.
  // No separate pencil button: the link is already labelled for the action.
  rebindReset.hidden = false;
  rebind.addEventListener('click', (e) => {
    e.preventDefault();
    startCapture();
  });
  rebindReset.addEventListener('click', () => {
    void resetShortcut();
  });
} else {
  // Chrome: the runtime exposes no commands.update / commands.reset, so the
  // best we can do is open the dedicated shortcuts manager page.
  rebind.addEventListener('click', (e) => {
    e.preventDefault();
    api.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });
}

let capturing = false;
let captureKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
let captureErrorTimer: number | undefined;

function startCapture(): void {
  if (capturing) return;
  capturing = true;
  captureBanner.classList.remove('error');
  captureMsg.textContent = 'Press a shortcut…';
  captureBanner.hidden = false;
  captureKeydownHandler = (e) => handleCaptureKeydown(e);
  // capture phase so we beat any other popup-level handlers.
  window.addEventListener('keydown', captureKeydownHandler, true);
}

function stopCapture(): void {
  if (!capturing) return;
  capturing = false;
  if (captureKeydownHandler) {
    window.removeEventListener('keydown', captureKeydownHandler, true);
    captureKeydownHandler = null;
  }
  captureBanner.hidden = true;
  captureBanner.classList.remove('error');
}

function showCaptureError(msg: string): void {
  captureBanner.classList.add('error');
  captureMsg.textContent = msg;
  if (captureErrorTimer !== undefined) clearTimeout(captureErrorTimer);
  captureErrorTimer = window.setTimeout(() => {
    captureErrorTimer = undefined;
    if (capturing) {
      captureBanner.classList.remove('error');
      captureMsg.textContent = 'Press a shortcut…';
    }
  }, 2200);
}

function handleCaptureKeydown(e: KeyboardEvent): void {
  e.preventDefault();
  e.stopPropagation();

  if (e.key === 'Escape') {
    stopCapture();
    return;
  }

  // Ignore lone modifier presses — wait for the user to commit to a
  // non-modifier key.
  if (isModifierKey(e.key)) return;

  const built = buildShortcut(e);
  if (!built.ok) {
    showCaptureError(built.error);
    return;
  }

  const shortcut = built.shortcut;
  void persistShortcut(shortcut);
}

type ShortcutResult = { ok: true; shortcut: string } | { ok: false; error: string };

function buildShortcut(e: KeyboardEvent): ShortcutResult {
  const modifiers: string[] = [];
  // Order matters: Firefox expects modifiers before the key, joined by '+'.
  // On macOS, MacCtrl maps to Control, Command to ⌘. Firefox accepts either
  // Ctrl or Command as the primary modifier; we prefer Command on Mac.
  if (IS_MAC) {
    if (e.metaKey) modifiers.push('Command');
    if (e.ctrlKey) modifiers.push('MacCtrl');
  } else if (e.ctrlKey) {
    modifiers.push('Ctrl');
  }
  if (e.altKey) modifiers.push('Alt');
  if (e.shiftKey) modifiers.push('Shift');

  const mainKey = normaliseKey(e);
  if (!mainKey) {
    return { ok: false, error: 'Unsupported key — try a letter, digit, or function key' };
  }

  // Firefox rule (Windows/Linux): must contain Ctrl or Alt. Shift alone is
  // accepted only for a tiny allowlist (Shift+F1..F12 etc.). We allow it but
  // let the API surface a clearer error if Firefox rejects the combo.
  const hasPrimary = IS_MAC
    ? modifiers.includes('Command') || modifiers.includes('MacCtrl')
    : modifiers.includes('Ctrl') || modifiers.includes('Alt');
  if (!hasPrimary) {
    return {
      ok: false,
      error: IS_MAC ? 'Need Command or Control' : 'Need Ctrl or Alt',
    };
  }

  return { ok: true, shortcut: [...modifiers, mainKey].join('+') };
}

function isModifierKey(key: string): boolean {
  return (
    key === 'Control' ||
    key === 'Shift' ||
    key === 'Alt' ||
    key === 'Meta' ||
    key === 'OS' ||
    key === 'AltGraph'
  );
}

function normaliseKey(e: KeyboardEvent): string | null {
  // Firefox's allowed-key list: A-Z, 0-9, F1-F19, plus a named-key set.
  // Mapping is done off e.code where stable (KeyA, Digit1) with fallbacks
  // off e.key for named keys whose `code` is implementation-defined.
  const code = e.code;
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^F([1-9]|1[0-9])$/.test(code)) return code;

  const named: Record<string, string> = {
    Comma: 'Comma',
    Period: 'Period',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    Space: 'Space',
    Insert: 'Insert',
    Delete: 'Delete',
    Tab: 'Tab',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    MediaTrackNext: 'MediaNextTrack',
    MediaTrackPrevious: 'MediaPrevTrack',
    MediaPlayPause: 'MediaPlayPause',
    MediaStop: 'MediaStop',
  };
  return named[code] ?? null;
}

async function persistShortcut(shortcut: string): Promise<void> {
  try {
    await api.commands.update({ name: COMMAND_TOGGLE_MASTER, shortcut });
    // Race-safe: re-read from the engine rather than trusting our string.
    await showCurrentShortcut();
    stopCapture();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[BlurIt] commands.update failed', err);
    const msg = err instanceof Error ? err.message : 'Could not bind shortcut';
    showCaptureError(msg);
  }
}

async function resetShortcut(): Promise<void> {
  try {
    await api.commands.reset(COMMAND_TOGGLE_MASTER);
    await showCurrentShortcut();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[BlurIt] commands.reset failed', err);
    showError("Couldn't reset shortcut. Try again.");
  }
}

function persist(patch: SettingsPatch): void {
  updateSettings(patch).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[BlurIt] save failed', err);
    showError("Couldn't save settings. Try again.");
  });
}

// Trailing debounce so slider drags don't blow chrome.storage.sync's
// 120-writes-per-minute quota. The <output> label updates live for feedback;
// only the persisted value waits.
function makeDebouncedPersist(ms: number): (patch: SettingsPatch) => void {
  let timer: number | undefined;
  return (patch) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = undefined;
      persist(patch);
    }, ms);
  };
}
const persistSlider = makeDebouncedPersist(150);

master.addEventListener('change', () => {
  persist({ master: master.checked });
});
featureList.addEventListener('change', () => {
  persist({ features: { list: featureList.checked } });
});
featureHeader.addEventListener('change', () => {
  persist({ features: { header: featureHeader.checked } });
});
featureMsgs.addEventListener('change', () => {
  persist({ features: { msgs: featureMsgs.checked } });
});
revealLatest.addEventListener('change', () => {
  persist({ revealLatest: revealLatest.checked });
});

radius.addEventListener('input', () => {
  const px = Number(radius.value);
  radiusVal.value = `${px}px`;
  persistSlider({ radiusPx: px });
});
delay.addEventListener('input', () => {
  const ms = Number(delay.value);
  delayVal.value = `${ms}ms`;
  persistSlider({ delayMs: ms });
});

onSettingsChanged((next) => paint(next));

void (async () => {
  paint(await loadSettings());
  await showCurrentShortcut();
})();
