# BlurIt

**A privacy layer for WhatsApp Web.** Blurs sensitive parts of the page until you hover over them, so the people sitting next to you (or watching your screen-share) can't read your chats.

Works on **Chrome**, **Edge**, and **Firefox**.

---

## Why BlurIt?

You're in a café. On a Zoom call sharing your screen. Or in an open-plan office. WhatsApp Web is open in another tab, and anyone who glances over can read everything: who's messaging you, what they said, the photos they sent.

BlurIt fixes that. It softly blurs three sensitive areas of WhatsApp Web until you intentionally hover them with your cursor. **You** can still read your chats. **Everyone else** sees only fuzz.

```
┌─────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░  WhatsApp                ●  📞  ⋮    │
├────────────────────┬────────────────────────────────┤
│ ░░░░░░░░ ░░       │  ░░░░░░░░░░░░░░░  (chat header) │
│ ░░░░░░░░░░ ░░░    ├─────────────────────────────────┤
│ ░░░░░ ░░░         │                                 │
│ ░░░░░░░░ ░░░░░    │   ░░░░░░░░░░░░░░░░░░░           │
│ ░░ ░░░░░░ ░░░     │   ░░░░░░░░░░░░░░ ░░░░           │
│   (chat list)     │   ░░░░░░░░ ░░░░░░░░░░░░         │
│                   │                                 │
│                   │   ░░░░░░░░░░░░░░░░░░            │
│                   │   ░░░░░ ░░░░░░░                 │
│                   │  (messages)                     │
│                   ├─────────────────────────────────┤
│                   │Type a message... (never blurred)│
└───────────────────┴─────────────────────────────────┘
```

Hover anywhere on a blurred row → it un-blurs after a moment. Move your mouse away → it re-blurs instantly.

---

## What it blurs

| Area | What you'd otherwise expose |
|---|---|
| **Chat list** (the left pane) | Names of every person you talk to + a preview of their latest message |
| **Chat header** (the top bar) | The contact's **name** and **profile picture** at the top of the open conversation |
| **Message bubbles** (the conversation) | Every message you've sent and received, plus media, voice notes, replies, and link previews |

Each can be turned on or off independently.

## What it *doesn't* blur

So the extension stays useful:

- The **text box** where you type your reply
- The **status line** under the contact's name in the header ("online", "typing…", "last seen…"); it's a useful presence cue and reveals little on its own
- The **call / video / search / menu** buttons in the chat header, so you can still click them
- **Date separators** ("Today", "Yesterday") and the end-to-end encryption notice, no private info
- The chat you currently have **open** in the list, so you know which conversation you're in

---

## Features

- **Hover to reveal.** Blurred by default. Move your cursor over an area to un-blur it.
- **Master switch.** One toggle (or a keyboard shortcut) to turn everything off when you don't need it.
- **Independent toggles.** Blur chat list / chat header / messages on or off separately.
- **Whitelist contacts.** Pick contacts whose conversations should never be blurred (e.g. delivery bots, news feeds, your own notes).
- **Always show latest message.** *Optional.* Keeps the most recent message in the open chat visible at all times, while blurring everything above it, so you don't miss new replies without un-blurring the history.
- **Adjustable blur intensity.** Slide between subtle (4px) and unreadable (16px).
- **Adjustable reveal delay.** Tune how patient you want to be (0–500ms) before a hover reveals.
- **Keyboard shortcut.** Toggle master on/off without opening the popup.
- **Syncs across your devices.** Settings travel with your browser account.
- **Zero data collection.** No network calls. No analytics. No tracking. Ever.

---

## Quick start

### Step 1 — Build the extension

Open a terminal in this folder and run:

```
npm install
npm run build
```

That gives you two folders:

- `dist/` - for Chrome and Edge
- `dist-firefox/` - for Firefox

### Step 2 — Load it into your browser

<details open>
<summary><b>Chrome or Edge</b></summary>

1. Open a new tab and go to **`chrome://extensions`** (or `edge://extensions`)
2. Turn on **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Pick the **`dist`** folder from this project

</details>

<details>
<summary><b>Firefox</b> (requires Firefox 140 or later)</summary>

1. Open a new tab and go to **`about:debugging`**
2. Click **This Firefox** in the left sidebar
3. Click **Load Temporary Add-on…**
4. Navigate into **`dist-firefox`** and pick **`manifest.json`**

> Firefox unloads temporary add-ons when you close the browser. To use BlurIt again next time, repeat the load step. *(This is how Firefox handles unsigned extensions)*

</details>

### Step 3 — Open WhatsApp

Go to **`https://web.whatsapp.com`** and log in. Blur applies as soon as the page loads.

That's it.

---

## How to use it

Click the **BlurIt icon** in your browser toolbar to open the settings popup. Here's what each control does:

```
╔══════════════════════════════╗
║  BlurIt              ▢━━●    ║   ← master switch
╠══════════════════════════════╣
║  FEATURES                    ║
║  Blur chat list      ▢━━●    ║   ← independent toggles
║  Blur chat header    ▢━━●    ║
║  Blur messages       ▢━━●    ║
║    Always show       ●━━▢    ║   ← reveals just the bottom message
║    latest message            ║
╠══════════════════════════════╣
║  TUNING                      ║
║  Blur intensity              ║
║    ●━━━━━━━━━━━━━━━━━━━━ 8px ║   ← slide left (subtler) or right (heavier)
║  Reveal delay                ║
║    ━━━●━━━━━━━━━━━━━━━ 200ms ║   ← how long to hover before un-blurring
╠══════════════════════════════╣
║  NEVER BLUR THESE CONTACTS   ║
║  [Mom ✕] [Order Bot ✕]      ║   ← per-contact whitelist
║  Contact name…       [Add]   ║
╠══════════════════════════════╣
║  Shortcut: Ctrl+Shift+B      ║
║                  Rebind…     ║
╚══════════════════════════════╝
```

### Keyboard shortcut

Toggle the master switch without opening the popup:

| Browser | Default shortcut | How to change it |
|---|---|---|
| Chrome / Edge | `Ctrl+Shift+B` (Mac: `⌘+Shift+B`) | Popup → **Rebind…** → opens the browser's shortcuts page |
| Firefox | `Ctrl+Shift+L` (Mac: `⌘+Shift+L`) | Popup → **Rebind…** → press your new combo directly |

> Firefox uses `L` instead of `B` because `Ctrl+Shift+B` already opens the Bookmarks Toolbar in Firefox.

### Whitelist

Add a contact by typing their name exactly as it appears in WhatsApp (case doesn't matter). When that conversation is open, the messages and header won't be blurred. The contact's row in the chat list is also kept clear so you can find it easily.

Remove a contact by clicking the **✕** next to their name in the popup.

### "Always show latest message"

Turn this on if you don't want to keep hovering just to check whether you got a new message. The bottom-most bubble in the conversation stays unblurred. Everything above stays blurred until you hover.

---

## Frequently asked questions

<details>
<summary><b>Does BlurIt read my messages?</b></summary>

No. BlurIt only adds CSS classes to the page. It never reads the actual message text, contact names, or media. Nothing is sent anywhere.

</details>

<details>
<summary><b>Does it work in WhatsApp's dark mode?</b></summary>

Yes. The blur happens at the pixel level, so it works in both light and dark themes without any extra configuration.

</details>

<details>
<summary><b>Can people with screen-recording software still see my messages?</b></summary>

Yes, the blur is purely visual. BlurIt protects you from people glancing at your screen, not from software running on your computer. See [Privacy and security](#privacy-and-security) below.

</details>

<details>
<summary><b>Will my settings sync to my other computers?</b></summary>

Yes, through your Chrome or Firefox account sync. No external server is involved; BlurIt simply uses your browser's built-in sync.

</details>

<details>
<summary><b>The blur stopped working after a WhatsApp update. What do I do?</b></summary>

WhatsApp occasionally ships UI changes that move the elements BlurIt targets. The fix is usually a one-line change to `src/shared/selectors.ts`. Open an issue and it'll be patched.

</details>

<details>
<summary><b>Why aren't there any blurring effects on the message I'm typing?</b></summary>

By design. The text box where you type your reply is never blurred, otherwise you couldn't read what you were typing.

</details>

---

## Privacy and security

BlurIt collects **zero** data:

- **No network calls.** The extension never makes a `fetch`, `XMLHttpRequest`, or `WebSocket` request.
- **No analytics.** Usage isn't tracked.
- **No remote code.** Everything runs from the bundled extension code; nothing downloads from a server.
- **Minimal permissions.** Only `storage` (for your settings) and access to `web.whatsapp.com` (the only website BlurIt ever touches).
- **Open source.** Read the code in `src/`. Build it yourself.

**What BlurIt protects you from:**
- People glancing at your screen in public
- Webcams pointed at your monitor
- Screen-sharing on video calls
- Someone walking past while you're typing

**What BlurIt does *not* protect you from:**
- Malware or screen-recording software on your computer
- Other browser extensions with access to the page
- Anyone with access to your unlocked machine
- Accessibility tools that read the page's semantic content (intentional, screen readers must keep working)

---

## Developer guide

<details>
<summary><b>Project layout</b></summary>

```
manifest.config.ts             ← MV3 manifest source (Chrome-shaped)
vite.config.ts                 ← build config
src/
  content/                     ← injected into web.whatsapp.com
    index.ts                   ← entry point
    blur-engine.ts             ← applies <html> data attributes + CSS variables
    observer.ts                ← MutationObserver with rAF debounce
    tagger.ts                  ← stamps data-blurit-role on relevant nodes
  popup/                       ← popup.html / .ts / .css
  background/                  ← service worker (keyboard shortcut handler)
  shared/                      ← types, defaults, constants, selectors, settings
  styles/blur.css              ← the actual blur rules
public/icons/                  ← icon.svg (source) + generated PNGs
scripts/
  zip-for-store.mjs            ← packages dist/ for Chrome Web Store
  generate-icons.mjs           ← rasterises icon.svg → PNG sizes
  transform-firefox.mjs        ← dist/ → dist-firefox/, rewrites manifest
  dev-firefox.mjs              ← Firefox dev orchestrator
```

The Firefox build is a derivation of the Chrome build, not a parallel build. `scripts/transform-firefox.mjs` only mutates `manifest.json`; assets and source files are copied verbatim. One source tree, two output bundles.

</details>

<details>
<summary><b>How it works (one paragraph)</b></summary>

The content script sets a handful of `data-*` attributes on `<html>` plus a couple of CSS custom properties (`--blurit-radius`, `--blurit-delay-in`). All actual blurring is done by static rules in `src/styles/blur.css` keyed off WhatsApp's own structural selectors (`#pane-side [role="row"][data-testid^="list-item-"]`, `#main [role="row"]`, `#main header`). Because the CSS rules don't depend on JS having tagged anything, a newly mounted (virtualized) chat row is blurred on its very first paint, no flash of unblurred content. A single `MutationObserver` rooted at `#app`, debounced via `requestAnimationFrame`, walks freshly mounted subtrees only to stamp `data-blurit-role` exclusions on the composer footer and date-separator rows, mark the latest message, and apply the whitelist.

</details>

<details>
<summary><b>npm scripts</b></summary>

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with Chrome HMR via `@crxjs/vite-plugin`. |
| `npm run dev:firefox` | Orchestrates `vite build --watch` → manifest transform → `web-ext run` with live reload. Set `FIREFOX_BINARY` env var if Firefox is in a non-standard location. |
| `npm run build` | Builds both targets (`dist/` and `dist-firefox/`). |
| `npm run build:chrome` | Chrome build only. |
| `npm run build:firefox` | Firefox transform (assumes `dist/` exists). |
| `npm run zip` | Packages both targets for distribution. |
| `npm run zip:chrome` | Chrome Web Store zip. |
| `npm run zip:firefox` | AMO sideload zip. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | ESLint over `src/`. |
| `npm run lint:firefox` | `web-ext lint` over `dist-firefox/`. Must stay at zero errors and zero warnings before shipping. |
| `npm run icons` | Rasterises `public/icons/icon.svg` → PNG sizes. |
| `npm run format` | Prettier write. |

</details>

<details>
<summary><b>Selector resilience (when WhatsApp ships a UI refactor)</b></summary>

WhatsApp's React class names rotate per deploy. `src/shared/selectors.ts` is the single file to update when WhatsApp ships a UI refactor. Each semantic role (`chatListRow`, `chatHeader`, `messageBubble`, `composer`, …) has a fallback chain anchored to stable IDs / ARIA landmarks (`#app`, `#pane-side`, `#main`, `[aria-label="Chat list"]`). Add new candidate selectors at the top of the chain; the first one returning matches wins.

</details>

<details>
<summary><b>Firefox-specific notes</b></summary>

- Floor is Firefox **140+** to match the `data_collection_permissions` manifest schema key Mozilla now requires for new extensions. (FF 140 is the July 2025 release and current ESR baseline.)
- The `gecko.id` is a UUID locked in `scripts/transform-firefox.mjs` and must not change.
- In-popup keystroke rebinding uses `commands.update()` / `commands.reset()`, which Chrome doesn't expose. The same source code drives both browsers via a runtime `supportsCommandsRebind` capability flag.
- `about:addons` → BlurIt → Permissions lets the user revoke host access. Content scripts stop running on the revoked origin until re-granted; settings stay intact.
- AMO publication (signing, listing, source upload, privacy policy) is out of scope for this repo. The Firefox build is for sideload + local distribution.

</details>

<details>
<summary><b>Icons</b></summary>

The icon is authored as SVG (`public/icons/icon.svg`) and rasterised to PNG sizes via:

```
npm run icons
```

This regenerates `public/icons/icon-{16,32,48,128}.png` from the SVG using `@resvg/resvg-js`. Commit both the SVG (source) and the PNGs so contributors don't need to run the generator just to load the extension.

</details>

---

*BlurIt is not affiliated with WhatsApp or Meta.*
