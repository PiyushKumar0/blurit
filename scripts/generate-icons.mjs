// Rasterizes public/icons/icon.svg into the PNG sizes Chrome needs.
// Run via `npm run icons` whenever you edit icon.svg.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'public', 'icons', 'icon.svg');
const OUT_DIR = join(ROOT, 'public', 'icons');

const SIZES = [16, 32, 48, 128];

const svg = readFileSync(SRC);

for (const size of SIZES) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  const path = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`wrote ${path} (${png.length} bytes)`);
}
