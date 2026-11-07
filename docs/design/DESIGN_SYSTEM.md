# COCARR design system (mobile)

Brand: gold wheel + "cocarr" wordmark, tagline *Drive In Style*. Gold is the brand; black (dark mode) and ivory (light mode) are the canvas.

Code lives in `src/theme/`:

| File | What it is |
|---|---|
| `palette.js` | Colour tokens for `dark` and `light`, plus spacing, radii and type scale |
| `runtime.js` | `C` (colours for the active scheme) and `themedStyleSheet()` |
| `ThemeProvider.js` | Picks the scheme from the user's Appearance choice or the system setting |
| `status.js` | `bookingStatusStyle(status)` — the one booking-status pill palette |
| `scripts/check-contrast.js` | WCAG contrast check for every text/background pair in both modes |

## Using it

```js
import { C, themedStyleSheet } from '../../theme';

const styles = themedStyleSheet((C) => ({
  card: { backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 14 },
  title: { color: C.text, fontSize: 16, fontWeight: '600' },
}));

// Inline, inside render:
<Icon name="star" color={C.primaryText} />
```

Rules:
1. **Never write a hex value in a screen.** Use a token. If no token fits, add one to *both* palettes and run `node scripts/check-contrast.js`.
2. **Read `C.x` inside render, never into a module-level constant.** `const GOLD = C.primary` at the top of a file freezes to whichever scheme was active at import. If you need a lookup table of colours, make it a function (see `status.js`).
3. **`StyleSheet.create` → `themedStyleSheet((C) => ({…}))`** whenever the sheet uses a colour.
4. Gold **fill** = `C.primary` (same both modes). Gold **text/icon** = `C.primaryText` (darkened in light mode for contrast). Text on a gold fill = `C.onPrimary`.
5. `BRAND_COLOR` in `utils/constants.js` still exists for old imports but should not be used for new UI.

## Colour tokens

| Token | Dark | Light | Use |
|---|---|---|---|
| `background` | `#000000` | `#F6F5F1` | Screen canvas |
| `surfaceLow` | `#121214` | `#FAF9F5` | Sheets, tab-bar track |
| `surface` | `#1C1C1E` | `#FFFFFF` | Cards, list rows |
| `surfaceHigh` | `#2C2C2E` | `#EFEDE6` | Inputs, chips, segmented-control track |
| `surfaceHighest` | `#3A3A3C` | `#E2DFD6` | Pressed, switch thumb off |
| `border` | `#262628` | `#E6E3DA` | Hairlines, card borders |
| `borderStrong` | `#3A3A3C` | `#CFCBBF` | Dividers that must be seen |
| `outline` | `#8E8E93` | `#8A867C` | Input borders, unselected radio (≥ 3:1) |
| `text` | `#F2F2F2` | `#1A1915` | Primary text |
| `textSecondary` | `#AEAEB2` | `#4F4C45` | Supporting text |
| `textTertiary` | `#98989D` | `#67635A` | Meta, captions (still ≥ 4.5:1) |
| `textMuted` | `#6E6E73` | `#8F8B81` | Placeholders only |
| `textDisabled` | `#48484A` | `#B4B0A5` | Disabled labels |
| `primary` | `#EDBF31` | `#EDBF31` | Gold fill: primary button, active pill |
| `primaryText` | `#EDBF31` | `#7F5F00` | Gold as text or icon |
| `primarySoft` | `#241F0C` | `#FBF3D6` | Gold-tinted background |
| `onPrimary` | `#111111` | `#111111` | Text on gold |
| `danger` / `dangerSoft` | `#FF6B6B` / `#2B1212` | `#C62828` / `#FDECEC` | Errors, cancel |
| `success` / `successSoft` | `#6EE6B0` / `#0E2A1E` | `#146C43` / `#E3F5EC` | Ongoing, verified |
| `warning` / `warningSoft` | `#FB923C` / `#2D1A0A` | `#A04A00` / `#FFF0E0` | Suspended, attention |
| `info` | `#7DB4FF` | `#1F5FBF` | Verification in progress |

All required pairs pass WCAG AA in both modes — run the script to see the ratios.

The attached brand artwork uses a softer gold, `#ECBD65`, in the wheel. The app UI keeps `#EDBF31`. To align the UI with the artwork exactly, change `BRAND_GOLD` in `palette.js` (one line) and re-run the contrast script.

## Type

System font (SF Pro / Roboto). `CustomText` maps `weight="Bold"` etc. to real `fontWeight` values; it previously requested an Inter font that is not bundled, so weights were ignored.

| Style | Size / weight | Use |
|---|---|---|
| largeTitle | 32 / 700 | Rare — welcome |
| title1 | 26 / 700 | Screen hero (price on car detail) |
| title2 | 21 / 700 | Section heads |
| title3 | 18 / 600 | Card titles |
| headline | 16 / 600 | Row titles, buttons |
| body | 15 / 400 | Body |
| callout | 14 / 400 | Secondary body |
| subhead | 13 / 500 | Labels |
| footnote | 12 / 400 | Meta |
| caption | 11 / 500 | Smallest allowed |

## Spacing and shape

Spacing: 2 · 4 · 8 · 12 · 16 · 20 · 24 · 32. Screen gutter 16.
Radii: 6 (chips) · 10 (inputs) · 14 (cards) · 20 (sheets) · pill.
Primary button: gold fill, 48–52 pt tall, radius 12, 15–16 pt bold label, sentence case.

## Logo

`<BrandLogo height={…} />` picks `brand-logo-dark.png` (white wordmark) or `brand-logo-light.png` (ink wordmark). Same gold in both. Don't place the logo on gold.

## Appearance

Profile → Appearance: **System** (default), Light, Dark. Stored in `preferences.appearance`. Switching remounts the UI and restores the current screen.
