import React from 'react';
import { Image } from 'react-native';
import { useTheme } from '../theme';

// The COCARR wordmark ("cocarr" + gold wheel + "Drive In Style").
// The source artwork is white-on-black, so light mode gets a variant with a
// dark wordmark; the gold is identical in both.
const SOURCES = {
  dark: require('../images/brand-logo-dark.png'),
  light: require('../images/brand-logo-light.png'),
};
const ASPECT = 368 / 178;

export default function BrandLogo({ height = 32, style }) {
  const { scheme } = useTheme();
  return (
    <Image
      source={SOURCES[scheme]}
      style={[{ height, width: Math.round(height * ASPECT) }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="COCARR"
    />
  );
}
