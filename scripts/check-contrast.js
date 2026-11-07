#!/usr/bin/env node
// WCAG 2.1 contrast check for the COCARR palette, both modes.
// Usage: node scripts/check-contrast.js   (exits 1 if any required pair fails)
const fs = require('fs');
const path = require('path');

// palette.js is an ES module; read it as text and evaluate the object literal.
const src = fs.readFileSync(path.join(__dirname, '../src/theme/palette.js'), 'utf8')
  .replace(/export const /g, 'const ')
  + '\nmodule.exports = { palettes };';
const m = { exports: {} };
new Function('module', src)(m);
const { palettes } = m.exports;

function lum(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground, background, minimum]
const PAIRS = [
  ...['text', 'textSecondary', 'textTertiary'].flatMap((t) =>
    ['background', 'surface', 'surfaceHigh'].map((b) => [t, b, 4.5])),
  ...['primaryText', 'danger', 'success', 'warning'].flatMap((t) =>
    ['background', 'surface'].map((b) => [t, b, 4.5])),
  ['onPrimary', 'primary', 4.5],
  ['onDanger', 'danger', 4.5],
  ['inverseText', 'inverseSurface', 4.5],
  ['textMuted', 'surface', 3], // placeholders: non-text minimum
  ['outline', 'surface', 3], // input borders, unselected controls
  ['primary', 'background', 1.0], // fill, reported for information only
];

let failed = 0;
for (const [mode, p] of Object.entries(palettes)) {
  console.log(`\n${mode.toUpperCase()}`);
  for (const [fg, bg, min] of PAIRS) {
    const r = ratio(p[fg], p[bg]);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`${ok ? 'pass' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  ${fg} on ${bg}  (needs ${min})`);
  }
}
console.log(failed ? `\n${failed} pair(s) below minimum` : '\nAll pairs meet their minimum.');
process.exit(failed ? 1 : 0);
