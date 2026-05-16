import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'public/icons');
mkdirSync(outDir, { recursive: true });

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128">
  <circle cx="64" cy="64" r="60" fill="#1A1A1A"/>
  <text x="64" y="64"
        fill="#FAF9F6"
        font-family="-apple-system, system-ui, Helvetica, sans-serif"
        font-size="80"
        font-weight="600"
        text-anchor="middle"
        dominant-baseline="central"
        letter-spacing="-2">H</text>
</svg>`;

for (const size of [16, 48, 128]) {
  const out = resolve(outDir, `icon-${size}.png`);
  await sharp(Buffer.from(svg(size))).resize(size, size).png().toFile(out);
  console.log(`wrote ${out}`);
}
