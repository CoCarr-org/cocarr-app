import React from 'react';
import { Text } from 'react-native';
import { C, themedStyleSheet } from '../theme';

// The old mapping asked for 'Inter-Bold', 'Inter-SemiBold', … — but no Inter
// file is bundled on iOS (Info.plist UIAppFonts) or Android (no assets/fonts).
// Unknown families fall back to the system font at its REGULAR weight, so every
// `weight=` on 985 CustomText usages was silently ignored and headings, prices
// and labels all rendered at the same weight.
//
// Now: the platform system font (SF Pro on iOS, Roboto on Android) with a real
// fontWeight. `fontType` is kept for call-site compatibility; both types use
// the system font until a brand typeface is actually bundled on both platforms.
const WEIGHTS = {
  Light: '300',
  Regular: '400',
  Medium: '500',
  SemiBold: '600',
  Bold: '700',
  ExtraBold: '800',
};

const CustomText = ({ children, fontType = 'primary', weight = 'Regular', style, numberOfLines = 1, ...props }) => {
  const fontWeight = WEIGHTS[weight] || WEIGHTS.Regular;
  return (
    <Text
      style={[styles.text, { fontWeight }, style]}
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={1.6}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = themedStyleSheet((C) => ({
  text: {
    fontSize: 16,
    marginBottom: 0,
    letterSpacing: 0.2,
    color: C.text,
  },
}));

export default CustomText;
