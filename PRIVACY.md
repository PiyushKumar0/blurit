# BlurIt: Privacy Policy

_Last updated: 2026-06-18_

BlurIt is a browser extension that visually blurs sensitive parts of WhatsApp
Web until you hover over them, to reduce shoulder-surfing risk. Privacy is the
entire point of the extension, and its data practices reflect that.

## Short version

**BlurIt collects nothing, sends nothing, and tracks nothing.** It makes no
network requests, contains no analytics, and loads no remote code.

## What data BlurIt stores

The only data BlurIt stores is **your own settings**:

- which areas to blur (chat list / header / messages),
- blur intensity and reveal delay,
- the master on/off state and keyboard shortcut, and
- the **whitelist** of contact names you choose to never blur.

These settings are saved using the browser's standard extension storage API
(`storage.sync`). If you have browser sync enabled, they sync across your own
devices **through your browser account (e.g. Firefox Sync)** and never through
any server operated by the developer. The developer has no access to this data.

## On-page processing

To apply blurring and the whitelist, BlurIt reads page content on
`web.whatsapp.com` locally within your browser, including contact display
names, which it compares against your whitelist. This processing happens
entirely on your device, in memory. **None of it is recorded, stored beyond
your own settings, or transmitted anywhere.**

## What BlurIt does NOT do

- No network calls (`fetch`, `XMLHttpRequest`, `WebSocket`).
- No analytics or telemetry.
- No remote or hosted code; everything runs from the bundled extension.
- No selling, sharing, or transfer of data to anyone, there is no data to
  sell or share.

## Permissions

- **`storage`** - to save and sync your settings (above).
- **Host access to `https://web.whatsapp.com/*`** - BlurIt runs only on
  WhatsApp Web, where it injects the CSS/JS that blurs and reveals content. It
  runs on no other website.

## Scope

BlurIt protects against people glancing at your screen (in public, on a video
call, etc.). It does **not** protect against malware, screen-recording
software, other extensions, or anyone with access to your unlocked device. The
blur is purely visual.

## Contact

Questions about this policy: open an issue on the project's GitHub repository.

_BlurIt is not affiliated with, endorsed by, or sponsored by WhatsApp or Meta._
