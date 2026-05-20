# BlurIt — WhatsApp Web Privacy Blur

Chrome extension that selectively blurs sensitive UI on `https://web.whatsapp.com` and reveals it on cursor hover. Three independent features, all CSS-driven for performance: chat list rows, chat header, and message bubbles.

## Install (dev)

```
npm install
npm run dev
```

Then in Chrome:
1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and pick the `dist/` directory.
4. Open `https://web.whatsapp.com` — blur applies after `#app` mounts.

`npm run dev` keeps `dist/` rebuilt; the extension hot-reloads its content script via `@crxjs/vite-plugin`. Edits to `manifest.config.ts` require clicking the reload arrow on `chrome://extensions` because Chrome reads the manifest only at extension load.

## Build for the Chrome Web Store

```
npm run build   # produces dist/
npm run zip     # produces blurit-v<version>.zip
```

Upload the zip in the Chrome Web Store dashboard.

## Keyboard shortcut

Default: `Ctrl+Shift+B` (Mac: `Cmd+Shift+B`). Toggles the master switch. Remap via `chrome://extensions/shortcuts`.

## Settings

All settings sync via `chrome.storage.sync`:
- Master on/off
- Per-feature toggles (list / header / messages)
- Blur intensity (4–16 px, default 8)
- Hover reveal delay (0–500 ms, default 200)

## How it works (one paragraph)

The content script sets a few `data-*` attributes on `<html>` plus a couple of CSS custom properties (`--blurit-radius`, `--blurit-delay-in`). All actual blurring is done by static rules in `src/styles/blur.css` keyed off WhatsApp's own structural selectors (`#pane-side [role="row"][data-testid^="list-item-"]`, `#main [role="row"]`, `#main header`). Because the CSS rules don't depend on JS having tagged anything, a newly mounted (virtualized) chat row is blurred on its very first paint — no flash of unblurred content. The currently open chat row stays crisp via `:not(:has([aria-selected="true"]))` (pure CSS, Chrome 116+). A single `MutationObserver` rooted at `#app`, debounced via `requestAnimationFrame`, walks freshly mounted subtrees only to stamp `data-blurit-role` exclusions on the composer footer and date-separator rows.

## Selector resilience

WhatsApp's React class names rotate per deploy. `src/shared/selectors.ts` is the single file to update when WhatsApp ships a UI refactor. Each semantic role (`chatListRow`, `chatHeader`, `messageBubble`, `composer`, …) has a fallback chain anchored to stable IDs / ARIA landmarks (`#app`, `#pane-side`, `#main`, `[aria-label="Chat list"]`).

## Permissions

- `storage` — persist user settings.
- `host_permissions: https://web.whatsapp.com/*` — the only origin the extension ever touches.

No `<all_urls>`, no `tabs`, no `scripting`, no `activeTab`, no analytics, no network calls.

## Icons

The icon is authored as SVG (`public/icons/icon.svg`) and rasterized to the PNG sizes Chrome needs by a one-liner script:

```
npm run icons
```

This regenerates `public/icons/icon-{16,32,48,128}.png` from the SVG using `@resvg/resvg-js`. Commit both the SVG (source) and the PNGs (so contributors don't need to run the generator just to load the extension).

## Project layout

```
manifest.config.ts        ← MV3 manifest (consumed by @crxjs/vite-plugin)
vite.config.ts
src/
  content/                ← injected into web.whatsapp.com at document_start
    index.ts              ← entry: wait for #app, init engine + observer
    blur-engine.ts        ← applies <html> data-attrs + CSS vars
    observer.ts           ← MutationObserver + rAF flush
    tagger.ts             ← stamps data-blurit-role exclusions
  popup/                  ← popup.html / .ts / .css
  background/             ← service worker (keyboard shortcut handler)
  shared/                 ← types, defaults, constants, selectors, settings
  styles/blur.css         ← the actual blur rules
public/icons/             ← icon.svg (source) + generated icon-{16,32,48,128}.png
scripts/
  zip-for-store.mjs       ← packages dist/ for store upload
  generate-icons.mjs      ← rasterizes icon.svg → PNG sizes
```

## Threat model

**Protects against:** shoulder-surfing in public, casual webcam angles, screen-share calls where WhatsApp is open, recordings made by someone walking past.

**Does NOT protect against:** anyone with DOM access (other extensions, an attacker on the unlocked machine), screen-recording malware (blur is purely visual; the DOM is unchanged), accessibility tooling that exposes accessible names (intentional — screen readers must work).
