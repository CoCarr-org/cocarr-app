import React, { useCallback, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, ToastAndroid, Platform, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Header from '../../components/CenterHeader';
import CustomText from '../../components/CustomText';
import { API_URL, BRAND_COLOR } from '../../utils/constants';

// Profile verification (PRD: Signup & KYC).
//
// Collects the structured profile the matching rules compare against, shows
// what is still outstanding, and submits for admin review. Document capture
// lives on its own screens — this one orchestrates and gates the submission.
const STATUS = {
  not_started: { label: 'Not started', colour: '#b9b9c2' },
  in_progress: { label: 'In progress', colour: '#b9b9c2' },
  pending: { label: 'Verification pending', colour: BRAND_COLOR },
  verified: { label: 'Verified', colour: '#6ee6b0' },
  rejected: { label: 'Changes needed', colour: '#f87171' },
};

// Defined at module scope on purpose. Declaring this inside the component
// makes it a brand-new component type on every render, so React remounts the
// TextInput after each keystroke and focus is lost — the form becomes unusable.
const Field = ({ label, value, onChange, placeholder, keyboardType, maxLength, locked }) => (
  <>
    <CustomText fontType='primary' weight='SemiBold' style={styles.label}>{label}</CustomText>
    <TextInput
      style={[styles.input, locked && styles.inputLocked]}
      value={value}
      onChangeText={onChange}
      editable={!locked}
      placeholder={placeholder}
      placeholderTextColor='#5a5a5f'
      keyboardType={keyboardType}
      maxLength={maxLength}
    />
  </>
);

const VerificationScreen = () => {
  const navigation = useNavigation();
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', address: '', city: '', state: '', pincode: '',
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const notify = (message) => {
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
    else Alert.alert('', message);
  };

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/verification`);
      setState(res.data);
      const p = res.data?.profile || {};
      setForm({
        firstName: p.firstName || '', lastName: p.lastName || '',
        dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '',
        address: p.address || '', city: p.city || '', state: p.state || '', pincode: p.pincode || '',
      });
    } catch (e) {
      setError('Could not load your verification status');
    } finally {
      setLoading(false);
    }
  };

  // Refetches on focus, not just on mount — the user reaches this screen again
  // after submitting a document elsewhere, and a stale checklist would still
  // list something they just completed.
  useFocusEffect(useCallback(() => { load(); }, []));

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const saveProfile = async () => {
    setError('');
    setSaving(true);
    try {
      await axios.put(`${API_URL}/user/onboarding`, form);
      notify('Details saved');
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'Could not save your details');
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/user/verification/submit`);
      notify('Submitted for verification');
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'Could not submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title='Profile Verification' />
        <View style={styles.centered}><ActivityIndicator color={BRAND_COLOR} /></View>
      </View>
    );
  }

  const s = state || {};
  const status = STATUS[s.verificationStatus] || STATUS.not_started;
  const locked = s.verificationStatus === 'pending' || s.verificationStatus === 'verified';

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title='Profile Verification'
        customSecondaryText='Verified profiles appear in search' />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={styles.statusCard}>
          <View style={[styles.dot, { backgroundColor: status.colour }]} />
          <CustomText fontType='primary' weight='Bold' style={{ color: status.colour, fontSize: 14 }}>
            {status.label}
          </CustomText>
        </View>

        {s.verificationStatus === 'rejected' && s.rejectionReason ? (
          <View style={styles.rejection}>
            <CustomText fontType='primary' weight='Bold' style={styles.rejectionTitle}>What needs fixing</CustomText>
            <CustomText fontType='primary' style={styles.rejectionBody}>{s.rejectionReason}</CustomText>
            <CustomText fontType='primary' style={styles.rejectionHint}>
              Update your details below and submit again.
            </CustomText>
          </View>
        ) : null}

        {s.verificationStatus === 'pending' ? (
          <CustomText fontType='primary' style={styles.note}>
            Your details are with our team. We&apos;ll let you know once the review is complete.
          </CustomText>
        ) : null}

        {/* Outstanding items — the same list the server gates submission on, so
            the button is never enabled when the server would refuse. */}
        {!locked && s.missing?.length > 0 ? (
          <View style={styles.card}>
            <CustomText fontType='primary' weight='Bold' style={styles.cardTitle}>Still needed</CustomText>
            {s.missing.map((m) => (
              <View key={m} style={styles.missingRow}>
                <Icon name='ellipse-outline' size={12} color='#757575' />
                <CustomText fontType='primary' style={styles.missingText}>{m}</CustomText>
              </View>
            ))}
            <View style={styles.linkRow}>
              <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('LicenceVerification')}>
                <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>Licence</CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('AadhaarVerification')}>
                <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>Aadhaar</CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('PanVerification')}>
                <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>PAN</CustomText>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Name mismatch surfaced before submission, not after review. */}
        {s.nameMatch && s.nameMatch.compared?.length > 0 && !s.nameMatch.matched ? (
          <View style={styles.rejection}>
            <CustomText fontType='primary' weight='Bold' style={styles.rejectionTitle}>
              Your name doesn&apos;t match your documents
            </CustomText>
            <CustomText fontType='primary' style={styles.rejectionBody}>{s.nameMatch.summary}</CustomText>
            <CustomText fontType='primary' style={styles.rejectionHint}>
              Your first name must match exactly.
            </CustomText>
          </View>
        ) : null}

        <Field locked={locked} label='FIRST NAME' value={form.firstName} onChange={set('firstName')}
          placeholder='As on your documents' />
        <Field locked={locked} label='LAST NAME' value={form.lastName} onChange={set('lastName')} />
        <Field locked={locked} label='DATE OF BIRTH' value={form.dateOfBirth} onChange={set('dateOfBirth')}
          placeholder='YYYY-MM-DD' maxLength={10} />
        <Field locked={locked} label='ADDRESS' value={form.address} onChange={set('address')} />
        <Field locked={locked} label='CITY' value={form.city} onChange={set('city')} />
        <Field locked={locked} label='STATE' value={form.state} onChange={set('state')} />
        <Field locked={locked} label='PIN CODE' value={form.pincode} onChange={set('pincode')}
          keyboardType='number-pad' maxLength={6} />

        {error ? <CustomText fontType='primary' style={styles.error}>{error}</CustomText> : null}

        {!locked ? (
          <>
            <TouchableOpacity onPress={saveProfile} disabled={saving} style={styles.secondaryButton}>
              {saving
                ? <ActivityIndicator color={BRAND_COLOR} />
                : <CustomText fontType='primary' weight='Bold' style={styles.secondaryText}>Save details</CustomText>}
            </TouchableOpacity>

            <TouchableOpacity onPress={submit} disabled={submitting || !s.canSubmit}
              style={[styles.button, (!s.canSubmit || submitting) && { backgroundColor: '#4C4C4E' }]}>
              {submitting
                ? <ActivityIndicator color='#000' />
                : <CustomText fontType='primary' weight='Bold' style={styles.buttonText}>Submit for verification</CustomText>}
            </TouchableOpacity>

            {!s.canSubmit ? (
              <CustomText fontType='primary' style={styles.hintCentre}>
                Complete everything above to submit.
              </CustomText>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#141416',
    borderRadius: 8, borderWidth: 1, borderColor: '#2c2c2e', padding: 14, marginBottom: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 8 },
  card: {
    backgroundColor: '#141416', borderRadius: 8, borderWidth: 1, borderColor: '#2c2c2e',
    padding: 14, marginBottom: 12,
  },
  cardTitle: { color: '#f0f0f2', fontSize: 13, marginBottom: 8 },
  missingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  missingText: { color: '#b9b9c2', fontSize: 12 },
  linkRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  link: { borderWidth: 1, borderColor: '#3a3a40', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14 },
  linkText: { color: BRAND_COLOR, fontSize: 12 },
  rejection: {
    backgroundColor: '#ef444414', borderLeftWidth: 3, borderLeftColor: '#ef4444',
    borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12,
  },
  rejectionTitle: { color: '#f87171', fontSize: 12 },
  rejectionBody: { color: '#e5b4b4', fontSize: 12, marginTop: 4 },
  rejectionHint: { color: '#a88', fontSize: 10, marginTop: 6 },
  note: { color: '#757575', fontSize: 12, marginBottom: 12, lineHeight: 17 },
  label: { color: '#757575', fontSize: 11, letterSpacing: 0.15, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#1c1c1e', borderRadius: 6, borderWidth: 1, borderColor: '#2c2c2e',
    color: '#f0f0f2', fontSize: 14, paddingHorizontal: 12, paddingVertical: 10,
  },
  inputLocked: { opacity: 0.5 },
  hint: { color: '#757575', fontSize: 11, marginTop: 10, lineHeight: 15 },
  hintCentre: { color: '#757575', fontSize: 11, marginTop: 8, textAlign: 'center' },
  error: { color: '#f87171', fontSize: 12, marginTop: 12 },
  button: {
    backgroundColor: BRAND_COLOR, borderRadius: 6, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  buttonText: { color: '#000', fontSize: 14 },
  secondaryButton: {
    borderWidth: 1, borderColor: '#3a3a40', borderRadius: 6, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center', marginTop: 22,
  },
  secondaryText: { color: '#f0f0f2', fontSize: 14 },
});

export default VerificationScreen;
