import React, { useCallback, useRef, useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal, FlatList,
} from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import { notify, photoUrl } from '../../utils/utils';
import { ALL_STATES } from '../../utils/indianStates';
import {
  validateDateOfBirth, maxDateOfBirth, minDateOfBirth, toLocalIsoDate,
} from '../../utils/age';

// Onboarding wizard — where a new account lands straight after OTP.
//
//   1. Your details      MANDATORY
//   2. Aadhaar           MANDATORY — number + both faces, read by OCR
//   3. Driving licence   MANDATORY — number + both faces, read by OCR
//   4. Live selfie       optional, can be added later from the profile
//
// Steps 1–3 cannot be skipped. When OCR cannot read a document the user is
// asked to consent to manual verification rather than being dead-ended: an OCR
// outage is our problem, not theirs, and the admin reviews the scan either way.
//
// Every camera capture here uses launchCamera, never launchImageLibrary. That is
// deliberate for the selfie (a gallery pick would defeat the liveness check) and
// consistent for documents (a photo of the actual card, not a screenshot).

const STEPS = ['Details', 'Aadhaar', 'Licence', 'Selfie'];

const LICENCE_RE = /^[A-Z]{2}[0-9]{2}[0-9A-Z]{10,12}$/;

// ── Module scope, deliberately ─────────────────────────────────────────────
// A component declared inside another component's render is a brand-new type on
// every render, so React unmounts and remounts it — in a form that means the
// TextInput loses focus after a single keystroke. This has bitten these screens
// repeatedly. Do not move these inside.

const Field = ({
  label, value, onChange, required, placeholder, keyboardType, maxLength,
  autoCapitalize, error,
}) => (
  <View style={styles.field}>
    <CustomText fontType='primary' style={styles.fieldLabel}>
      {label}{required ? <CustomText style={styles.req}> *</CustomText> : null}
    </CustomText>
    <TextInput
      style={[styles.input, error && styles.inputError]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor='#6b6b73'
      keyboardType={keyboardType}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
    />
    {error ? <CustomText fontType='primary' style={styles.fieldError}>{error}</CustomText> : null}
  </View>
);

// Read-only field that opens a picker. Used for date and state, so both look
// like the text fields around them instead of like buttons.
const PickerField = ({ label, value, placeholder, onPress, required, error }) => (
  <View style={styles.field}>
    <CustomText fontType='primary' style={styles.fieldLabel}>
      {label}{required ? <CustomText style={styles.req}> *</CustomText> : null}
    </CustomText>
    <TouchableOpacity style={[styles.input, styles.pickerInput, error && styles.inputError]} onPress={onPress}>
      <CustomText fontType='primary' style={value ? styles.pickerValue : styles.pickerPlaceholder}>
        {value || placeholder}
      </CustomText>
      <Icon name='chevron-down' size={16} color='#6b6b73' />
    </TouchableOpacity>
    {error ? <CustomText fontType='primary' style={styles.fieldError}>{error}</CustomText> : null}
  </View>
);

const StateModal = ({ visible, onClose, onSelect, selected }) => (
  <Modal visible={visible} animationType='slide' transparent onRequestClose={onClose}>
    <View style={styles.modalBackdrop}>
      <View style={styles.modalSheet}>
        <View style={styles.modalHead}>
          <CustomText fontType='primary' weight='Bold' style={styles.modalTitle}>Select state</CustomText>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name='close' size={22} color='#9a9aa2' />
          </TouchableOpacity>
        </View>
        <FlatList
          data={ALL_STATES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.stateRow} onPress={() => { onSelect(item); onClose(); }}>
              <CustomText fontType='primary' style={styles.stateText}>{item}</CustomText>
              {selected === item ? <Icon name='checkmark' size={18} color={BRAND_COLOR} /> : null}
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  </Modal>
);

// Document face capture. Camera only — see the note at the top of the file.
const DocCapture = ({ label, uri, onPress, required }) => (
  <TouchableOpacity style={styles.docBox} onPress={onPress}>
    {uri ? (
      <Image source={{ uri }} style={styles.docPreview} resizeMode='cover' />
    ) : (
      <>
        <Icon name='camera-outline' size={22} color='#757575' />
        <CustomText fontType='primary' style={styles.docText}>
          {label}{required ? ' *' : ''}
        </CustomText>
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

// Shown when OCR could not read a document. Consent is an action the user takes,
// never a box we pre-tick — it is a record that they agreed.
const ConsentPrompt = ({ message, busy, onAgree, onRetry }) => (
  <View style={[styles.banner, styles.bannerWarn]}>
    <CustomText fontType='primary' weight='Bold' style={styles.bannerTitle}>
      We couldn&apos;t verify that automatically
    </CustomText>
    <CustomText fontType='primary' style={styles.bannerBody}>{message}</CustomText>
    <CustomText fontType='primary' style={styles.bannerBody}>
      You can still continue — our team will check your document by hand. That usually
      takes a little longer than an automatic check.
    </CustomText>
    <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={onAgree}>
      <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
        {busy ? 'Submitting…' : 'I agree, verify it manually'}
      </CustomText>
    </TouchableOpacity>
    <TouchableOpacity style={styles.linkBtn} disabled={busy} onPress={onRetry}>
      <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>
        Retake the photo
      </CustomText>
    </TouchableOpacity>
  </View>
);

// ───────────────────────────────────────────────────────────────────────────

const OnboardingWizardScreen = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState(null);
  const scroller = useRef(null);

  // Step 1 — no profile photo here any more; the step-4 selfie becomes the avatar.
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', dateOfBirth: '',
    address: '', city: '', state: '', pincode: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStates, setShowStates] = useState(false);

  // Step 2 / 3
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceFront, setLicenceFront] = useState(null);
  const [licenceBack, setLicenceBack] = useState(null);

  // Step 4
  const [selfie, setSelfie] = useState(null);

  const [consent, setConsent] = useState(null);

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
      const licence = res.data?.documents?.licence;
      if (licence?.licenceNumber) setLicenceNumber(licence.licenceNumber);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load your profile');
    } finally {
      setLoading(false);
    }
  };

  // useFocusEffect, not useEffect: returning here must re-read the status, or a
  // document just submitted still shows as missing.
  useFocusEffect(useCallback(() => { load(); }, []));

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
  };

  const goStep = (n) => {
    setError('');
    setConsent(null);
    setStep(n);
    scroller.current?.scrollTo({ y: 0, animated: true });
  };

  // Camera capture, base64 so it can be posted as a data URI. `includeBase64`
  // plus a modest maxWidth keeps the payload inside the server's 12mb JSON limit.
  const capture = (setter, { front = false } = {}) => async () => {
    const res = await launchCamera({
      mediaType: 'photo',
      cameraType: front ? 'front' : 'back',
      includeBase64: true,
      quality: 0.8,
      maxWidth: 1600,
      maxHeight: 1600,
      saveToPhotos: false,
    });

    if (res.didCancel) return;
    if (res.errorCode) {
      // A denied camera permission is the common case and needs a route out,
      // not a dead end — but never a gallery fallback.
      setError(res.errorCode === 'permission'
        ? 'Camera access is blocked. Enable it for Cocarr in your device settings, then try again.'
        : res.errorMessage || 'Could not open the camera.');
      return;
    }
    const asset = res.assets?.[0];
    if (!asset?.base64) { setError('Could not read that photo. Please try again.'); return; }

    setError('');
    setter(`data:${asset.type || 'image/jpeg'};base64,${asset.base64}`);
  };

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setError('');
    const required = {
      firstName: 'First name', lastName: 'Last name', email: 'Email',
      address: 'Address', city: 'City', state: 'State', pincode: 'PIN code',
    };
    const errs = {};
    for (const [key, label] of Object.entries(required)) {
      if (!String(form[key] || '').trim()) errs[key] = `${label} is required`;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }
    if (form.pincode && !/^\d{6}$/.test(form.pincode)) {
      errs.pincode = 'PIN code must be 6 digits';
    }
    const dobError = validateDateOfBirth(form.dateOfBirth);
    if (dobError) errs.dateOfBirth = dobError;

    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setError('Please correct the highlighted fields.');
      return;
    }

    setBusy(true);
    try {
      await axios.put(`${API_URL}/user/onboarding`, form);
      await load();
      goStep(1);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save your details.');
    } finally {
      setBusy(false);
    }
  };

  // ── Steps 2 & 3 ───────────────────────────────────────────────────────────
  const submitDocument = async (path, payload, nextStep, manualConsent = false) => {
    setError('');
    setBusy(true);
    try {
      const res = await axios.post(`${API_URL}${path}`, { ...payload, manualConsent });
      setStatus(res.data);
      setConsent(null);
      goStep(nextStep);
    } catch (e) {
      const data = e.response?.data;
      if (data?.needsConsent) {
        setConsent({ step, message: data.error, payload, path, nextStep });
      } else {
        setError(data?.error || 'Could not save that document.');
      }
    } finally {
      setBusy(false);
    }
  };

  const submitAadhaar = () => {
    if (!/^\d{12}$/.test(aadhaarNumber.replace(/\s/g, ''))) {
      setError('Enter the 12-digit Aadhaar number.'); return;
    }
    if (!aadhaarFront || !aadhaarBack) {
      setError('Photograph both the front and back of your Aadhaar card.'); return;
    }
    submitDocument('/user/verification/aadhaar', {
      aadhaarNumber: aadhaarNumber.replace(/\s/g, ''),
      frontImage: aadhaarFront,
      backImage: aadhaarBack,
    }, 2);
  };

  const submitLicence = () => {
    const number = licenceNumber.trim().toUpperCase().replace(/[\s-]/g, '');
    if (!LICENCE_RE.test(number)) {
      setError('Enter a valid licence number, for example KA0520190001234.'); return;
    }
    if (!licenceFront || !licenceBack) {
      setError('Photograph both the front and back of your licence.'); return;
    }
    submitDocument('/user/verification/licence', {
      licenceNumber: number,
      frontImage: licenceFront,
      backImage: licenceBack,
    }, 3);
  };

  // ── Step 4 ────────────────────────────────────────────────────────────────
  const saveSelfie = async () => {
    if (!selfie) { setError('Take a selfie first.'); return; }
    setError('');
    setBusy(true);
    try {
      await axios.post(`${API_URL}/user/verification/selfie`, { image: selfie });
      await finish();
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save your photo.');
      setBusy(false);
    }
  };

  const finish = async () => {
    try {
      await axios.post(`${API_URL}/user/verification/submit`);
    } catch {
      // Best-effort: the documents are already stored and the server promotes
      // the profile to `pending` on its own once both are present. Blocking here
      // would strand the user at the end of a flow they have completed.
    }
    notify('Your profile is under verification');
    navigation.reset({ index: 0, routes: [{ name: 'HomeTab' }] });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}><ActivityIndicator color={BRAND_COLOR} /></View>
      </View>
    );
  }

  const docs = status?.documents || {};
  const aadhaarDone = !!docs.aadhaar?.submitted;
  const licenceDone = !!docs.licence?.submitted;

  return (
    <View style={styles.container}>
      {/*
        Own header rather than CenterHeader.
        CenterHeader's back button calls navigation.goBack(), which on step 1 of a
        mandatory flow would drop the user out of onboarding entirely — and the
        screen also carried a second "‹ Back" at the bottom of the scroll view, so
        there were two back affordances doing different things. This header owns
        the ONLY back control, it moves between steps, and it is simply absent on
        step 1 where there is nowhere to go.
      */}
      <View style={styles.header}>
        {step > 0 ? (
          <TouchableOpacity
            style={styles.headerBack}
            onPress={() => goStep(step - 1)}
            disabled={busy}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name='chevron-back' size={24} color='#e3e3e3' />
          </TouchableOpacity>
        ) : (
          // Keeps the title optically centred when there is no chevron.
          <View style={styles.headerBackSpacer} />
        )}
        <View style={styles.headerTitleWrap}>
          <CustomText fontType='primary' weight='Bold' numberOfLines={1} style={styles.headerTitle}>
            Complete your profile
          </CustomText>
          <CustomText fontType='primary' style={styles.headerSub}>
            Step {step + 1} of {STEPS.length}
          </CustomText>
        </View>
        <View style={styles.headerBackSpacer} />
      </View>

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
                Enter your details exactly as they appear on your Aadhaar and driving
                licence — we compare them.
              </CustomText>

              <Field label='First name' value={form.firstName} onChange={set('firstName')}
                error={fieldErrors.firstName} required />
              <Field label='Last name' value={form.lastName} onChange={set('lastName')}
                error={fieldErrors.lastName} required />
              <Field label='Email' value={form.email} onChange={set('email')}
                keyboardType='email-address' autoCapitalize='none'
                error={fieldErrors.email} required />

              <PickerField
                label='Date of birth'
                value={form.dateOfBirth}
                placeholder='Select your date of birth'
                onPress={() => setShowDatePicker(true)}
                error={fieldErrors.dateOfBirth}
                required
              />
              {showDatePicker && (
                <DateTimePicker
                  mode='date'
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  value={form.dateOfBirth ? new Date(form.dateOfBirth) : maxDateOfBirth()}
                  // The picker itself will not offer an under-18 date; the rule is
                  // enforced again on submit and on the server.
                  maximumDate={maxDateOfBirth()}
                  minimumDate={minDateOfBirth()}
                  onChange={(event, date) => {
                    // Android fires with type 'dismissed' on cancel; iOS spinner
                    // fires continuously, so the sheet is closed explicitly there.
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (event.type === 'dismissed' || !date) return;
                    set('dateOfBirth')(toLocalIsoDate(date));
                  }}
                />
              )}
              {showDatePicker && Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.linkBtn} onPress={() => setShowDatePicker(false)}>
                  <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>Done</CustomText>
                </TouchableOpacity>
              )}

              <Field label='Address' value={form.address} onChange={set('address')}
                error={fieldErrors.address} required />
              <Field label='City' value={form.city} onChange={set('city')}
                error={fieldErrors.city} required />

              <PickerField label='State' value={form.state} placeholder='Select your state'
                onPress={() => setShowStates(true)} error={fieldErrors.state} required />

              <Field label='PIN code' value={form.pincode}
                onChange={(t) => set('pincode')(t.replace(/\D/g, ''))}
                keyboardType='number-pad' maxLength={6}
                error={fieldErrors.pincode} required />

              <CustomText fontType='primary' style={styles.footnote}>
                You must be at least 18 to drive on Cocarr.
              </CustomText>

              <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={saveProfile}>
                <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                  {busy ? 'Saving…' : 'Continue'}
                </CustomText>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 2: Aadhaar ── */}
          {step === 1 && (
            <>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>
                Aadhaar verification
              </CustomText>
              {aadhaarDone ? (
                <CustomText fontType='primary' style={styles.ok}>
                  Your Aadhaar is on file. Submitting again replaces it.
                </CustomText>
              ) : null}

              <Field label='Aadhaar number' value={aadhaarNumber}
                onChange={(t) => setAadhaarNumber(t.replace(/[^\d\s]/g, ''))}
                placeholder='0000 0000 0000' keyboardType='number-pad' maxLength={14} required />

              <CustomText fontType='primary' style={styles.hint}>
                Photograph both sides. Keep the whole card in frame and the text readable.
              </CustomText>
              <View style={styles.docRow}>
                <DocCapture label='Front' uri={aadhaarFront || photoUrl(docs.aadhaar?.imageKey)}
                  onPress={capture(setAadhaarFront)} required />
                <DocCapture label='Back' uri={aadhaarBack || photoUrl(docs.aadhaar?.backImageKey)}
                  onPress={capture(setAadhaarBack)} required />
              </View>

              {consent && consent.step === 1 ? (
                <ConsentPrompt
                  message={consent.message}
                  busy={busy}
                  onAgree={() => submitDocument(consent.path, consent.payload, consent.nextStep, true)}
                  onRetry={() => setConsent(null)}
                />
              ) : (
                <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={submitAadhaar}>
                  <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                    {busy ? 'Checking…' : 'Verify and continue'}
                  </CustomText>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* ── Step 3: Driving licence ── */}
          {step === 2 && (
            <>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>
                Driving licence verification
              </CustomText>
              {licenceDone ? (
                <CustomText fontType='primary' style={styles.ok}>
                  Your licence is on file. Submitting again replaces it.
                </CustomText>
              ) : null}

              <Field label='Licence number' value={licenceNumber}
                onChange={(t) => setLicenceNumber(t.toUpperCase())}
                placeholder='KA0520190001234' autoCapitalize='characters' required />

              <CustomText fontType='primary' style={styles.hint}>
                Photograph both sides of your licence.
              </CustomText>
              <View style={styles.docRow}>
                <DocCapture label='Front' uri={licenceFront || photoUrl(docs.licence?.frontImageKey)}
                  onPress={capture(setLicenceFront)} required />
                <DocCapture label='Back' uri={licenceBack || photoUrl(docs.licence?.backImageKey)}
                  onPress={capture(setLicenceBack)} required />
              </View>

              {consent && consent.step === 2 ? (
                <ConsentPrompt
                  message={consent.message}
                  busy={busy}
                  onAgree={() => submitDocument(consent.path, consent.payload, consent.nextStep, true)}
                  onRetry={() => setConsent(null)}
                />
              ) : (
                <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={submitLicence}>
                  <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                    {busy ? 'Checking…' : 'Verify and continue'}
                  </CustomText>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* ── Step 4: Live selfie ── */}
          {step === 3 && (
            <>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>Take a selfie</CustomText>
              <CustomText fontType='primary' style={styles.hint}>
                This becomes your profile photo and helps hosts recognise you. It has to be
                taken now with your front camera — you can&apos;t choose an existing picture.
              </CustomText>

              <View style={styles.selfieWrap}>
                <TouchableOpacity style={styles.selfieFrame} onPress={capture(setSelfie, { front: true })}>
                  {selfie ? (
                    <Image source={{ uri: selfie }} style={styles.selfieImage} resizeMode='cover' />
                  ) : (
                    <>
                      <Icon name='camera-outline' size={30} color='#757575' />
                      <CustomText fontType='primary' style={styles.docText}>Tap to take a selfie</CustomText>
                    </>
                  )}
                </TouchableOpacity>
                {selfie ? (
                  <TouchableOpacity style={styles.linkBtn} onPress={capture(setSelfie, { front: true })}>
                    <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>Retake</CustomText>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={[styles.banner, styles.bannerOk]}>
                <CustomText fontType='primary' weight='Bold' style={styles.bannerTitle}>Almost done</CustomText>
                <CustomText fontType='primary' style={styles.bannerBody}>
                  Your documents are with our team. Once they&apos;re approved you can book a
                  ride — in the meantime, enjoy browsing our cars.
                </CustomText>
              </View>

              <TouchableOpacity style={styles.primaryBtn} disabled={busy || !selfie} onPress={saveSelfie}>
                <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                  {busy ? 'Saving…' : 'Save and finish'}
                </CustomText>
              </TouchableOpacity>

              {/* The only optional step, so the only one that can be deferred. */}
              <TouchableOpacity style={styles.linkBtn} disabled={busy} onPress={finish}>
                <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>
                  Skip the photo for now
                </CustomText>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <StateModal
        visible={showStates}
        onClose={() => setShowStates(false)}
        onSelect={(s) => set('state')(s)}
        selected={form.state}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 48 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    paddingBottom: 12,
    backgroundColor: '#000',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e1e22',
  },
  headerBack: { width: 36, alignItems: 'flex-start', justifyContent: 'center' },
  headerBackSpacer: { width: 36 },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#f0f0f2', fontSize: 16, letterSpacing: -0.2 },
  headerSub: { color: '#8a8a8a', fontSize: 11, marginTop: 2 },

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
  footnote: { fontSize: 11, color: '#6b6b73', marginTop: 2 },
  error: { fontSize: 13, color: '#f87171', marginBottom: 12 },
  ok: { fontSize: 13, color: '#6ee6b0', marginBottom: 12 },

  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: '#9a9aa2', marginBottom: 6 },
  fieldError: { fontSize: 11, color: '#f87171', marginTop: 4 },
  req: { color: '#f87171' },
  input: {
    backgroundColor: '#141418',
    borderWidth: 1, borderColor: '#26262c', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    color: '#fff', fontSize: 14,
  },
  inputError: { borderColor: '#f87171' },
  pickerInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pickerValue: { color: '#fff', fontSize: 14 },
  pickerPlaceholder: { color: '#6b6b73', fontSize: 14 },

  docRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  docBox: {
    flex: 1, height: 112, borderRadius: 8,
    borderWidth: 1, borderColor: '#26262c', borderStyle: 'dashed',
    backgroundColor: '#141418',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  docPreview: { width: '100%', height: '100%' },
  docText: { fontSize: 11, color: '#757575', marginTop: 6 },

  selfieWrap: { alignItems: 'center', marginVertical: 8 },
  selfieFrame: {
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 2, borderColor: BRAND_COLOR,
    backgroundColor: '#141418',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  selfieImage: { width: '100%', height: '100%' },

  primaryBtn: {
    backgroundColor: BRAND_COLOR, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', marginTop: 18,
  },
  primaryBtnText: { color: '#000', fontSize: 15 },
  linkBtn: { alignItems: 'center', paddingVertical: 14 },
  linkText: { color: BRAND_COLOR, fontSize: 14 },

  banner: { borderRadius: 10, padding: 14, marginTop: 16 },
  bannerOk: { backgroundColor: '#0f2a1c' },
  bannerWarn: { backgroundColor: '#2a1d0c' },
  bannerTitle: { fontSize: 14, color: '#fff', marginBottom: 5 },
  bannerBody: { fontSize: 12.5, color: '#c9c9d1', lineHeight: 19, marginBottom: 6 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#141418', borderTopLeftRadius: 16, borderTopRightRadius: 16,
    maxHeight: '75%', paddingBottom: 24,
  },
  modalHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#26262c',
  },
  modalTitle: { color: '#fff', fontSize: 15 },
  stateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1e1e22',
  },
  stateText: { color: '#e3e3e3', fontSize: 14 },
});

export default OnboardingWizardScreen;
