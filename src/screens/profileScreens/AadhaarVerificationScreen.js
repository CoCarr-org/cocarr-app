import React, { useCallback, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator, ToastAndroid, Platform, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Header from '../../components/CenterHeader';
import CustomText from '../../components/CustomText';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import { UnauthAxios, photoUrl } from '../../utils/utils';

// Aadhaar authentication (onboarding step 5).
//
// Two phases, because the provider's offline e-KYC works that way:
//   1. Enter the Aadhaar number → an OTP goes to the linked mobile → verify it.
//      That proves the person holds the Aadhaar and returns the name on record.
//   2. Optionally attach a photo of the document for the reviewer.
//
// Passing the OTP does NOT verify the user — an admin still reviews. This is
// authentication (you hold this Aadhaar), not approval.
const AadhaarVerificationScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aadhaar, setAadhaar] = useState('');
  const [ref, setRef] = useState('');
  const [otp, setOtp] = useState('');
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const notify = (message) => {
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
    else Alert.alert('', message);
  };

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/verification`);
      setProfile(res.data);
    } catch (e) {
      setError('Could not load your details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const sendOtp = async () => {
    setError('');
    const number = aadhaar.replace(/\s/g, '');
    // 12 digits, and the first cannot be 0 or 1 — a cheap check that stops the
    // most common typos before burning a provider call.
    if (!/^[2-9][0-9]{11}$/.test(number)) {
      setError('Enter a valid 12-digit Aadhaar number.');
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(`${API_URL}/user/check-kyc`, { kycNumber: number, uid: 'self' });
      const reference = res.data?.kycRef || res.data?.ref_id || res.data?.data?.kycRef || '';
      if (!reference) throw new Error('No reference returned');
      setRef(reference);
      notify('OTP sent to the mobile linked to your Aadhaar');
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'Could not send the OTP.');
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    if (!/^\d{6}$/.test(otp.trim())) { setError('Enter the 6-digit OTP.'); return; }
    setBusy(true);
    try {
      await axios.post(`${API_URL}/user/verify-kyc`, {
        ref, otp: otp.trim(), kycNumber: aadhaar.replace(/\s/g, ''), uid: 'self',
      });
      notify('Aadhaar authenticated');
      setOtp('');
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'That OTP was not accepted.');
    } finally {
      setBusy(false);
    }
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) { notify('Could not open the gallery'); return; }
      const asset = response.assets?.[0];
      if (asset) { setError(''); setImage(asset); }
    });
  };

  const uploadDocument = async () => {
    if (!image) { setError('Add a photo of your Aadhaar first.'); return; }
    setError('');
    setBusy(true);
    try {
      const urlRes = await axios.get(`${API_URL}/image/url`, {
        params: { fileName: image.fileName, fileType: image.type, folder: 'kyc' },
      });
      const formData = new FormData();
      Object.entries(urlRes.data.fields).forEach(([f, v]) => formData.append(f, v));
      formData.append('acl', 'public-read');
      formData.append('file', { uri: image.uri, type: image.type, name: image.fileName });
      await UnauthAxios().post(urlRes.data.url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 20000,
      });

      await axios.put(`${API_URL}/user/update-kyc`, {
        kycImage: `${API_URL}/image/${urlRes.data.fields.key}`,
      });
      notify('Aadhaar document uploaded');
      setImage(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'Could not upload the document.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title='Aadhaar' />
        <View style={styles.centered}><ActivityIndicator color={BRAND_COLOR} /></View>
      </View>
    );
  }

  const doc = profile?.documents?.aadhaar || {};
  const authenticated = doc.otpVerified;

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title='Aadhaar'
        customSecondaryText='Authenticate with the OTP sent to your linked mobile' />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {doc.verified ? (
          <View style={styles.statusCard}>
            <Icon name='checkmark-circle' size={22} color='#6ee6b0' />
            <CustomText fontType='primary' weight='Bold' style={styles.ok}>Your Aadhaar is verified.</CustomText>
          </View>
        ) : null}

        {doc.status === 'rejected' && doc.rejectionReason ? (
          <View style={styles.rejection}>
            <CustomText fontType='primary' weight='Bold' style={styles.rejectionTitle}>Not accepted</CustomText>
            <CustomText fontType='primary' style={styles.rejectionBody}>{doc.rejectionReason}</CustomText>
            <CustomText fontType='primary' style={styles.rejectionHint}>Authenticate again below.</CustomText>
          </View>
        ) : null}

        {!doc.verified ? (
          <>
            {/* ── Phase 1: authenticate ── */}
            {!authenticated ? (
              <>
                <CustomText fontType='primary' weight='SemiBold' style={styles.label}>AADHAAR NUMBER</CustomText>
                <TextInput style={styles.input} value={aadhaar} keyboardType='number-pad' maxLength={12}
                  onChangeText={(t) => setAadhaar(t.replace(/[^0-9]/g, ''))}
                  placeholder='12-digit number' placeholderTextColor='#5a5a5f'
                  editable={!ref} />

                {!ref ? (
                  <TouchableOpacity onPress={sendOtp} disabled={busy}
                    style={[styles.button, busy && { backgroundColor: '#4C4C4E' }]}>
                    {busy
                      ? <ActivityIndicator color='#000' />
                      : <CustomText fontType='primary' weight='Bold' style={styles.buttonText}>Send OTP</CustomText>}
                  </TouchableOpacity>
                ) : (
                  <>
                    <CustomText fontType='primary' weight='SemiBold' style={styles.label}>OTP</CustomText>
                    <TextInput style={styles.input} value={otp} keyboardType='number-pad' maxLength={6}
                      onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, ''))}
                      placeholder='6-digit code' placeholderTextColor='#5a5a5f' />
                    <CustomText fontType='primary' style={styles.hint}>
                      Sent to the mobile number registered against this Aadhaar.
                    </CustomText>

                    <TouchableOpacity onPress={verifyOtp} disabled={busy}
                      style={[styles.button, busy && { backgroundColor: '#4C4C4E' }]}>
                      {busy
                        ? <ActivityIndicator color='#000' />
                        : <CustomText fontType='primary' weight='Bold' style={styles.buttonText}>Verify OTP</CustomText>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { setRef(''); setOtp(''); setError(''); }}>
                      <CustomText fontType='primary' weight='SemiBold' style={styles.changeLink}>
                        Use a different number
                      </CustomText>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              <>
                {/* ── Phase 2: attach the document ── */}
                <View style={styles.statusCard}>
                  <Icon name='shield-checkmark-outline' size={20} color='#6ee6b0' />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <CustomText fontType='primary' weight='Bold' style={styles.ok}>Aadhaar authenticated</CustomText>
                    {doc.holderName ? (
                      <CustomText fontType='primary' style={styles.hint}>Name on record: {doc.holderName}</CustomText>
                    ) : null}
                  </View>
                </View>

                <CustomText fontType='primary' weight='SemiBold' style={styles.label}>AADHAAR DOCUMENT</CustomText>
                <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
                  {image?.uri || doc.imageKey ? (
                    <Image source={{ uri: image?.uri || photoUrl(doc.imageKey) }}
                      style={styles.preview} resizeMode='cover' />
                  ) : (
                    <>
                      <Icon name='camera-outline' size={24} color='#757575' />
                      <CustomText fontType='primary' style={styles.uploadText}>Tap to add a photo</CustomText>
                    </>
                  )}
                </TouchableOpacity>
                <CustomText fontType='primary' style={styles.hint}>
                  Optional, but it helps our team complete your review faster.
                </CustomText>

                {image ? (
                  <TouchableOpacity onPress={uploadDocument} disabled={busy}
                    style={[styles.button, busy && { backgroundColor: '#4C4C4E' }]}>
                    {busy
                      ? <ActivityIndicator color='#000' />
                      : <CustomText fontType='primary' weight='Bold' style={styles.buttonText}>Upload document</CustomText>}
                  </TouchableOpacity>
                ) : null}
              </>
            )}

            {error ? <CustomText fontType='primary' style={styles.error}>{error}</CustomText> : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#757575', fontSize: 11, letterSpacing: 0.15, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#1c1c1e', borderRadius: 6, borderWidth: 1, borderColor: '#2c2c2e',
    color: '#f0f0f2', fontSize: 14, paddingHorizontal: 12, paddingVertical: 10,
  },
  uploadBox: {
    height: 150, borderRadius: 8, borderWidth: 1, borderColor: '#2c2c2e', borderStyle: 'dashed',
    backgroundColor: '#141416', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  uploadText: { color: '#757575', fontSize: 12, marginTop: 6 },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#141416',
    borderRadius: 8, borderWidth: 1, borderColor: '#2c2c2e', padding: 14, marginBottom: 12,
  },
  ok: { color: '#6ee6b0', fontSize: 14 },
  rejection: {
    backgroundColor: '#ef444414', borderLeftWidth: 3, borderLeftColor: '#ef4444',
    borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12,
  },
  rejectionTitle: { color: '#f87171', fontSize: 12 },
  rejectionBody: { color: '#e5b4b4', fontSize: 12, marginTop: 4 },
  rejectionHint: { color: '#a88', fontSize: 10, marginTop: 6 },
  hint: { color: '#757575', fontSize: 11, marginTop: 6, lineHeight: 15 },
  changeLink: { color: BRAND_COLOR, fontSize: 12, marginTop: 12, textAlign: 'center' },
  error: { color: '#f87171', fontSize: 12, marginTop: 12 },
  button: {
    backgroundColor: BRAND_COLOR, borderRadius: 6, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center', marginTop: 18,
  },
  buttonText: { color: '#000', fontSize: 14 },
});

export default AadhaarVerificationScreen;
