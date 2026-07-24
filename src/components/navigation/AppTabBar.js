import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../CustomText';
import { updateUserRole } from '../../store/authSlice';
import { BRAND_COLOR } from '../../utils/constants';

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
      paddingBottom: Platform.OS === 'ios' ? 26 : 12,
      backgroundColor: '#000',
    }}>
      {/* The pill */}
      <View style={{
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#141416', borderRadius: 34,
        borderWidth: 1, borderColor: '#232327',
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
                paddingVertical: 9, borderRadius: 30,
                // The active tab gets a filled lozenge, as in the reference.
                backgroundColor: isFocused ? '#232327' : 'transparent',
              }}
            >
              {options.tabBarIcon
                ? options.tabBarIcon({ focused: isFocused, color: isFocused ? BRAND_COLOR : '#808080', size: 20 })
                : null}
              <CustomText
                fontType='primary'
                weight='Bold'
                numberOfLines={1}
                style={{
                  color: isFocused ? BRAND_COLOR : '#808080',
                  fontSize: 9, marginTop: 4,
                  textTransform: 'uppercase', letterSpacing: .3,
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
          width: 62, height: 62, borderRadius: 31,
          backgroundColor: '#EDBF3114',
          borderWidth: 1.5, borderColor: BRAND_COLOR,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <CustomText fontType='primary' weight='Bold' style={{ color: BRAND_COLOR, fontSize: 14, letterSpacing: -.1 }}>
          {label}
        </CustomText>
      </TouchableOpacity>
    </View>
  );
}
