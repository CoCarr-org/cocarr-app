import React, { createContext, useContext, useMemo } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { palettes } from './palette';
import { setScheme } from './runtime';
import { setAppearance } from '../store/preferencesSlice';

const ThemeContext = createContext({
  colors: palettes.dark,
  scheme: 'dark',
  appearance: 'system',
  setAppearance: () => {},
});

// appearance: 'system' | 'light' | 'dark' (user choice, persisted in redux)
// scheme:     'light' | 'dark'            (what is actually drawn)
export function ThemeProvider({ children }) {
  const dispatch = useDispatch();
  const system = useColorScheme(); // null on some Android builds → treat as dark
  const stored = useSelector((s) => s.preferences?.appearance);
  const appearance = stored === 'light' || stored === 'dark' ? stored : 'system';
  const scheme = appearance === 'system' ? (system === 'light' ? 'light' : 'dark') : appearance;

  // Set before children render so every C.x / styles.x read this pass is right.
  setScheme(scheme);

  const value = useMemo(() => ({
    colors: palettes[scheme],
    scheme,
    appearance,
    setAppearance: (next) => dispatch(setAppearance(next)),
  }), [scheme, appearance, dispatch]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={palettes[scheme].statusBar} backgroundColor={palettes[scheme].background} />
      {/* key: a scheme change remounts the tree so lazily-resolved styles are
          re-read. Navigation state survives — see RootNavigator in App.js. */}
      <React.Fragment key={scheme}>{children}</React.Fragment>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
