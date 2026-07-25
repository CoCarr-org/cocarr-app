import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import { photoUrl } from '../../utils/utils';
import { API_URL, BRAND_COLOR } from '../../utils/constants';

// Persistent header: brand + page title on the left; on the tab shells the
// right side carries the customer's wallet points and the profile avatar. On a
// pushed screen (`showBack`) the left becomes a back control and the right can
// carry a single action (e.g. edit profile) via `rightIcon`/`rightRoute`.
//
// The title comes from each screen's `options.title`.
export default function TopBar({ title, showBack = false, rightIcon, rightRoute }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { userRole, userName, profilePhoto } = useSelector((s) => s.auth);
  const isCustomer = userRole !== 'host';

  // Wallet points sit beside the avatar for renters only. Fetched here so the
  // balance is visible from every tab, not just the profile screen.
  const [points, setPoints] = useState(null);
  useEffect(() => {
    if (showBack || !isCustomer) return;
    let active = true;
    axios.get(`${API_URL}/wallet/my-wallet`)
      .then((r) => { if (active) setPoints(r.data?.walletPoints ?? r.data?.wallet?.walletPoints ?? null); })
      .catch(() => {});
    return () => { active = false; };
  }, [showBack, isCustomer]);

  const profileRoute = userRole === 'host' ? 'HostProfileScreen' : 'ProfileIndex';
  const avatar = photoUrl(profilePhoto);

  return (
    <View style={{ backgroundColor: '#000', paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          {showBack ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={{ padding: 6, marginLeft: -6, marginRight: 4 }}
            >
              <Icon name="chevron-back" size={24} color="#e3e3e3" />
            </TouchableOpacity>
          ) : (
            <Image
              source={require('../../images/logo.png')}
              style={{ width: 54, height: 28, marginRight: 10 }}
              resizeMode="contain"
            />
          )}
          {/* Title only on pushed sub-pages. On the tab shells the logo alone
              identifies the app — the page title there was redundant. */}
          {showBack && (
            <CustomText
              fontType='primary'
              weight='Bold'
              numberOfLines={1}
              style={{ color: '#f0f0f2', fontSize: 16, letterSpacing: -.2, flexShrink: 1 }}
            >
              {title}
            </CustomText>
          )}
        </View>

        {/* Pushed screen: a single right action (e.g. edit profile). */}
        {showBack && rightIcon && rightRoute && (
          <TouchableOpacity
            onPress={() => navigation.navigate(rightRoute)}
            activeOpacity={0.8}
            accessibilityRole="button"
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: '#2c2c2e', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name={rightIcon} size={18} color="#c3c3c3" />
          </TouchableOpacity>
        )}

        {/* Tab shell: wallet points (renters) + avatar. */}
        {!showBack && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {isCustomer && points != null && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Wallet')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Wallet points: ${points}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EDBF3115', borderWidth: 1, borderColor: '#EDBF3140', borderRadius: 18, paddingVertical: 6, paddingHorizontal: 11 }}
              >
                <Icon name="wallet-outline" size={14} color={BRAND_COLOR} />
                <CustomText fontType='primary' weight='Bold' style={{ color: BRAND_COLOR, fontSize: 12 }}>{points}</CustomText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => navigation.navigate(profileRoute)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={userName ? `Profile, ${userName}` : 'Profile'}
              style={{
                width: 38, height: 38, borderRadius: 19,
                backgroundColor: '#1c1c1e',
                borderWidth: 1, borderColor: '#2c2c2e',
                alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {avatar
                ? <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} />
                : <Icon name="person-outline" size={19} color={BRAND_COLOR} />}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
