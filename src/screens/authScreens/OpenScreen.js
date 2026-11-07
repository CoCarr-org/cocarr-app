import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';

import { C, themedStyleSheet } from '../../theme';
import BrandLogo from '../../components/BrandLogo';

// const {  } = Dimensions.get('window');

export function OpenScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../images/cocarr-app-banner.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.contentContainer}>
        <BrandLogo height={56} style={{ marginLeft: -6, marginBottom: 20 }} />
        <Text style={styles.title}>Self-drive cars, delivered in style.</Text>
        <Text style={styles.subtitle}>Book by the hour. Pick up nearby or get it delivered.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('MobileInput')}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Get started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = themedStyleSheet(C => ({
  container: {
    flex: 1,
    backgroundColor: C.background,
    justifyContent:'space-between'
  },

  backgroundImage: {
    height: '100%',
    width: '100%',
  },

  contentContainer: {
    flex: 1,
    position:'absolute',
    left:0,
    bottom:0,
    width:'94%',
    marginBottom:24,
    borderRadius:24,
    marginHorizontal:12,
    // Scrim over the hero photo: dark glass in dark mode, ivory glass in light.
    backgroundColor: C.scheme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.94)',
    
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 28,
    borderCurve:'continuous',
    paddingVertical:40,
  },

  title: {
    fontSize: 20,
    lineHeight:32,
    letterSpacing:-.1,
    fontWeight: '600',
    maxWidth:'90%',
    color: C.text,
    marginBottom: 8,
    textAlign: 'left',
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: C.textSecondary,
    marginBottom: 28,
  },

  button: {
    minHeight: 52,
    justifyContent: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 16,
    width:'100%',
    borderRadius: 12,
  },

  buttonText: {
    color: C.onPrimary,
    fontSize: 16,
    textAlign:'center',
    fontWeight: '700',
  }
}));
