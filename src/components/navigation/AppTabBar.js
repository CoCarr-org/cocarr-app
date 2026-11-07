import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomText from '../CustomText';
import { updateUserRole } from '../../store/authSlice';
import { C } from '../../theme';

// Floating pill tab bar with a separate circular action on the right.
//
// The circle is the mode toggle, not a tab: in renting mode it offers hosting,
// in hosting mode it offers renting. It sits outside the pill because it does
// not navigate — it swaps the whole shell — and pretending it was a tab is what
// made the old "Host" tab confusing.
//
// Profile is deliberately absent: it lives in TopBar, visible from every tab.

// Single word each way: the button offers the mode you are NOT in.
const MODE_LABEL = {
  customer: 'Host',
  host: 'Rent',
};

export default function AppTabBar({ state, descriptors, navigation }) {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const rootNavigation = useNavigation();
  const { userRole, isHost } = useSelector((s) => s.auth);
  const current = userRole === 'host' ? 'host' : 'customer';
  const label = MODE_LABEL[current];

  const toggleMode = () => {
    const next = current === 'host' ? 'customer' : 'host';
    // Only a registered host may enter the host shell; everyone else is sent to
    // the sign-up screen first.
    if (next === 'host' && !isHost) {
      rootNavigation.navigate('BecomeHost');
      return;
    }
    dispatch(updateUserRole({ userRole: next }));
  };

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14,
      paddingTop: 8,
      // Real inset, not a guessed constant — 26 was wrong on every device that
      // isn't a notched iPhone, and on Android it left a dead strip.
      paddingBottom: Math.max(insets.bottom, 12),
      backgroundColor: C.background,
    }}>
      {/* The pill */}
      <View style={{
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: C.surface, borderRadius: 34,
        borderWidth: 1, borderColor: C.border,
        padding: 5,
      }}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const title = options.title || route.name;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={title}
              style={{
                flex: 1, alignItems: 'center', justifyContent: 'center',
                paddingVertical: 8, minHeight: 50, borderRadius: 30,
                // The active tab gets a filled lozenge, as in the reference.
                backgroundColor: isFocused ? C.primarySoft : 'transparent',
              }}
            >
              {options.tabBarIcon
                ? options.tabBarIcon({ focused: isFocused, color: isFocused ? C.primaryText : C.textTertiary, size: 20 })
                : null}
              <CustomText
                fontType='primary'
                weight='Bold'
                numberOfLines={1}
                style={{
                  color: isFocused ? C.primaryText : C.textTertiary,
                  // 9pt uppercase was below every platform minimum; 11pt is
                  // the iOS tab-bar label size.
                  fontSize: 11, marginTop: 3,
                  letterSpacing: .1,
                }}
              >
                {title}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Mode toggle */}
      <TouchableOpacity
        onPress={toggleMode}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={current === 'host' ? 'Switch to renting' : 'Switch to hosting'}
        style={{
          // Sized to the pill's height so the two align instead of the circle
          // overhanging it.
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: '#EDBF3114',
          borderWidth: 1.5, borderColor: C.primary,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <CustomText fontType='primary' weight='Bold' style={{ color: C.primaryText, fontSize: 12, letterSpacing: -.1 }}>
          {label}
        </CustomText>
      </TouchableOpacity>
    </View>
  );
}
