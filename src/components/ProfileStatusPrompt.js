import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import CustomText from './CustomText';
import { API_URL, BRAND_COLOR } from '../utils/constants';

// Profile-status prompt shown at the top of both profile screens.
//
// Verification is actually enforced — only an `active` profile can book — so
// this is not a cosmetic nudge. `incomplete` is the case that matters most: it
// means the onboarding wizard was never finished, usually because the licence
// or Aadhaar step was skipped. Tapping through reopens the wizard with
// everything already entered prefilled.
//
// An `active` profile has no entry in COPY, so nothing renders for the users
// who have nothing to do.

const COPY = {
  incomplete: {
    icon: 'alert-circle-outline',
    colour: BRAND_COLOR,
    background: '#241f0c',
    title: 'Complete your profile',
    body: 'Add your driving licence and Aadhaar to start booking rides.',
    route: 'OnboardingWizard',
  },
  pending: {
    icon: 'time-outline',
    colour: '#7aa2f7',
    background: '#111a2b',
    title: 'Verification in progress',
    body: 'Your profile is with our team. Browse cars in the meantime.',
    route: 'OnboardingWizard',
    params: { mode: 'review' },
  },
  rejected: {
    icon: 'close-circle-outline',
    colour: '#f87171',
    background: '#2b1212',
    title: 'Your verification needs attention',
    body: 'Something needs correcting before you can book.',
    route: 'OnboardingWizard',
  },
  suspended: {
    icon: 'ban-outline',
    colour: '#fb923c',
    background: '#2a1d0c',
    title: 'Your account is suspended',
    body: 'Please contact support for details.',
    route: null,
  },
};

const ProfileStatusPrompt = () => {
  const navigation = useNavigation();
  const [status, setStatus] = useState(null);

  // useFocusEffect, not useEffect: coming back from the wizard must re-read the
  // status, or a profile that was just submitted still shows as incomplete.
  useFocusEffect(useCallback(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/user/verification`);
        if (!cancelled) setStatus(res.data);
      } catch (error) {
        // A failed status read must not put a misleading banner on the screen —
        // rendering nothing is the safe outcome.
        console.log('Profile status check skipped:', error?.message);
      }
    })();
    return () => { cancelled = true; };
  }, []));

  const copy = status && COPY[status.verificationStatus];
  if (!copy) return null;

  const Wrapper = copy.route ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.card, { backgroundColor: copy.background, borderLeftColor: copy.colour }]}
      onPress={copy.route ? () => navigation.navigate(copy.route, copy.params) : undefined}
      activeOpacity={0.8}
    >
      <Icon name={copy.icon} size={22} color={copy.colour} />
      <View style={{ flex: 1 }}>
        <CustomText fontType='primary' weight='Bold' style={styles.title}>{copy.title}</CustomText>
        <CustomText fontType='primary' style={styles.body}>
          {copy.body}
          {status.verificationStatus === 'suspended' && status.suspensionReason
            ? ` (${status.suspensionReason})`
            : ''}
        </CustomText>
      </View>
      {copy.route ? <Icon name='chevron-forward' size={18} color={copy.colour} /> : null}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  title: { fontSize: 14, color: '#fff', marginBottom: 2 },
  body: { fontSize: 12, color: '#c9c9d1', lineHeight: 17 },
});

export default ProfileStatusPrompt;
