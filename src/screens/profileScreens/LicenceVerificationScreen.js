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

// Driving licence capture (onboarding step 4).
//
// Submitting runs the provider check server-side and stores whatever it
// extracts, but does NOT verify the licence — an admin reviews it and makes
// that call. The best this screen ever shows is "submitted, pending review".
const LICENCE_RE = /^[A-Z]{2}[0-9]{2}[0-9A-Z]{10,12}$/;

const ImageBox = ({ label, uri, onPick }) => (
  <TouchableOpacity style={styles.uploadBox} onPress={onPick}>
    {uri ? (
      <Image source={{ uri }} style={styles.preview} resizeMode='cover' />
    ) : (
      <>
        <Icon name='camera-outline' size={24} color='#757575' />
        <CustomText fontType='primary' style={styles.uploadText}>{label}</CustomText>
      </>
    )}
  </TouchableOpacity>
);

const LicenceVerificationScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [licenceNumber, setLicenceNumber] = useState('');
  const [dob, setDob] = useState('');
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const notify = (message) => {
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
    else Alert.alert('', message);
  };

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/verification`);
      setProfile(res.data);
      const dobFromProfile = res.data?.profile?.dateOfBirth;
      if (dobFromProfile) setDob(String(dobFromProfile).slice(0, 10));
    } catch (e) {
      setError('Could not load your details');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const pick = (setter) => () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) { notify('Could not open the gallery'); return; }
      const asset = response.assets?.[0];
      if (asset) { setError(''); setter(asset); }
    });
  };

  const upload = async (asset) => {
    const urlRes = await axios.get(`${API_URL}/image/url`, {
      params: { fileName: asset.fileName, fileType: asset.type, folder: 'license' },
    });
    const formData = new FormData();
    Object.entries(urlRes.data.fields).forEach(([f, v]) => formData.append(f, v));
    formData.append('acl', 'public-read');
    formData.append('file', { uri: asset.uri, type: asset.type, name: asset.fileName });
    await UnauthAxios().post(urlRes.data.url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 20000,
    });
    // Build the proxy URL from the key — `url + key` is malformed.
    return `${API_URL}/image/${urlRes.data.fields.key}`;
  };

  const submit = async () => {
    setError('');
    const number = licenceNumber.trim().toUpperCase().replace(/[\s-]/g, '');

    if (!LICENCE_RE.test(number)) {
      setError('Enter a valid licence number, e.g. KA0520190001234.');
      return;
    }
    // The provider needs the DOB the licence was issued against — it is the
    // second factor proving you hold the licence, not just know its number.
    if (!dob) {
      setError('Add your date of birth on the verification screen first.');
      return;
    }
    const existing = profile?.documents?.licence || {};
    if (!front && !existing.frontImageKey) { setError('Add a photo of the front.'); return; }
    if (!back && !existing.backImageKey) { setError('Add a photo of the back.'); return; }

    setSaving(true);
    try {
      const [licenseFrontImage, licenseBackImage] = await Promise.all([
        front ? upload(front) : existing.frontImageKey,
        back ? upload(back) : existing.backImageKey,
      ]);
      await axios.put(`${API_URL}/user/update-license`, {
        licenseNumber: number,
        licenseDob: dob,
        licenseFrontImage,
        licenseBackImage,
      });
      notify('Licence submitted for review');
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'Could not submit your licence.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title='Driving Licence' />
        <View style={styles.centered}><ActivityIndicator color={BRAND_COLOR} /></View>
      </View>
    );
  }

  const doc = profile?.documents?.licence || {};
  const submitted = doc.submitted;
  const verified = doc.verified;

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title='Driving Licence'
        customSecondaryText='Required before you can book' />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {verified ? (
          <View style={styles.statusCard}>
            <Icon name='checkmark-circle' size={22} color='#6ee6b0' />
            <CustomText fontType='primary' weight='Bold' style={styles.ok}>Your licence is verified.</CustomText>
          </View>
        ) : null}

        {/* A rejected document must say why, or resubmitting is guesswork. */}
        {doc.status === 'rejected' && doc.rejectionReason ? (
          <View style={styles.rejection}>
            <CustomText fontType='primary' weight='Bold' style={styles.rejectionTitle}>Not accepted</CustomText>
            <CustomText fontType='primary' style={styles.rejectionBody}>{doc.rejectionReason}</CustomText>
            <CustomText fontType='primary' style={styles.rejectionHint}>Upload again below.</CustomText>
          </View>
        ) : null}

        {submitted && !verified && doc.status !== 'rejected' ? (
          <View style={styles.statusCard}>
            <Icon name='time-outline' size={22} color={BRAND_COLOR} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <CustomText fontType='primary' weight='Bold' style={styles.pending}>Submitted — pending review</CustomText>
              <CustomText fontType='primary' style={styles.hint}>
                Our team checks it against the licensing records.
              </CustomText>
            </View>
          </View>
        ) : null}

        {!verified ? (
          <>
            <CustomText fontType='primary' weight='SemiBold' style={styles.label}>LICENCE NUMBER</CustomText>
            <TextInput style={styles.input} value={licenceNumber} autoCapitalize='characters' maxLength={16}
              onChangeText={(t) => setLicenceNumber(t.toUpperCase())}
              placeholder='KA0520190001234' placeholderTextColor='#5a5a5f' />

            <CustomText fontType='primary' weight='SemiBold' style={styles.label}>DATE OF BIRTH</CustomText>
            <TextInput style={styles.input} value={dob} onChangeText={setDob}
              placeholder='YYYY-MM-DD' placeholderTextColor='#5a5a5f' maxLength={10} />
            <CustomText fontType='primary' style={styles.hint}>
              Must match the date on the licence — it is how the licensing record is looked up.
            </CustomText>

            <CustomText fontType='primary' weight='SemiBold' style={[styles.label, { marginTop: 18 }]}>FRONT</CustomText>
            <ImageBox label='Tap to add the front' uri={front?.uri || (doc.frontImageKey ? photoUrl(doc.frontImageKey) : null)}
              onPick={pick(setFront)} />

            <CustomText fontType='primary' weight='SemiBold' style={styles.label}>BACK</CustomText>
            <ImageBox label='Tap to add the back' uri={back?.uri || (doc.backImageKey ? photoUrl(doc.backImageKey) : null)}
              onPick={pick(setBack)} />

            {error ? <CustomText fontType='primary' style={styles.error}>{error}</CustomText> : null}

            <TouchableOpacity onPress={submit} disabled={saving}
              style={[styles.button, saving && { backgroundColor: '#4C4C4E' }]}>
              {saving
                ? <ActivityIndicator color='#000' />
                : <CustomText fontType='primary' weight='Bold' style={styles.buttonText}>
                    {submitted ? 'Resubmit licence' : 'Submit licence'}
                  </CustomText>}
            </TouchableOpacity>
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
  ok: { color: '#6ee6b0', fontSize: 14, marginLeft: 10 },
  pending: { color: BRAND_COLOR, fontSize: 14 },
  rejection: {
    backgroundColor: '#ef444414', borderLeftWidth: 3, borderLeftColor: '#ef4444',
    borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12,
  },
  rejectionTitle: { color: '#f87171', fontSize: 12 },
  rejectionBody: { color: '#e5b4b4', fontSize: 12, marginTop: 4 },
  rejectionHint: { color: '#a88', fontSize: 10, marginTop: 6 },
  hint: { color: '#757575', fontSize: 11, marginTop: 6, lineHeight: 15 },
  error: { color: '#f87171', fontSize: 12, marginTop: 12 },
  button: {
    backgroundColor: BRAND_COLOR, borderRadius: 6, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center', marginTop: 22,
  },
  buttonText: { color: '#000', fontSize: 14 },
});

export default LicenceVerificationScreen;
