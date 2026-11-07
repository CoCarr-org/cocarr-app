import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';
import VerificationBadge from '../VerificationBadge';
import CustomText from '../CustomText';
import BrandLogo from '../BrandLogo';
import { photoUrl } from '../../utils/utils';
import { API_URL } from '../../utils/constants';

import { C } from '../../theme';

// Persistent header: brand + page title on the left; on the tab shells the
// right side carries the customer's wallet points and the profile avatar. On a
// pushed screen (`showBack`) the left becomes a back control and the right can
// carry a single action (e.g. edit profile) via `rightIcon`/`rightRoute`.
//
// The title comes from each screen's `options.title`.
// `rightParams` was added because the profile's edit action now targets the
// onboarding wizard, which needs {mode:'edit'} — without it the wizard would open
// in its default onboarding mode and the tap would silently do the wrong thing.
export default function TopBar({ title, showBack = false, rightIcon, rightRoute, rightParams }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { userRole, userName, profilePhoto, verificationStatus } = useSelector((s) => s.auth);
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
    <View style={{ backgroundColor: C.background, paddingTop: insets.top }}>
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
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={{ width: 44, height: 44, marginLeft: -12, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="chevron-back" size={24} color={C.text} />
            </TouchableOpacity>
          ) : (
            <BrandLogo height={34} style={{ marginLeft: -4 }} />
          )}
          {/* Title only on pushed sub-pages. On the tab shells the logo alone
              identifies the app — the page title there was redundant. */}
          {showBack && (
            <CustomText
              fontType='primary'
              weight='Bold'
              numberOfLines={1}
              style={{ color: C.text, fontSize: 17, letterSpacing: -.2, flexShrink: 1 }}
            >
              {title}
            </CustomText>
          )}
        </View>

        {/* Pushed screen: a single right action (e.g. edit profile). */}
        {showBack && rightIcon && rightRoute && (
          <TouchableOpacity
            onPress={() => navigation.navigate(rightRoute, rightParams)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Edit"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderStrong, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name={rightIcon} size={18} color={C.textSecondary} />
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
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EDBF3115', borderWidth: 1, borderColor: '#EDBF3140', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 }}
              >
                <Icon name="wallet-outline" size={14} color={C.primaryText} />
                <CustomText fontType='primary' weight='Bold' style={{ color: C.primaryText, fontSize: 13 }}>{points}</CustomText>
              </TouchableOpacity>
            )}
            {/* The badge is a SIBLING of the round avatar, not a child: the
                avatar clips to its border radius (overflow hidden) and would cut
                the badge in half. This wrapper is the positioning context and is
                deliberately not clipped. */}
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                onPress={() => navigation.navigate(profileRoute)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={userName ? `Profile, ${userName}` : 'Profile'}
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: C.surface,
                  borderWidth: 1, borderColor: C.borderStrong,
                  alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {avatar
                  ? <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} />
                  : <Icon name="person-outline" size={19} color={C.primaryText} />}
              </TouchableOpacity>
              <VerificationBadge size="sm" ringColor={C.background} status={verificationStatus} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
