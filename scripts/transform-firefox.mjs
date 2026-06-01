// Derives a Firefox-shaped dist-firefox/ from the Chrome dist/ produced by
// vite + @crxjs/vite-plugin. Pure Node, no deps.
import {
  cpSync,
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'dist');
const DEST = join(ROOT, 'dist-firefox');

// Locked once via crypto.randomUUID(). Do NOT regenerate — Firefox treats
// gecko.id as the extension's stable identity across versions. UUID form is
// preferred over email form: it passes web-ext lint strictly and never
// collides with someone else's address.
const GECKO_ID = '{dfe88074-655a-48d2-bd67-03705c240a29}';

// Floor: Firefox 140+.
//   - :has() in JS querySelector (used in tagger.ts) needs FF 121+, satisfied.
//   - browser_specific_settings.gecko.data_collection_permissions is a
//     schema key introduced in Firefox 140 (desktop) / 142 (Android), and is
//     now required by Mozilla on new extensions. Setting the floor at 140
//     lets us declare it honestly without web-ext lint warning about an
//     unsupported manifest key on older releases.
//   - FF 140 was the July 2025 release and the current ESR baseline, so the
//     floor is well below the active user fleet.
const STRICT_MIN_VERSION = '140.0';

const FIREFOX_SHORTCUT = {
  default: 'Ctrl+Shift+L',
  mac: 'Command+Shift+L',
};

function ensureSrcExists() {
  // Returns true if ready, false if we should bail quietly. The watch-mode
  // caller (dev-firefox.mjs) can fire while vite is mid-rebuild (emptyOutDir
  // deletes then re-writes manifest.json); bailing quietly avoids alarming
  // stack traces — the watcher will fire again once the new manifest lands.
  if (!existsSync(SRC) || !existsSync(join(SRC, 'manifest.json'))) {
    const standalone = !process.env.BLURIT_DEV_WATCH;
    if (standalone) {
      throw new Error(
        `dist/ or dist/manifest.json missing at ${SRC}. ` +
          `Run \`npm run build:chrome\` (or \`npm run build\`) first.`,
      );
    }
    console.warn('[transform-firefox] dist/manifest.json not ready yet, skipping');
    return false;
  }
  return true;
}

function freshCopy() {
  // Defensive: a fresh copy removes stale artefacts when source-side files
  // are deleted between builds. Tree is small (~30 files), so the cost is
  // negligible vs. content-hash skip logic.
  rmSync(DEST, { recursive: true, force: true });
  cpSync(SRC, DEST, { recursive: true });
}

function transformManifest() {
  const path = join(DEST, 'manifest.json');
  const m = JSON.parse(readFileSync(path, 'utf8'));

  // 1. background.service_worker → background.scripts[]
  if (m.background?.service_worker) {
    m.background = {
      scripts: [m.background.service_worker],
      type: m.background.type ?? 'module',
    };
  }

  // 2. inject browser_specific_settings
  //
  // data_collection_permissions: "none" — Mozilla now requires this key on
  // new extensions (and will require it on updates to existing ones). BlurIt
  // makes zero network calls and only persists settings via storage.sync
  // (the user's own data syncing across their own devices, which Mozilla
  // does not classify as data collection). "none" is the honest declaration.
  //
  // gecko_android.strict_min_version: 142.0 — the schema key
  // data_collection_permissions landed on Android one release later than on
  // desktop. The plan defers Android support, but declaring the Android
  // floor explicitly silences the web-ext lint warning without committing
  // us to anything beyond what shipping on desktop already implies.
  m.browser_specific_settings = {
    gecko: {
      id: GECKO_ID,
      strict_min_version: STRICT_MIN_VERSION,
      data_collection_permissions: { required: ['none'] },
    },
    gecko_android: {
      strict_min_version: '142.0',
    },
  };

  // 3. swap suggested_key
  if (m.commands?.['toggle-master']) {
    m.commands['toggle-master'].suggested_key = { ...FIREFOX_SHORTCUT };
  }

  // 4. strip web_accessible_resources[*].use_dynamic_url
  if (Array.isArray(m.web_accessible_resources)) {
    for (const entry of m.web_accessible_resources) {
      delete entry.use_dynamic_url;
    }
  }

  // 5. strip minimum_chrome_version
  delete m.minimum_chrome_version;

  writeFileSync(path, JSON.stringify(m, null, 2) + '\n');
}

function summary() {
  let fileCount = 0;
  let bytes = 0;
  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else {
        fileCount++;
        bytes += st.size;
      }
    }
  };
  walk(DEST);
  const kb = (bytes / 1024).toFixed(1);
  console.log(`dist-firefox/ ready — ${fileCount} files, ${kb} KB`);
}

if (ensureSrcExists()) {
  freshCopy();
  transformManifest();
  summary();
}
