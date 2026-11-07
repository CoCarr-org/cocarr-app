// COCARR colour tokens — one name per job, two values per name.
//
// The brand gold (#EDBF31) comes straight from the logo's wheel and is the
// same in both modes when it is a FILL (buttons, active pills, the mode toggle).
// Gold as TEXT is a different token: #EDBF31 on a white card is ~1.7:1 and
// unreadable, so light mode darkens it to an antique gold that passes AA.
//
// Dark mode keeps the app's existing look (true-black canvas, #1C1C1E cards).
// Light mode is a warm ivory canvas rather than pure white — it sits next to
// the gold without the gold looking dirty, and white cards still lift off it.
//
// Every text token is checked against `background`, `surface` and
// `surfaceHigh` by scripts/check-contrast.js. Run it after changing a value.

export const BRAND_GOLD = '#EDBF31';

export const palettes = {
  dark: {
    scheme: 'dark',
    statusBar: 'light-content',

    // Canvas and layers, lowest to highest.
    background: '#000000',
    surfaceLow: '#121214',
    surface: '#1C1C1E',
    surfaceHigh: '#2C2C2E',
    surfaceHighest: '#3A3A3C',
    inverseSurface: '#F2F2F2',
    overlay: 'rgba(0,0,0,0.6)',

    // Lines.
    border: '#262628',
    borderStrong: '#3A3A3C',
    outline: '#8E8E93',

    // Text, most to least prominent.
    text: '#F2F2F2',
    textSecondary: '#AEAEB2',
    textTertiary: '#98989D',
    textMuted: '#6E6E73', // placeholders and hints only; not for content
    textDisabled: '#48484A',
    inverseText: '#111111',

    // Brand.
    primary: BRAND_GOLD,
    primaryPressed: '#D4A821',
    primaryText: BRAND_GOLD,
    primarySoft: '#241F0C',
    onPrimary: '#111111',

    // Status.
    danger: '#FF6B6B',
    dangerSoft: '#2B1212',
    onDanger: '#111111',
    success: '#6EE6B0',
    successSoft: '#0E2A1E',
    warning: '#FB923C',
    warningSoft: '#2D1A0A',
    info: '#7DB4FF',

    disabled: '#3A3A3C',
  },

  light: {
    scheme: 'light',
    statusBar: 'dark-content',

    background: '#F6F5F1',
    surfaceLow: '#FAF9F5',
    surface: '#FFFFFF',
    surfaceHigh: '#EFEDE6',
    surfaceHighest: '#E2DFD6',
    inverseSurface: '#1A1915',
    overlay: 'rgba(20,18,12,0.45)',

    border: '#E6E3DA',
    borderStrong: '#CFCBBF',
    outline: '#8A867C',

    text: '#1A1915',
    textSecondary: '#4F4C45',
    textTertiary: '#67635A',
    textMuted: '#8F8B81',
    textDisabled: '#B4B0A5',
    inverseText: '#FFFFFF',

    primary: BRAND_GOLD,
    primaryPressed: '#D4A821',
    primaryText: '#7F5F00',
    primarySoft: '#FBF3D6',
    onPrimary: '#111111',

    danger: '#C62828',
    dangerSoft: '#FDECEC',
    onDanger: '#FFFFFF',
    success: '#146C43',
    successSoft: '#E3F5EC',
    warning: '#A04A00',
    warningSoft: '#FFF0E0',
    info: '#1F5FBF',

    disabled: '#DAD6CC',
  },
};

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radii = { sm: 6, md: 10, lg: 14, xl: 20, pill: 999 };

// iOS text styles mapped to sizes; Android uses the same numbers.
// Body never goes below 13 — the old screens went down to 8–9pt.
export const type = {
  largeTitle: { fontSize: 32, fontWeight: '700', letterSpacing: -0.4 },
  title1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  title2: { fontSize: 21, fontWeight: '700', letterSpacing: -0.2 },
  title3: { fontSize: 18, fontWeight: '600' },
  headline: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  callout: { fontSize: 14, fontWeight: '400' },
  subhead: { fontSize: 13, fontWeight: '500' },
  footnote: { fontSize: 12, fontWeight: '400' },
  caption: { fontSize: 11, fontWeight: '500' },
};
