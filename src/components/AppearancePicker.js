import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomText from './CustomText';
import { C, useTheme } from '../theme';

// System / Light / Dark. "System" follows the phone's setting and is the
// default — Jakob's law: people expect an app to match the rest of their phone.
const OPTIONS = [
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function AppearancePicker() {
  const { appearance, setAppearance } = useTheme();
  return (
    <View style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
      <CustomText weight="SemiBold" style={{ color: C.text, fontSize: 15, marginBottom: 2 }}>Appearance</CustomText>
      <CustomText style={{ color: C.textTertiary, fontSize: 13, marginBottom: 12 }}>
        Choose how COCARR looks on this phone
      </CustomText>
      <View
        accessibilityRole="radiogroup"
        style={{ flexDirection: 'row', backgroundColor: C.surfaceHigh, borderRadius: 12, padding: 4, gap: 4 }}
      >
        {OPTIONS.map((o) => {
          const selected = appearance === o.value;
          return (
            <TouchableOpacity
              key={o.value}
              onPress={() => setAppearance(o.value)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${o.label} appearance`}
              style={{
                flex: 1, minHeight: 44, borderRadius: 9,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                backgroundColor: selected ? C.primary : 'transparent',
              }}
            >
              <Ionicons name={o.icon} size={16} color={selected ? C.onPrimary : C.textSecondary} />
              <CustomText weight={selected ? 'SemiBold' : 'Medium'} style={{ color: selected ? C.onPrimary : C.textSecondary, fontSize: 14 }}>
                {o.label}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
