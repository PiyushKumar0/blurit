// Firefox dev orchestrator: bridges vite (writes dist/) → transform-firefox
// (writes dist-firefox/) → web-ext (reloads the extension in a running FF).
//
// Goal: a single command (`npm run dev:firefox`) gives a hands-off inner loop
// comparable to crxjs's Chrome HMR. Reload latency on web-ext (~1s) is
// slower than HMR, but acceptable.

import { spawn } from 'node:child_process';
import { watch, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const DIST_FIREFOX_MANIFEST = join(ROOT, 'dist-firefox', 'manifest.json');
const TRANSFORM = join(__dirname, 'transform-firefox.mjs');

const IS_WIN = process.platform === 'win32';
const NPX = IS_WIN ? 'npx.cmd' : 'npx';
const NODE = process.execPath;

const children = new Set();

function quoteForWinShell(arg) {
  // Quote args containing spaces or shell metas so cmd.exe forwards them
  // intact. URLs (= colons + slashes) are safe unquoted; paths with spaces
  // (e.g. firefox.exe under Program Files) are not.
  if (!/[\s"^&|<>()%!]/.test(arg)) return arg;
  return `"${arg.replace(/"/g, '""')}"`;
}

function spawnTracked(cmd, args, opts = {}) {
  // stdio inherit so vite + web-ext logs reach the user.
  if (IS_WIN && cmd.endsWith('.cmd')) {
    const cmdline = [cmd, ...args.map(quoteForWinShell)].join(' ');
    const child = spawn(cmdline, {
      stdio: 'inherit',
      cwd: ROOT,
      shell: true,
      ...opts,
    });
    children.add(child);
    child.on('exit', () => children.delete(child));
    return child;
  }
  const child = spawn(cmd, args, { stdio: 'inherit', cwd: ROOT, ...opts });
  children.add(child);
  child.on('exit', () => children.delete(child));
  return child;
}

function runTransform() {
  return new Promise((resolve) => {
    // Reuse the same node binary that's running this script.
    const child = spawnTracked(NODE, [TRANSFORM], {
      stdio: 'inherit',
      env: { ...process.env, BLURIT_DEV_WATCH: '1' },
    });
    child.on('exit', (code) => resolve(code ?? 0));
  });
}

let transformPending = false;
let transformRunning = false;
let debounceTimer = null;

function scheduleTransform() {
  // 200ms debounce: vite's emptyOutDir deletes manifest.json before
  // rewriting it, and asset emission takes a few ms. A shorter debounce
  // catches the partial-write state and transforms an incomplete tree.
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    debounceTimer = null;
    if (transformRunning) {
      // Coalesce a follow-up if another write came in mid-transform.
      transformPending = true;
      return;
    }
    transformRunning = true;
    try {
      await runTransform();
      // transform-firefox.mjs exits 0 even on the quiet-bail path (when
      // dist/manifest.json isn't ready yet), so check for the output
      // manifest instead of trusting the exit code.
      if (existsSync(DIST_FIREFOX_MANIFEST)) startWebExtOnce();
    } catch (err) {
      console.error('[dev:firefox] transform failed:', err);
    } finally {
      transformRunning = false;
      if (transformPending) {
        transformPending = false;
        scheduleTransform();
      }
    }
  }, 200);
}

function watchDist() {
  if (!existsSync(DIST)) {
    // vite will create it on first build; recheck once it shows up.
    setTimeout(watchDist, 500);
    return;
  }
  // Watch the directory, not the file: vite's emptyOutDir unlinks
  // manifest.json before rewriting it, and fs.watch on a file is bound
  // to its inode. Filename is null on some platforms, so fall
  // through to schedule unconditionally; the transform is debounced.
  watch(DIST, { persistent: true }, (_event, filename) => {
    if (!filename || filename === 'manifest.json') scheduleTransform();
  });
}

function shutdown(signal) {
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
  // Give children a beat to exit cleanly before we do.
  setTimeout(() => process.exit(0), 200);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// web-ext run reloads on dist-firefox/ changes.
let webExtStarted = false;
function startWebExtOnce() {
  if (webExtStarted) return;
  webExtStarted = true;
  const webExtArgs = [
    'web-ext',
    'run',
    '--source-dir=dist-firefox',
    '--target=firefox-desktop',
    '--start-url=https://web.whatsapp.com',
  ];
  if (process.env.FIREFOX_BINARY) {
    webExtArgs.push(`--firefox=${process.env.FIREFOX_BINARY}`);
  }
  spawnTracked(NPX, webExtArgs);
}

// 1. vite watch-build → writes dist/
spawnTracked(NPX, ['vite', 'build', '--watch']);

// 2. dist-side watcher → transform → dist-firefox/ → starts web-ext on first success
watchDist();
