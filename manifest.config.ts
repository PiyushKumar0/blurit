import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

export default defineManifest({
  manifest_version: 3,
  name: 'BlurIt — WhatsApp Web Privacy Blur',
  version: pkg.version,
  description: pkg.description,
  minimum_chrome_version: '116',

  permissions: ['storage'],
  host_permissions: ['https://web.whatsapp.com/*'],

  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },

  action: {
    default_title: 'BlurIt',
    default_popup: 'src/popup/popup.html',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
    },
  },

  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },

  content_scripts: [
    {
      matches: ['https://web.whatsapp.com/*'],
      js: ['src/content/index.ts'],
      css: ['src/styles/blur.css'],
      run_at: 'document_start',
      all_frames: false,
    },
  ],

  commands: {
    'toggle-master': {
      suggested_key: { default: 'Ctrl+Shift+B', mac: 'Command+Shift+B' },
      description: 'Toggle BlurIt master switch',
    },
  },
});
