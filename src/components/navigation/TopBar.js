import React from 'react';
import { View, Image, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../CustomText';
import { photoUrl } from '../../utils/utils';
import { BRAND_COLOR } from '../../utils/constants';

// Persistent header: the page title on the left, the profile avatar on the
// right. Profile used to be a tab, which meant it competed for space with the
// actual destinations and disappeared behind whichever tab you were on. As a
// fixed header action it is reachable from every tab.
//
// The title comes from each screen's `options.title`, so adding a tab does not
// mean touching this file.
export default function TopBar({ title }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { userRole, userName, profilePhoto } = useSelector((s) => s.auth);

  // Each shell has its own profile screen.
  const profileRoute = userRole === 'host' ? 'HostProfileScreen' : 'ProfileIndex';
  const avatar = photoUrl(profilePhoto);

  return (
    <View style={{ backgroundColor: '#000', paddingTop: insets.top }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
      }}>
        <CustomText
          fontType='primary'
          weight='Bold'
          numberOfLines={1}
          style={{ color: '#f0f0f2', fontSize: 20, letterSpacing: -.4, flex: 1, marginRight: 12 }}
        >
          {title}
        </CustomText>

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
    </View>
  );
}
