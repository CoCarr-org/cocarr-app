import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../utils/constants';

import { C } from '../theme';

// Status badge overlaid on a profile avatar. Mirrors the web app's
// VerificationBadge so the same state reads the same on both.
//
// Absolutely positioned, so the parent must be `position: 'relative'` — which is
// the RN default for a View, unlike the web where it had to be added.
//
// Only renders for a status worth flagging: an `active` profile gets the tick,
// and there is deliberately no badge for a state we have nothing to say about,
// because a permanent decoration stops being read.

// A function so colours resolve against the active scheme at render time.
const badgeFor = (status) => ({
  active: { icon: 'checkmark', bg: C.success, fg: C.onPrimary },
  pending: { icon: 'time-outline', bg: C.primary, fg: C.onPrimary },
  incomplete: { icon: 'alert', bg: C.warning, fg: C.onPrimary },
  rejected: { icon: 'close', bg: C.danger, fg: C.onDanger },
  suspended: { icon: 'ban', bg: C.dangerSoft, fg: C.danger },
})[status];

const SIZES = { sm: 16, md: 22, lg: 30 };

// `status` may be supplied by the caller. The shell header does that — it reads
// the value straight from redux, so the badge stays live as the wizard dispatches
// updates without the header issuing a request on every tab switch. Screens that
// have no status to hand omit it and the badge fetches once on focus.
const VerificationBadge = ({ size = 'md', ringColor = C.background, status: statusProp }) => {
  const [fetched, setFetched] = useState(null);
  const controlled = statusProp !== undefined;

  // useFocusEffect, not useEffect: returning from the wizard must re-read the
  // status, or a profile just submitted still shows the old badge.
  useFocusEffect(useCallback(() => {
    if (controlled) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/user/verification`);
        if (!cancelled) setFetched(res.data?.verificationStatus || null);
      } catch (error) {
        // Showing "unverified" because a request timed out would be worse than
        // showing nothing.
        console.log('Verification badge skipped:', error?.message);
      }
    })();
    return () => { cancelled = true; };
  }, [controlled]));

  const status = controlled ? statusProp : fetched;
  const badge = status && badgeFor(status);
  if (!badge) return null;

  const dimension = SIZES[size] || SIZES.md;

  return (
    <View
      style={[
        styles.badge,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: badge.bg,
          // Ring in the surrounding background so the badge reads as separate
          // from the photo rather than as part of it.
          borderColor: ringColor,
        },
      ]}
    >
      <Icon name={badge.icon} size={Math.round(dimension * 0.62)} color={badge.fg} />
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});

export default VerificationBadge;
