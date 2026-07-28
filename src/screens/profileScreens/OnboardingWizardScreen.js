import React, { useCallback, useRef, useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
import Header from '../../components/CenterHeader';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import { notify, photoUrl, uploadImage } from '../../utils/utils';

// Onboarding wizard — the flow a new account lands in straight after OTP
// verification, and what the "Complete your profile" prompt reopens.
//
//   1. Profile details   MANDATORY (everything except the photo)
//   2. Driving licence   skippable
//   3. Aadhaar           skippable
//   4. Review & save     -> home
//
// Skipping a document is a supported outcome, not a failure: the profile stays
// `incomplete` and the app keeps prompting. Only a complete submission reaches
// `pending`. The wizard never decides the status itself — it submits and
// reports whatever the server came back with.

const STEPS = ['Details', 'Licence', 'Aadhaar', 'Review'];

const GATE_NOTE =
  'You can browse cars right away, but a ride can only be booked once your '
  + 'driving licence and Aadhaar have been verified.';

const LICENCE_RE = /^[A-Z]{2}[0-9]{2}[0-9A-Z]{10,12}$/;

// ── Module scope, deliberately ──────────────────────────────────────────────
// A component declared inside another component's render is a brand-new type
// on every render, so React unmounts and remounts it — in a form that means
// the TextInput loses focus after a single keystroke and typing is impossible.
// This has bitten these screens three times. Do not move these inside.

const Field = ({ label, value, onChange, required, placeholder, keyboardType, maxLength, autoCapitalize }) => (
  <View style={styles.field}>
    <CustomText fontType='primary' style={styles.fieldLabel}>
      {label}{required ? <CustomText style={styles.req}> *</CustomText> : null}
    </CustomText>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor='#6b6b73'
      keyboardType={keyboardType}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
    />
  </View>
);

const ImageBox = ({ label, uri, onPick }) => (
  <TouchableOpacity style={styles.uploadBox} onPress={onPick}>
    {uri ? (
      <Image source={{ uri }} style={styles.preview} resizeMode='cover' />
    ) : (
      <>
        <Icon name='camera-outline' size={22} color='#757575' />
        <CustomText fontType='primary' style={styles.uploadText}>{label}</CustomText>
      </>
    )}
  </TouchableOpacity>
);

const StepRail = ({ step }) => (
  <View style={styles.rail}>
    {STEPS.map((label, i) => (
      <View key={label} style={styles.railItem}>
        <View style={[
          styles.railDot,
          i === step && styles.railDotCurrent,
          i < step && styles.railDotDone,
        ]}>
          <CustomText fontType='primary' weight='Bold' style={[
            styles.railDotText,
            (i === step || i < step) && styles.railDotTextOn,
          ]}>
            {i < step ? '✓' : String(i + 1)}
          </CustomText>
        </View>
        <CustomText fontType='primary' style={[styles.railLabel, i === step && styles.railLabelOn]}>
          {label}
        </CustomText>
      </View>
    ))}
  </View>
);

const Note = ({ children }) => (
  <View style={styles.note}>
    <CustomText fontType='primary' style={styles.noteText}>{children}</CustomText>
  </View>
);

const ReviewRow = ({ label, value, tone }) => (
  <View style={styles.reviewRow}>
    <CustomText fontType='primary' style={styles.reviewLabel}>{label}</CustomText>
    <CustomText fontType='primary' weight={tone ? 'Bold' : 'Regular'} style={[
      styles.reviewValue,
      tone === 'ok' && styles.reviewOk,
      tone === 'warn' && styles.reviewWarn,
    ]}>
      {value}
    </CustomText>
  </View>
);

// ────────────────────────────────────────────────────────────────────────────

const OnboardingWizardScreen = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);
  const scroller = useRef(null);

  // Step 1
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', dateOfBirth: '',
    address: '', city: '', state: '', pincode: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoExisting, setPhotoExisting] = useState('');

  // Step 2
  const [licenceNumber, setLicenceNumber] = useState('');
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);

  // Step 3 — mirrors the provider: number, then OTP, then an optional photo.
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarRef, setAadhaarRef] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [aadhaarImage, setAadhaarImage] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/verification`);
      setStatus(res.data);
      const p = res.data?.profile || {};
      setForm({
        firstName: p.firstName || '', lastName: p.lastName || '',
        email: p.email || '',
        dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '',
        address: p.address || '', city: p.city || '',
        state: p.state || '', pincode: p.pincode || '',
      });
      setPhotoExisting(p.profilePhoto || '');
      const licence = res.data?.documents?.licence;
      if (licence?.licenceNumber) setLicenceNumber(licence.licenceNumber);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load your profile');
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect, not useEffect: returning here from a capture screen must
  // re-read the status, or a document just uploaded still shows as missing.
  useFocusEffect(useCallback(() => { load(); }, []));

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const goStep = (n) => {
    setError('');
    setStep(n);
    scroller.current?.scrollTo({ y: 0, animated: true });
  };

  const pick = (setter) => async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (res.didCancel || !res.assets?.length) return;
    setError('');
    setter(res.assets[0]);
  };

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setError('');
    const required = {
      firstName: 'First name', lastName: 'Last name', dateOfBirth: 'Date of birth',
      address: 'Address', city: 'City', state: 'State', pincode: 'PIN code',
    };
    const missing = Object.entries(required)
      .filter(([k]) => !String(form[k] || '').trim())
      .map(([, label]) => label);
    if (missing.length) { setError(`Please fill in: ${missing.join(', ')}`); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth)) {
      setError('Enter your date of birth as YYYY-MM-DD.');
      return;
    }

    setBusy(true);
    try {
      // The photo is optional, so a failed upload must not block the step —
      // it is reported and the rest of the details still save.
      if (photo) {
        try {
          const url = await uploadImage(photo, 'profile');
          await axios.put(`${API_URL}/user/update-photo`, { profilePhoto: url });
          setPhotoExisting(url);
          setPhoto(null);
        } catch {
          notify('Your photo could not be uploaded, but your details were saved.');
        }
      }
      await axios.put(`${API_URL}/user/onboarding`, form);
      await load();
      goStep(1);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save your details.');
    } finally {
      setBusy(false);
    }
  };

  // ── Step 2 ────────────────────────────────────────────────────────────────
  const saveLicence = async () => {
    setError('');
    const number = licenceNumber.trim().toUpperCase().replace(/[\s-]/g, '');
    if (!LICENCE_RE.test(number)) {
      setError('Enter a valid licence number, e.g. KA0520190001234.');
      return;
    }
    const already = status?.documents?.licence;
    if (!front && !already?.frontImageKey) {
      setError('Add a photo of the front of your licence.');
      return;
    }

    setBusy(true);
    try {
      const [licenseFrontImage, licenseBackImage] = await Promise.all([
        front ? uploadImage(front, 'license') : already?.frontImageKey,
        back ? uploadImage(back, 'license') : already?.backImageKey,
      ]);
      await axios.put(`${API_URL}/user/update-license`, {
        licenseNumber: number,
        licenseFrontImage,
        licenseBackImage,
        dateOfBirth: form.dateOfBirth,
      });
      await load();
      goStep(2);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save your licence.');
    } finally {
      setBusy(false);
    }
  };

  // ── Step 3 ────────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    setError('');
    const number = aadhaar.replace(/\s/g, '');
    if (!/^\d{12}$/.test(number)) { setError('Enter the 12-digit Aadhaar number.'); return; }
    setBusy(true);
    try {
      const res = await axios.post(`${API_URL}/user/check-kyc`, { kycNumber: number, uid: 'self' });
      setAadhaarRef(res.data?.kycRef || '');
      setOtpSent(true);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not send the Aadhaar OTP.');
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    if (!otp.trim()) { setError('Enter the OTP sent to your Aadhaar-linked number.'); return; }
    setBusy(true);
    try {
      await axios.post(`${API_URL}/user/verify-kyc`, {
        ref: aadhaarRef, otp: otp.trim(), kycNumber: aadhaar.replace(/\s/g, ''), uid: 'self',
      });
      if (aadhaarImage) {
        const kycImage = await uploadImage(aadhaarImage, 'kyc');
        await axios.put(`${API_URL}/user/update-kyc`, { kycImage });
      }
      await load();
      goStep(3);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not verify the OTP.');
    } finally {
      setBusy(false);
    }
  };

  // ── Step 4 ────────────────────────────────────────────────────────────────
  const finish = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await axios.post(`${API_URL}/user/verification/submit`);
      notify(res.data?.verificationStatus === 'pending'
        ? 'Your profile is under verification'
        : 'Profile saved. Add your documents to start booking.');
      // Reset rather than navigate: the wizard sits on the stack and going
      // "back" into a flow that has been submitted makes no sense.
      navigation.reset({ index: 0, routes: [{ name: 'HomeTab' }] });
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save your profile.');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title='Complete your profile' />
        <View style={styles.centered}><ActivityIndicator color={BRAND_COLOR} /></View>
      </View>
    );
  }

  const docs = status?.documents || {};
  const licenceDone = !!docs.licence?.submitted;
  const aadhaarDone = !!docs.aadhaar?.submitted;
  const bothDone = licenceDone && aadhaarDone;

  return (
    <View style={styles.container}>
      <Header navigation={navigation} title='Complete your profile' />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView ref={scroller} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps='handled'>
          <StepRail step={step} />

          {error ? (
            <CustomText fontType='primary' style={styles.error}>{error}</CustomText>
          ) : null}

          {/* ── Step 1 ── */}
          {step === 0 && (
            <>
              <CustomText fontType='primary' style={styles.hint}>
                These details are matched against your documents, so enter them exactly as
                they appear there.
              </CustomText>

              <View style={styles.photoRow}>
                {photo || photoExisting ? (
                  <Image
                    source={{ uri: photo ? photo.uri : photoUrl(photoExisting) }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarEmpty]} />
                )}
                <View style={{ flex: 1 }}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={pick(setPhoto)}>
                    <CustomText fontType='primary' weight='SemiBold' style={styles.secondaryBtnText}>
                      {photo || photoExisting ? 'Change photo' : 'Add a photo'}
                    </CustomText>
                  </TouchableOpacity>
                  <CustomText fontType='primary' style={styles.optional}>Optional.</CustomText>
                </View>
              </View>

              <Field label='First name' value={form.firstName} onChange={set('firstName')} required />
              <Field label='Last name' value={form.lastName} onChange={set('lastName')} required />
              <Field label='Email' value={form.email} onChange={set('email')}
                keyboardType='email-address' autoCapitalize='none' required />
              <Field label='Date of birth' value={form.dateOfBirth} onChange={set('dateOfBirth')}
                placeholder='YYYY-MM-DD' maxLength={10} required />
              <Field label='Address' value={form.address} onChange={set('address')} required />
              <Field label='City' value={form.city} onChange={set('city')} required />
              <Field label='State' value={form.state} onChange={set('state')} required />
              <Field label='PIN code' value={form.pincode} onChange={set('pincode')}
                keyboardType='number-pad' maxLength={6} required />

              <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={saveProfile}>
                <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                  {busy ? 'Saving…' : 'Continue'}
                </CustomText>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === 1 && (
            <>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>
                Upload your driving licence
              </CustomText>
              <Note>{GATE_NOTE}</Note>

              {licenceDone ? (
                <CustomText fontType='primary' style={styles.ok}>
                  Your licence is on file. You can replace it below.
                </CustomText>
              ) : null}

              <Field label='Licence number' value={licenceNumber}
                onChange={(t) => setLicenceNumber(t.toUpperCase())}
                placeholder='KA0520190001234' autoCapitalize='characters' required />

              <View style={styles.uploadRow}>
                <ImageBox label='Front *'
                  uri={front ? front.uri : photoUrl(docs.licence?.frontImageKey)}
                  onPick={pick(setFront)} />
                <ImageBox label='Back'
                  uri={back ? back.uri : photoUrl(docs.licence?.backImageKey)}
                  onPick={pick(setBack)} />
              </View>

              <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={saveLicence}>
                <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                  {busy ? 'Saving…' : 'Continue'}
                </CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipBtn} disabled={busy} onPress={() => goStep(2)}>
                <CustomText fontType='primary' weight='SemiBold' style={styles.skipText}>
                  Skip for now
                </CustomText>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 3 ── */}
          {step === 2 && (
            <>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>
                Upload your Aadhaar card
              </CustomText>
              <Note>{GATE_NOTE}</Note>

              {aadhaarDone ? (
                <>
                  <CustomText fontType='primary' style={styles.ok}>
                    Your Aadhaar is verified and on file.
                  </CustomText>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => goStep(3)}>
                    <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                      Continue
                    </CustomText>
                  </TouchableOpacity>
                </>
              ) : !otpSent ? (
                <>
                  <Field label='Aadhaar number' value={aadhaar}
                    onChange={(t) => setAadhaar(t.replace(/[^\d\s]/g, ''))}
                    placeholder='0000 0000 0000' keyboardType='number-pad' maxLength={14} required />

                  <CustomText fontType='primary' style={styles.fieldLabel}>Aadhaar card photo</CustomText>
                  <View style={styles.uploadRow}>
                    <ImageBox label='Aadhaar' uri={aadhaarImage?.uri} onPick={pick(setAadhaarImage)} />
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={sendOtp}>
                    <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                      {busy ? 'Sending…' : 'Send OTP'}
                    </CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.skipBtn} disabled={busy} onPress={() => goStep(3)}>
                    <CustomText fontType='primary' weight='SemiBold' style={styles.skipText}>
                      Skip for now
                    </CustomText>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <CustomText fontType='primary' style={styles.hint}>
                    Enter the OTP sent to the mobile number registered against your Aadhaar.
                  </CustomText>
                  <Field label='OTP' value={otp} onChange={(t) => setOtp(t.replace(/\D/g, ''))}
                    keyboardType='number-pad' maxLength={6} required />

                  <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={verifyOtp}>
                    <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                      {busy ? 'Verifying…' : 'Verify & continue'}
                    </CustomText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.skipBtn} disabled={busy} onPress={() => setOtpSent(false)}>
                    <CustomText fontType='primary' weight='SemiBold' style={styles.skipText}>
                      Change number
                    </CustomText>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          {/* ── Step 4 ── */}
          {step === 3 && (
            <>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>Review and save</CustomText>

              <View style={styles.reviewCard}>
                <ReviewRow label='Name' value={[form.firstName, form.lastName].filter(Boolean).join(' ') || '—'} />
                <ReviewRow label='Date of birth' value={form.dateOfBirth || '—'} />
                <ReviewRow label='Email' value={form.email || '—'} />
                <ReviewRow label='Address'
                  value={[form.address, form.city, form.state, form.pincode].filter(Boolean).join(', ') || '—'} />
                <ReviewRow label='Driving licence' value={licenceDone ? 'Uploaded' : 'Skipped'}
                  tone={licenceDone ? 'ok' : 'warn'} />
                <ReviewRow label='Aadhaar' value={aadhaarDone ? 'Verified' : 'Skipped'}
                  tone={aadhaarDone ? 'ok' : 'warn'} />
              </View>

              {bothDone ? (
                <View style={[styles.banner, styles.bannerOk]}>
                  <CustomText fontType='primary' weight='Bold' style={styles.bannerTitle}>
                    Your profile will be sent for verification.
                  </CustomText>
                  <CustomText fontType='primary' style={styles.bannerBody}>
                    Once our team has approved it you&apos;ll be able to book a ride. In the
                    meantime, enjoy browsing our cars.
                  </CustomText>
                </View>
              ) : (
                <View style={[styles.banner, styles.bannerWarn]}>
                  <CustomText fontType='primary' weight='Bold' style={styles.bannerTitle}>
                    Your profile will be saved as incomplete.
                  </CustomText>
                  <CustomText fontType='primary' style={styles.bannerBody}>
                    You skipped {!licenceDone && !aadhaarDone
                      ? 'your driving licence and Aadhaar'
                      : !licenceDone ? 'your driving licence' : 'your Aadhaar'}.
                    You can browse cars now, but you&apos;ll need to add {!licenceDone && !aadhaarDone
                      ? 'both and have them' : 'it and have it'} verified before booking a ride.
                  </CustomText>
                  <TouchableOpacity onPress={() => goStep(licenceDone ? 2 : 1)}>
                    <CustomText fontType='primary' weight='SemiBold' style={styles.bannerLink}>
                      Add it now
                    </CustomText>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={finish}>
                <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                  {busy ? 'Saving…' : 'Save and continue'}
                </CustomText>
              </TouchableOpacity>
            </>
          )}

          {step > 0 && (
            <TouchableOpacity style={styles.skipBtn} disabled={busy} onPress={() => goStep(step - 1)}>
              <CustomText fontType='primary' style={styles.backText}>‹ Back</CustomText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 48 },

  rail: { flexDirection: 'row', marginBottom: 18 },
  railItem: { flex: 1, alignItems: 'center' },
  railDot: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1e22',
  },
  railDotCurrent: { backgroundColor: BRAND_COLOR },
  railDotDone: { backgroundColor: '#1f9d55' },
  railDotText: { fontSize: 12, color: '#6b6b73' },
  railDotTextOn: { color: '#000' },
  railLabel: { fontSize: 11, color: '#6b6b73', marginTop: 5 },
  railLabelOn: { color: '#fff' },

  h2: { fontSize: 17, color: '#fff', marginBottom: 8 },
  hint: { fontSize: 13, color: '#9a9aa2', marginBottom: 14, lineHeight: 19 },
  optional: { fontSize: 11, color: '#6b6b73', marginTop: 5 },
  error: { fontSize: 13, color: '#f87171', marginBottom: 12 },
  ok: { fontSize: 13, color: '#6ee6b0', marginBottom: 12 },

  note: {
    backgroundColor: '#241f0c',
    borderLeftWidth: 3, borderLeftColor: BRAND_COLOR,
    padding: 12, borderRadius: 6, marginBottom: 16,
  },
  noteText: { fontSize: 12, color: '#e0cf94', lineHeight: 18 },

  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  avatar: { width: 68, height: 68, borderRadius: 34 },
  avatarEmpty: { backgroundColor: '#1e1e22' },

  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: '#9a9aa2', marginBottom: 6 },
  req: { color: '#f87171' },
  input: {
    backgroundColor: '#141418',
    borderWidth: 1, borderColor: '#26262c', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    color: '#fff', fontSize: 14,
  },

  uploadRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  uploadBox: {
    flex: 1, height: 108, borderRadius: 8,
    borderWidth: 1, borderColor: '#26262c', borderStyle: 'dashed',
    backgroundColor: '#141418',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  uploadText: { fontSize: 11, color: '#757575', marginTop: 6 },
  preview: { width: '100%', height: '100%' },

  primaryBtn: {
    backgroundColor: BRAND_COLOR, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 18,
  },
  primaryBtnText: { color: '#000', fontSize: 15 },
  secondaryBtn: {
    borderWidth: 1, borderColor: '#26262c', borderRadius: 8,
    paddingVertical: 9, paddingHorizontal: 14, alignSelf: 'flex-start',
  },
  secondaryBtnText: { color: '#fff', fontSize: 13 },
  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipText: { color: BRAND_COLOR, fontSize: 14 },
  backText: { color: '#9a9aa2', fontSize: 14 },

  reviewCard: {
    backgroundColor: '#141418', borderRadius: 10,
    paddingHorizontal: 14, marginBottom: 16,
  },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 16,
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#1e1e22',
  },
  reviewLabel: { fontSize: 13, color: '#9a9aa2' },
  reviewValue: { fontSize: 13, color: '#fff', flexShrink: 1, textAlign: 'right' },
  reviewOk: { color: '#6ee6b0' },
  reviewWarn: { color: '#fb923c' },

  banner: { borderRadius: 10, padding: 14 },
  bannerOk: { backgroundColor: '#0f2a1c' },
  bannerWarn: { backgroundColor: '#2a1d0c' },
  bannerTitle: { fontSize: 14, color: '#fff', marginBottom: 5 },
  bannerBody: { fontSize: 12.5, color: '#c9c9d1', lineHeight: 19 },
  bannerLink: { fontSize: 13, color: BRAND_COLOR, marginTop: 10 },
});

export default OnboardingWizardScreen;
