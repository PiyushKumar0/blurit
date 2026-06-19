# Building BlurIt from source (reviewer guide)

This document lets a reviewer reproduce an exact copy of the submitted
add-on from the human-readable sources in this archive. None of the source
files are transpiled, minified, or machine-generated; the build below is what
produces the bundled, minified output that ships in the package.

## Build environment requirements

- **Operating system:** any. The build is OS-independent (pure Node.js + npm).
  Developed on Windows 11; builds identically on macOS and Linux.
- **Node.js:** version **20.10 or later** (enforced by `engines` in
  `package.json`). Tested with **Node.js 22.20.0** and **npm 10.9.3**.
- **npm:** ships with Node.js; no separate install needed.
- **No other system tools** are required — there is no native compilation step.
  (`@resvg/resvg-js` ships prebuilt binaries and is used only by the optional
  `npm run icons` script, not by the extension build.)

### Installing Node.js / npm

- Download the LTS installer from <https://nodejs.org/>, **or**
- with [nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`.

Verify: `node -v` (≥ v20.10) and `npm -v`.

## Build steps

From the root of this source archive:

```sh
npm ci        # install exact locked dependency versions (NOT `npm install`)
npm run build # type-check + bundle Chrome dist/, then derive Firefox build
```

The Firefox extension is written to **`dist-firefox/`**.
The Chrome extension is written to **`dist/`**.


### One-command build script

Equivalently, run the included build script:

```sh
sh build.sh
```

(On Windows PowerShell, run the two commands above directly:
`npm ci; npm run build`.)

## What the build does

- `vite` + `@crxjs/vite-plugin` bundle the TypeScript in `src/` into `dist/`
  (the Chrome/MV3 build).
- `scripts/transform-firefox.mjs` derives `dist-firefox/` from `dist/`,
  rewriting **only** `manifest.json` (service worker → `background.scripts[]`,
  injecting `browser_specific_settings`, swapping the suggested shortcut, and
  stripping Chrome-only keys). All other assets are copied verbatim.
- Asset filenames are content-hashed by Vite and are deterministic from the
  source + the locked dependency versions in `package-lock.json` (hence
  `npm ci`).

## Producing / verifying the submitted package (for Firefox)

The submitted `.zip` is produced from `dist-firefox/` with:

```sh
npm run zip:firefox   # web-ext build → web-ext-artifacts/
```

To confirm correctness, validate the build (expected: 0 errors / 0 warnings /
0 notices):

```sh
npm run lint:firefox
```

## Note on the icon PNGs

`public/icons/icon-{16,32,48,128}.png` are committed assets generated from the
source `public/icons/icon.svg` via `npm run icons` (using `@resvg/resvg-js`).
They are static image assets, not code, and can be regenerated from the SVG.
