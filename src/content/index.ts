import { loadSettings, onSettingsChanged } from '../shared/settings';
import { applySettings } from './blur-engine';
import { startObserver } from './observer';
import { resolveOne } from '../shared/selectors';
import { DEFAULT_SETTINGS } from '../shared/defaults';

// Fail-safe-to-blur: apply defaults synchronously at document_start so the
// chat list / header / messages are blurred from the very first paint, before
// chrome.storage.sync returns. init() overwrites with the user's choices once
// storage resolves. Users who opted out (master=false) see a brief blur on
// load — acceptable cost for closing the shoulder-surf flash window.
applySettings(DEFAULT_SETTINGS);

async function init(): Promise<void> {
  const settings = await loadSettings();
  applySettings(settings);

  onSettingsChanged((next) => applySettings(next));

  const appRoot = await waitForAppRoot();
  startObserver(appRoot);
}

function waitForAppRoot(): Promise<Element> {
  const existing = resolveOne('appRoot');
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const found = resolveOne('appRoot');
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
}

init().catch((err) => {
  // Never break the page. Surface in console for support.
  // eslint-disable-next-line no-console
  console.error('[BlurIt] init failed', err);
});
