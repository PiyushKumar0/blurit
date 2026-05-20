import { COMMAND_TOGGLE_MASTER } from '../shared/constants';
import { loadSettings, updateSettings } from '../shared/settings';

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== COMMAND_TOGGLE_MASTER) return;
  try {
    const current = await loadSettings();
    await updateSettings({ master: !current.master });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[BlurIt] toggle-master failed', err);
  }
});
