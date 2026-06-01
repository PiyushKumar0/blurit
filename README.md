# BlurIt — WhatsApp Web Privacy Blur

Browser extension (Chrome + Firefox) that selectively blurs sensitive UI on `https://web.whatsapp.com` and reveals it on cursor hover. Four independent features, all CSS-driven for performance: chat list rows, chat header, message bubbles, and reveal-latest-message. Plus a per-contact whitelist that skips blur for low-sensitivity chats.

One source tree (`src/`) ships to both browsers. The Firefox build is a small post-processing transform on top of the Chrome build — same content scripts, same selectors, same CSS — so WhatsApp UI churn is fixed once, not twice.

---

## Install (dev)

```
npm install
```

Then follow whichever browser you're targeting:

### Chrome (or Edge)

```
npm run dev
```

Then in Chrome:
1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and pick the `dist/` directory.
4. Open `https://web.whatsapp.com` — blur applies after `#app` mounts.

`npm run dev` keeps `dist/` rebuilt; the content script hot-reloads via `@crxjs/vite-plugin`. Edits to `manifest.config.ts` require clicking the reload arrow on `chrome://extensions` because Chrome reads the manifest only at extension load.

### Firefox

```
npm run dev:firefox
```

This orchestrates `vite build --watch` → `scripts/transform-firefox.mjs` → `web-ext run`. A temporary Firefox profile is spawned with the extension already loaded and `web.whatsapp.com` opened. The extension auto-reloads when source files change.

If you'd rather load manually:
```
npm run build
```
then in Firefox:
1. Open `about:debugging`.
2. Click **This Firefox** → **Load Temporary Add-on…**.
3. Pick `dist-firefox/manifest.json`.

Firefox 140+ desktop is required (matches the `data_collection_permissions` schema key Mozilla now mandates — see `scripts/transform-firefox.mjs`).

---

## Build for stores

```
npm run build       # Chrome → dist/, Firefox → dist-firefox/
npm run zip         # dist/ → blurit-v<v>.zip + web-ext-artifacts/blurit-<v>.zip
```

Or per-target:

```
npm run build:chrome      # dist/
npm run build:firefox     # dist-firefox/ (assumes dist/ exists)
npm run zip:chrome        # Chrome Web Store
npm run zip:firefox       # AMO sideload (no signing — compatibility only)
```

`npm run lint:firefox` runs `web-ext lint` against `dist-firefox/` — must stay at zero errors and zero warnings before shipping.

AMO publication (signing, listing, source upload, privacy policy) is **out of scope** for this repo; the Firefox build is for sideload + local distribution. The `gecko.id` is a stable UUID, committed in `scripts/transform-firefox.mjs`.

---

## Keyboard shortcut

| Browser | Default | Rebind |
|---|---|---|
| Chrome | `Ctrl+Shift+B` (Mac: `Cmd+Shift+B`) | Popup → "Rebind…" → `chrome://extensions/shortcuts` |
| Firefox | `Ctrl+Shift+L` (Mac: `Cmd+Shift+L`) | Popup → pencil icon → press the new shortcut directly |

`Ctrl+Shift+B` is taken on Firefox (Bookmarks Toolbar), so the Firefox default uses `L` instead.

Firefox lets you rebind in-popup via `commands.update()` — Chrome doesn't expose this API, so the popup falls back to the manage-shortcuts page. The same source code drives both via a runtime `supportsCommandsRebind` capability flag.

---

## Settings

All settings sync via `chrome.storage.sync` (also written `browser.storage.sync` on Firefox):

- Master on/off
- Per-feature toggles: blur chat list / chat header / messages
- Always show latest message (reveals the bottom-most bubble in the open conversation)
- Blur intensity (4–16 px, default 8)
- Hover reveal delay (0–500 ms, default 200)
- Per-contact whitelist (exact case-insensitive match against the contact's display name)

Settings persist across sessions and devices signed into the same browser sync account.

---

## How it works (one paragraph)

The content script sets a few `data-*` attributes on `<html>` plus a couple of CSS custom properties (`--blurit-radius`, `--blurit-delay-in`). All actual blurring is done by static rules in `src/styles/blur.css` keyed off WhatsApp's own structural selectors (`#pane-side [role="row"][data-testid^="list-item-"]`, `#main [role="row"]`, `#main header`). Because the CSS rules don't depend on JS having tagged anything, a newly mounted (virtualized) chat row is blurred on its very first paint — no flash of unblurred content. A single `MutationObserver` rooted at `#app`, debounced via `requestAnimationFrame`, walks freshly mounted subtrees only to stamp `data-blurit-role` exclusions on the composer footer and date-separator rows, mark the latest message, and apply the whitelist.

---

## Selector resilience

WhatsApp's React class names rotate per deploy. `src/shared/selectors.ts` is the single file to update when WhatsApp ships a UI refactor. Each semantic role (`chatListRow`, `chatHeader`, `messageBubble`, `composer`, …) has a fallback chain anchored to stable IDs / ARIA landmarks (`#app`, `#pane-side`, `#main`, `[aria-label="Chat list"]`).

---

## Permissions

- `storage` — persist user settings.
- `host_permissions: https://web.whatsapp.com/*` — the only origin the extension ever touches.

No `<all_urls>`, no `tabs`, no `scripting`, no `activeTab`, no analytics, no network calls.

On Firefox, `about:addons` → BlurIt → Permissions lets the user revoke host access. Content scripts will stop running on the revoked origin until re-granted; settings stay intact. Chrome enforces the same listed permissions at install time and does not expose a runtime revoke toggle.

---

## Icons

The icon is authored as SVG (`public/icons/icon.svg`) and rasterised to the PNG sizes browsers need by a one-liner script:

```
npm run icons
```

This regenerates `public/icons/icon-{16,32,48,128}.png` from the SVG using `@resvg/resvg-js`. Commit both the SVG (source) and the PNGs (so contributors don't need to run the generator just to load the extension).

---

## Project layout

```
manifest.config.ts             ← MV3 manifest source-of-truth (Chrome-shaped)
vite.config.ts
src/
  content/                     ← injected into web.whatsapp.com at document_start
    index.ts                   ← entry: wait for #app, init engine + observer
    blur-engine.ts             ← applies <html> data-attrs + CSS vars
    observer.ts                ← MutationObserver + rAF flush
    tagger.ts                  ← stamps data-blurit-role exclusions + latest/whitelist marks
  popup/                       ← popup.html / .ts / .css (incl. FF rebind UI)
  background/                  ← service worker (keyboard shortcut handler)
  shared/                      ← types, defaults, constants, selectors, settings, browser-api
  styles/blur.css              ← the actual blur rules
public/icons/                  ← icon.svg (source) + generated PNGs
scripts/
  zip-for-store.mjs            ← packages dist/ → blurit-v<v>.zip for Chrome Web Store
  generate-icons.mjs           ← rasterises icon.svg → PNG sizes
  transform-firefox.mjs        ← dist/ → dist-firefox/, rewrites manifest for FF
  dev-firefox.mjs              ← vite-watch ↔ transform ↔ web-ext orchestrator
dist/                          ← Chrome output (gitignored)
dist-firefox/                  ← Firefox output, derived from dist/ (gitignored)
web-ext-artifacts/             ← Firefox zip output (gitignored)
```

The Firefox build is a **derivation** of the Chrome build, not a parallel build. `scripts/transform-firefox.mjs` only mutates `manifest.json` — assets and source files are copied verbatim, so crxjs's content-hashed asset filenames flow through unchanged.

---

## Threat model

**Protects against:** shoulder-surfing in public, casual webcam angles, screen-share calls where WhatsApp is open, recordings made by someone walking past.

**Does NOT protect against:** anyone with DOM access (other extensions, an attacker on the unlocked machine), screen-recording malware (blur is purely visual; the DOM is unchanged), accessibility tooling that exposes accessible names (intentional — screen readers must work).

No network calls. No remote code execution. No analytics. The only storage is the user's settings object via `storage.sync`, declared as `data_collection_permissions: "none"` on Firefox.
