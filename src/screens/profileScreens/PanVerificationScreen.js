import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator, ToastAndroid, Platform, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/CenterHeader';
import CustomText from '../../components/CustomText';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import { UnauthAxios, photoUrl } from '../../utils/utils';

// PAN capture. Required before host payouts can be released (tax reporting).
// Submitting never verifies — approval is an admin decision, same as KYC and
// licence, so the best this screen can ever show is "pending review".
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

const PanVerificationScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panNumber, setPanNumber] = useState('');
  const [panName, setPanName] = useState('');
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const notify = (message) => {
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
    else Alert.alert('', message);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/user/profile?populate=true`);
        const u = res.data?.user || res.data?.data || res.data || {};
        setProfile(u);
        if (u.panName) setPanName(u.panName);
      } catch (e) {
        setError('Could not load your profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) { notify('Could not open the gallery'); return; }
      const asset = response.assets?.[0];
      if (asset) { setError(''); setImage(asset); }
    });
  };

  const uploadPan = async (asset) => {
    const urlRes = await axios.get(`${API_URL}/image/url`, {
      params: { fileName: asset.fileName, fileType: asset.type, folder: 'pan' },
    });

    const formData = new FormData();
    Object.entries(urlRes.data.fields).forEach(([field, value]) => formData.append(field, value));
    formData.append('acl', 'public-read');
    formData.append('file', { uri: asset.uri, type: asset.type, name: asset.fileName });

    await UnauthAxios().post(urlRes.data.url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 20000,
    });

    // Build the proxy URL from the key — `url + key` is malformed, since the
    // presigned url has no trailing slash.
    return `${API_URL}/image/${urlRes.data.fields.key}`;
  };

  const submit = async () => {
    setError('');
    const pan = panNumber.trim().toUpperCase();

    // Validated here as well as on the server so a typo is caught before the
    // upload rather than after it.
    if (!PAN_RE.test(pan)) { setError('Enter a valid PAN — ten characters, like ABCDE1234F.'); return; }
    if (!panName.trim()) { setError('Enter the name exactly as printed on the card.'); return; }
    if (!image && !p.panImage) { setError('Add a photo of your PAN card.'); return; }

    setSaving(true);
    try {
      const panImage = image ? await uploadPan(image) : p.panImage;
      await axios.put(`${API_URL}/user/update-pan`, { panNumber: pan, panName: panName.trim(), panImage });
      setSubmitted(true);
      notify('PAN submitted for review');
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Could not submit your PAN.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title='PAN Verification' />
        <View style={styles.centered}><ActivityIndicator color={BRAND_COLOR} /></View>
      </View>
    );
  }

  const p = profile || {};
  const alreadySubmitted = submitted || (p.panNumber && p.panImage);

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title='PAN Verification'
        customSecondaryText='Required before we can pay out your earnings' />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {p.panVerified ? (
          <View style={styles.statusCard}>
            <Icon name='checkmark-circle' size={22} color='#6ee6b0' />
            <CustomText fontType='primary' weight='Bold' style={styles.statusOk}>Your PAN is verified.</CustomText>
          </View>
        ) : alreadySubmitted ? (
          <View style={styles.statusCard}>
            <Icon name='time-outline' size={22} color={BRAND_COLOR} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <CustomText fontType='primary' weight='Bold' style={styles.statusPending}>
                PAN submitted — pending review
              </CustomText>
              <CustomText fontType='primary' style={styles.hint}>
                We&apos;ll let you know once our team completes verification.
              </CustomText>
            </View>
          </View>
        ) : (
          <>
            <CustomText fontType='primary' weight='SemiBold' style={styles.label}>PAN NUMBER</CustomText>
            <TextInput
              style={styles.input}
              value={panNumber}
              onChangeText={(t) => setPanNumber(t.toUpperCase())}
              placeholder='ABCDE1234F'
              placeholderTextColor='#5a5a5f'
              autoCapitalize='characters'
              maxLength={10}
            />

            <CustomText fontType='primary' weight='SemiBold' style={styles.label}>NAME AS ON CARD</CustomText>
            <TextInput
              style={styles.input}
              value={panName}
              onChangeText={setPanName}
              placeholder='Full name printed on the PAN'
              placeholderTextColor='#5a5a5f'
            />
            {/* A name mismatch is the first thing a reviewer checks, so say it
                up front rather than failing the review later. */}
            <CustomText fontType='primary' style={styles.hint}>
              This must match the card exactly, even if it differs from your account name.
            </CustomText>

            <CustomText fontType='primary' weight='SemiBold' style={[styles.label, { marginTop: 20 }]}>
              PAN CARD PHOTO
            </CustomText>
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              {image?.uri || p.panImage ? (
                <Image source={{ uri: image?.uri || photoUrl(p.panImage) }} style={styles.preview} resizeMode='cover' />
              ) : (
                <>
                  <Icon name='cloud-upload-outline' size={26} color='#757575' />
                  <CustomText fontType='primary' style={styles.uploadText}>Tap to add a photo</CustomText>
                </>
              )}
            </TouchableOpacity>
            {(image?.uri || p.panImage) && (
              <TouchableOpacity onPress={pickImage}>
                <CustomText fontType='primary' weight='SemiBold' style={styles.changePhoto}>Change photo</CustomText>
              </TouchableOpacity>
            )}

            {error ? (
              <CustomText fontType='primary' style={styles.error}>{error}</CustomText>
            ) : null}

            <TouchableOpacity
              disabled={saving}
              onPress={submit}
              style={[styles.button, saving && { backgroundColor: '#4C4C4E' }]}>
              {saving
                ? <ActivityIndicator color='#000' />
                : <CustomText fontType='primary' weight='Bold' style={styles.buttonText}>Submit for review</CustomText>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { color: '#757575', fontSize: 11, letterSpacing: 0.15, textTransform: 'uppercase', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#1c1c1e', borderRadius: 6, borderWidth: 1, borderColor: '#2c2c2e',
    color: '#f0f0f2', fontSize: 14, paddingHorizontal: 12, paddingVertical: 10,
  },
  hint: { color: '#757575', fontSize: 11, marginTop: 6, lineHeight: 16 },
  uploadBox: {
    height: 160, borderRadius: 8, borderWidth: 1, borderColor: '#2c2c2e', borderStyle: 'dashed',
    backgroundColor: '#141416', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  uploadText: { color: '#757575', fontSize: 12, marginTop: 6 },
  changePhoto: { color: BRAND_COLOR, fontSize: 12, marginTop: 8 },
  error: { color: '#f87171', fontSize: 12, marginTop: 12 },
  button: {
    backgroundColor: BRAND_COLOR, borderRadius: 6, paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center', marginTop: 22,
  },
  buttonText: { color: '#000', fontSize: 14 },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#141416',
    borderRadius: 8, borderWidth: 1, borderColor: '#2c2c2e', padding: 14,
  },
  statusOk: { color: '#6ee6b0', fontSize: 14, marginLeft: 10 },
  statusPending: { color: BRAND_COLOR, fontSize: 14 },
});

export default PanVerificationScreen;
