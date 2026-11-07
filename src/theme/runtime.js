import { StyleSheet } from 'react-native';
import { palettes } from './palette';

// Why a module-level runtime instead of a hook in every screen:
// the app's ~60 screens build their styles once at import time with
// StyleSheet.create, and many helpers outside components read `styles.x`.
// Rewriting every one of them to call a hook would mean touching component
// logic in all of those files. Instead, colours and style sheets are resolved
// lazily, at render time, against the scheme ThemeProvider sets here; when the
// scheme changes ThemeProvider remounts the tree so everything re-reads.

let currentScheme = 'dark';
const listeners = new Set();

export function getScheme() {
  return currentScheme;
}

export function setScheme(scheme) {
  const next = scheme === 'light' ? 'light' : 'dark';
  if (next === currentScheme) return;
  currentScheme = next;
  listeners.forEach((fn) => fn(next));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function currentPalette() {
  return palettes[currentScheme];
}

// `C.text`, `C.surface`, … always the value for the active scheme.
// Read it inside render (JSX, style objects built in components), not into a
// module-level constant — a constant would freeze the value at import time.
export const C = new Proxy({}, {
  get: (_, key) => palettes[currentScheme][key],
  has: (_, key) => key in palettes[currentScheme],
  ownKeys: () => Reflect.ownKeys(palettes[currentScheme]),
  getOwnPropertyDescriptor: (_, key) => ({
    enumerable: true, configurable: true, value: palettes[currentScheme][key],
  }),
});

// Drop-in for `StyleSheet.create({...})` when the styles use colours:
//   const styles = themedStyleSheet((C) => ({ card: { backgroundColor: C.surface } }));
// Each scheme's sheet is created once and cached; `styles.card` returns the
// entry for whichever scheme is active when it is read.
export function themedStyleSheet(factory) {
  const cache = {};
  const sheet = () => {
    if (!cache[currentScheme]) cache[currentScheme] = StyleSheet.create(factory(palettes[currentScheme]));
    return cache[currentScheme];
  };
  return new Proxy({}, {
    get: (_, key) => sheet()[key],
    has: (_, key) => key in sheet(),
    ownKeys: () => Reflect.ownKeys(sheet()),
    getOwnPropertyDescriptor: (_, key) => ({ enumerable: true, configurable: true, value: sheet()[key] }),
  });
}
