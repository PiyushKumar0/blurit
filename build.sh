#!/usr/bin/env sh
# Reproducible build for source-code review.
#
# Builds the Firefox and Chrome extension into dist-firefox/ and dist/
# respectively from the human-readable sources in this archive. 
# dist-firefox/ and dist/ have the unpacked extension that corresponds to the
# submitted packages for each web store.
#
# Requirements: Node.js >= 20.10 and npm (see BUILD.md). No other tools.
# Usage:        sh build.sh
set -eu

# 1. Install the EXACT, locked dependency versions from package-lock.json.
#    Use `npm ci` (not `npm install`) so versions can't drift — this keeps
#    the bundler pinned and the content-hashed asset filenames identical.
npm ci

# 2. Type-check, bundle the Chrome build (dist/), then derive the Firefox
#    build (dist-firefox/) by rewriting only the manifest.
npm run build

echo ""
echo "Build complete."
echo "Firefox extension (unpacked): dist-firefox/, Chrome extension (unpacked): dist/."
echo "This corresponds to the submitted .zip produced by 'npm run zip'."
