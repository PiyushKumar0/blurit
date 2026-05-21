import { loadSettings, onSettingsChanged, updateSettings } from '../shared/settings';
import type { SettingsPatch } from '../shared/settings';
import { COMMAND_TOGGLE_MASTER } from '../shared/constants';

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
    const commands = await chrome.commands.getAll();
    const cmd = commands.find((c) => c.name === COMMAND_TOGGLE_MASTER);
    if (cmd?.shortcut) shortcutKbd.textContent = cmd.shortcut;
    else shortcutKbd.textContent = 'unbound';
  } catch {
    // ignore — keep default text
  }
}

rebind.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

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
