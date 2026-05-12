// Generates the app icon / adaptive icon / splash assets in apps/mobile/assets/
// from a tiny SVG (no font dependency — pure shapes), via sharp.
//
//   node apps/mobile/scripts/gen-app-icons.mjs   (run from the repo root)
//
// The mark: a tan hexagon "patch" (tactical / K9-unit feel) with an orange
// notch at the top vertex and a paw print inside. Colours come from the design
// tokens in packages/ui/src/tokens.ts.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const BLACK = '#0a0a0a';
const TAN = '#c8a46e';
const ORANGE = '#d4572a';

const here = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(here, '..', 'assets');

/**
 * SVG for the mark on a `size`×`size` canvas.
 * @param {object} o
 * @param {number} o.size      canvas px
 * @param {string|null} o.bg   background fill, or null for transparent
 * @param {number} o.span      fraction of `size` the hexagon spans (point-to-point, vertical)
 */
function markSvg({ size, bg, span }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size * span) / 2; // circumradius of the (pointy-top) hexagon
  // Pointy-top hexagon vertices.
  const pts = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i - 90);
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  const hexPath =
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') +
    ' Z';
  const stroke = r * 0.07;

  // Paw print inside the hex (pure shapes — no font dependency).
  const u = r * 0.0145; // paw unit
  const pawCx = cx;
  const pawCy = cy + r * 0.05;
  const pad = `<ellipse cx="${pawCx}" cy="${(pawCy + 20 * u).toFixed(1)}" rx="${(26 * u).toFixed(1)}" ry="${(22 * u).toFixed(1)}" fill="${TAN}"/>`;
  const toe = (dx, dy, rr) =>
    `<ellipse cx="${(pawCx + dx * u).toFixed(1)}" cy="${(pawCy + dy * u).toFixed(1)}" rx="${(rr * u).toFixed(1)}" ry="${(rr * 1.22 * u).toFixed(1)}" fill="${TAN}"/>`;
  const toes = [toe(-30, -8, 10), toe(-12, -22, 11.5), toe(12, -22, 11.5), toe(30, -8, 10)].join(
    '',
  );

  // Orange notch at the top vertex of the hex.
  const top = pts[0];
  const notchW = r * 0.16;
  const notch = `<rect x="${(top[0] - notchW / 2).toFixed(1)}" y="${(top[1] - stroke * 0.7).toFixed(1)}" width="${notchW.toFixed(1)}" height="${(stroke * 1.4).toFixed(1)}" rx="${(stroke * 0.7).toFixed(1)}" fill="${ORANGE}"/>`;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
  <path d="${hexPath}" fill="none" stroke="${TAN}" stroke-width="${stroke.toFixed(1)}" stroke-linejoin="round"/>
  ${pad}${toes}
  ${notch}
</svg>`;
}

async function write(name, svg, size) {
  const out = path.join(ASSETS, name);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log(`  ${name}  ${size}×${size}`);
}

async function main() {
  console.log('Generating app icons →', ASSETS);
  // iOS / generic icon — full-bleed black, larger mark (iOS only rounds corners).
  await write('icon.png', markSvg({ size: 1024, bg: BLACK, span: 0.82 }), 1024);
  // Android adaptive foreground — transparent, mark within the ~66% safe zone.
  await write('adaptive-icon.png', markSvg({ size: 1024, bg: null, span: 0.62 }), 1024);
  // Splash artwork — transparent; the splash plugin centres it on backgroundColor.
  await write('splash-icon.png', markSvg({ size: 1024, bg: null, span: 0.7 }), 1024);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
