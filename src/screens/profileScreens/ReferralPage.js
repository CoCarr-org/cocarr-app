import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, Share, TouchableHighlight } from 'react-native';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import { notify } from '../../utils/utils';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../../components/CustomText';

// Refer & Earn. The shareable code and the referral list both come from the
// referral module's dashboard (GET /referral/history → getReferralOverview).
// A code only exists once the user has completed verification and become an
// active user (backend mints it on approval), so `codeActive` gates whether we
// show the code at all — otherwise we explain how to unlock it.
export default function ReferralPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const response = await axios.get(`${API_URL}/referral/history`);
      setOverview(response.data || {});
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refetch on every focus so a just-approved user sees their new code without
  // a manual reload (the screen stays mounted in the stack).
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const code = overview?.referralCode || overview?.code || null;
  const codeActive = overview?.codeActive && !!code;
  const referrals = overview?.referrals || [];

  const share = async () => {
    if (!code) return;
    try {
      await Share.share({
        title: 'Refer & Earn',
        message: `Hey! Join Cocarr with me and get reward points on your first booking. Use my referral code: ${code} to sign up.`,
      });
    } catch (e) {
      notify('Could not open the share sheet. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerFill}>
        <CustomText fontType="primary" weight="Medium" style={styles.errorText}>
          Something went wrong. Pull to try again.
        </CustomText>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND_COLOR} />}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Icon name="people-outline" size={24} color={BRAND_COLOR} />
        </View>
        <CustomText fontType="primary" weight="SemiBold" style={styles.heroTitle}>Refer & Earn</CustomText>
        <CustomText fontType="primary" weight="Medium" style={styles.heroSubtitle}>
          Share your code — you both earn points.
        </CustomText>
      </View>

      {codeActive ? (
        <View style={styles.codeCard}>
          <CustomText fontType="primary" weight="Medium" style={styles.codeLabel}>YOUR REFERRAL CODE</CustomText>
          {/* selectable so the code can be long-pressed to copy; the button
              opens the OS share sheet (which also offers Copy). */}
          <CustomText fontType="primary" weight="Bold" style={styles.codeValue} selectable>{code}</CustomText>
          <TouchableHighlight underlayColor="#b38f1f" style={styles.shareBtn} onPress={share}>
            <CustomText fontType="primary" weight="Bold" style={styles.shareBtnText}>Share code</CustomText>
          </TouchableHighlight>
        </View>
      ) : (
        <View style={styles.lockedCard}>
          <Icon name="lock-closed-outline" size={20} color="#a3a3a3" />
          <CustomText fontType="primary" weight="SemiBold" style={styles.lockedTitle}>
            Your code unlocks after verification
          </CustomText>
          <CustomText fontType="primary" weight="Medium" style={styles.lockedSubtitle}>
            Complete your profile verification to get your own referral code and start earning.
          </CustomText>
        </View>
      )}

      {/* Stats */}
      {codeActive && (
        <View style={styles.statsRow}>
          <Stat label="Referrals" value={overview?.totalReferrals ?? referrals.length} />
          <Stat label="Completed" value={overview?.completed ?? 0} />
          <Stat label="Points earned" value={overview?.totalPointsEarned ?? 0} />
        </View>
      )}

      {/* History */}
      <CustomText fontType="primary" weight="SemiBold" style={styles.sectionTitle}>Your referrals</CustomText>
      {referrals.length === 0 ? (
        <CustomText fontType="primary" weight="Medium" style={styles.emptyText}>
          {codeActive
            ? 'No referrals yet. Share your code to get started.'
            : 'Referrals you make will appear here once your code is active.'}
        </CustomText>
      ) : (
        <View style={styles.list}>
          {referrals.map((r, i) => (
            <View key={r.id || i} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <CustomText fontType="primary" weight="SemiBold" style={styles.itemName}>{r.name || 'Friend'}</CustomText>
                <CustomText fontType="primary" weight="Medium" style={styles.itemStatus}>{labelFor(r.status)}</CustomText>
              </View>
              {r.points != null && r.points > 0 && (
                <CustomText fontType="primary" weight="Bold" style={styles.itemPoints}>+{r.points}</CustomText>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const labelFor = (status) => {
  switch (status) {
    case 'rewarded': return 'Reward credited';
    case 'eligible': return 'Signed up — reward pending';
    case 'pending': return 'Invited — pending verification';
    case 'cancelled': return 'Cancelled';
    case 'fraud': return 'Blocked';
    default: return 'Joined';
  }
};

const Stat = ({ label, value }) => (
  <View style={styles.stat}>
    <CustomText fontType="primary" weight="Bold" style={styles.statValue}>{value}</CustomText>
    <CustomText fontType="primary" weight="Medium" style={styles.statLabel}>{label}</CustomText>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 24 },
  errorText: { color: '#e3e3e3', fontSize: 14, textAlign: 'center', maxWidth: '75%', letterSpacing: 0.05 },

  hero: { backgroundColor: '#1c1c1e', paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center' },
  heroIcon: { width: 48, height: 48, borderRadius: 56, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { color: '#e3e3e3', fontSize: 16, textAlign: 'center', letterSpacing: 0.05 },
  heroSubtitle: { color: '#a3a3a3', fontSize: 12, textAlign: 'center', letterSpacing: -0.05, marginTop: 4 },

  codeCard: { backgroundColor: '#151515', margin: 16, borderRadius: 12, paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1, borderColor: '#252525' },
  codeLabel: { color: '#808080', fontSize: 11, letterSpacing: 1, marginBottom: 8 },
  codeValue: { color: BRAND_COLOR, fontSize: 30, letterSpacing: 4, marginBottom: 16 },
  shareBtn: { backgroundColor: BRAND_COLOR, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24 },
  shareBtnText: { color: '#000', fontSize: 12, letterSpacing: -0.05, textTransform: 'uppercase' },

  lockedCard: { backgroundColor: '#151515', margin: 16, borderRadius: 12, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', borderWidth: 1, borderColor: '#252525' },
  lockedTitle: { color: '#e3e3e3', fontSize: 14, textAlign: 'center', marginTop: 12 },
  lockedSubtitle: { color: '#a3a3a3', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 6, maxWidth: '90%' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  stat: { flex: 1, backgroundColor: '#151515', borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#252525' },
  statValue: { color: '#efefef', fontSize: 18 },
  statLabel: { color: '#808080', fontSize: 10, marginTop: 4, textAlign: 'center' },

  sectionTitle: { color: '#e3e3e3', fontSize: 14, paddingHorizontal: 16, marginTop: 20, marginBottom: 12 },
  emptyText: { color: '#808080', fontSize: 13, paddingHorizontal: 16, lineHeight: 18 },

  list: { paddingHorizontal: 16, gap: 10 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#151515', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#252525' },
  itemName: { color: '#efefef', fontSize: 14 },
  itemStatus: { color: '#808080', fontSize: 11, marginTop: 3 },
  itemPoints: { color: BRAND_COLOR, fontSize: 15 },
});
