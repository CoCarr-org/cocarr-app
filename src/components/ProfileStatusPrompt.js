import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { updateProfile } from '../store/authSlice';
import CustomText from './CustomText';
import { API_URL } from '../utils/constants';

import { C, themedStyleSheet } from '../theme';

// Profile-status prompt shown at the top of both profile screens.
//
// Verification is actually enforced — only an `active` profile can book — so
// this is not a cosmetic nudge. `incomplete` is the case that matters most: it
// means the onboarding wizard was never finished, usually because the licence
// or Aadhaar step was skipped. Tapping through reopens the wizard with
// everything already entered prefilled.
//
// An `active` profile has no entry in copyFor(), so nothing renders for the users
// who have nothing to do.

// A function so colours resolve against the active scheme at render time.
const copyFor = (status) => ({
  incomplete: {
    icon: 'alert-circle-outline',
    colour: C.primary,
    background: C.primarySoft,
    title: 'Complete your profile',
    body: 'Add your driving licence and Aadhaar to start booking rides.',
    route: 'OnboardingWizard',
  },
  pending: {
    icon: 'time-outline',
    colour: C.info,
    background: C.surfaceHigh,
    title: 'Verification in progress',
    body: 'Your profile is with our team. Browse cars in the meantime.',
    route: 'OnboardingWizard',
    params: { mode: 'review' },
  },
  rejected: {
    icon: 'close-circle-outline',
    colour: C.danger,
    background: C.dangerSoft,
    title: 'Your verification needs attention',
    body: 'Something needs correcting before you can book.',
    route: 'OnboardingWizard',
  },
  suspended: {
    icon: 'ban-outline',
    colour: C.warning,
    background: C.warningSoft,
    title: 'Your account is suspended',
    body: 'Please contact support for details.',
    route: null,
  },
})[status];

const ProfileStatusPrompt = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [status, setStatus] = useState(null);

  // useFocusEffect, not useEffect: coming back from the wizard must re-read the
  // status, or a profile that was just submitted still shows as incomplete.
  useFocusEffect(useCallback(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/user/verification`);
        if (cancelled) return;
        setStatus(res.data);
        // One fetch feeds both this prompt and the header badge.
        if (res.data?.verificationStatus) {
          dispatch(updateProfile({
            verificationStatus: res.data.verificationStatus,
            profilePhoto: res.data.profile?.profilePhoto || undefined,
          }));
        }
      } catch (error) {
        // A failed status read must not put a misleading banner on the screen —
        // rendering nothing is the safe outcome.
        console.log('Profile status check skipped:', error?.message);
      }
    })();
    return () => { cancelled = true; };
  }, []));

  const copy = status && copyFor(status.verificationStatus);
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

const styles = themedStyleSheet(C => ({
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

  title: { fontSize: 14, color: C.text, marginBottom: 2 },
  body: { fontSize: 12, color: C.textSecondary, lineHeight: 17 }
}));

export default ProfileStatusPrompt;
