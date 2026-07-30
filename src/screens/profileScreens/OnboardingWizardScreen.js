import React, { useCallback, useRef, useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Modal, FlatList, Alert,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { updateProfile } from '../../store/authSlice';
import CustomText from '../../components/CustomText';
import { API_URL, BRAND_COLOR, BYPASS_AADHAAR_VERIFY } from '../../utils/constants';
import { notify, photoUrl, requestCameraPermission } from '../../utils/utils';
import { ALL_STATES } from '../../utils/indianStates';
import {
  validateDateOfBirth, maxDateOfBirth, minDateOfBirth, toLocalIsoDate,
} from '../../utils/age';

// Onboarding wizard — and the one place profile details are viewed or edited.
// Mirrors the web app's OnboardingWizardPage; keep the two in step.
//
//   1. Your details      MANDATORY
//   2. Aadhaar card      MANDATORY — both faces, read by OCR
//   3. Driving licence   MANDATORY — both faces, read by OCR
//   4. Live selfie       MANDATORY — no skip
//   5. Aadhaar KYC       MANDATORY — number, then OTP, then submit
//
// WHY THE AADHAAR NUMBER IS NOT IN STEP 2. All three uploads come first and the
// identity check last, because:
//   - the uploads are what OCR needs. When it reads the card the number is never
//     typed at all, so asking for it up front is a field most users should never
//     have to see.
//   - the OTP is the one thing that can fail for reasons the user cannot fix in
//     the moment (a phone not to hand, a provider outage). Reaching it last means
//     everything else is already stored when it does.
//
// FAILED OCR IS NEVER A DEAD END. Steps 2 and 3 both offer the same two ways out
// of an unreadable photo: retry it, or ask our team to check it by hand. An OCR
// outage is our problem, not the user's.
//
// THREE MODES, taken from the `mode` route param:
//   onboarding — a new account, straight after OTP. Cannot be abandoned.
//   edit       — cancellable, and Cancel only appears once something has
//                actually changed, because otherwise there is nothing to cancel.
//   review     — read-only. Every section selectable from the rail, with an Edit
//                button that hands off to edit mode. This is what the profile's
//                "Identity & documents" row opens.
//
// It supersedes EditProfileScreen, VerificationScreen, AadhaarVerificationScreen,
// LicenceVerificationScreen and the whole verificationScreens/ folder — eight
// screens collecting the same fields with their own copies of the validation.
//
// DOCUMENTS may be taken with the camera or chosen from the gallery. The SELFIE
// is camera-only — a gallery pick would defeat the whole point of a live
// capture. Documents carry no such requirement: a licence photographed last week
// reads exactly as well as one photographed now, and forcing the camera turns a
// blocked permission into a blocked signup.

const STEPS = ['Details', 'Aadhaar', 'Licence', 'Selfie', 'KYC'];

const STEP_DETAILS = 0;
const STEP_AADHAAR = 1;
const STEP_LICENCE = 2;
const STEP_SELFIE = 3;
const STEP_KYC = 4;

const LICENCE_RE = /^[A-Z]{2}[0-9]{2}[0-9A-Z]{10,12}$/;

// ── Module scope, deliberately ─────────────────────────────────────────────
// A component declared inside another component's render is a brand-new type on
// every render, so React unmounts and remounts it — in a form that means the
// TextInput loses focus after a single keystroke. This has bitten these screens
// repeatedly. Do not move these inside.

const Field = ({
  label, value, onChange, required, placeholder, keyboardType, maxLength,
  autoCapitalize, error, editable = true,
}) => (
  <View style={styles.field}>
    <CustomText fontType='primary' style={styles.fieldLabel}>
      {label}{required ? <CustomText style={styles.req}> *</CustomText> : null}
    </CustomText>
    <TextInput
      // `editable` is forwarded explicitly rather than via a spread: the Aadhaar
      // number is locked once its OTP is in flight, and a prop this component
      // does not declare would be silently dropped, leaving it editable.
      style={[styles.input, error && styles.inputError, !editable && styles.inputLocked]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor='#6b6b73'
      keyboardType={keyboardType}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
      editable={editable}
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

// Every already-reached step is tappable so the user can go back to it; steps
// ahead stay inert because their prerequisites may not be met. In review mode
// nothing is being submitted, so everything is reachable.
const StepRail = ({ step, furthest, onGo, allReachable = false }) => (
  <View style={styles.rail}>
    {STEPS.map((label, i) => {
      const reachable = (allReachable || i <= furthest) && i !== step;
      const done = i < step || i < furthest;
      return (
        <TouchableOpacity
          key={label}
          style={styles.railItem}
          disabled={!reachable}
          onPress={() => reachable && onGo(i)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.railDot,
            i === step && styles.railDotCurrent,
            done && i !== step && styles.railDotDone,
          ]}>
            <CustomText fontType='primary' weight='Bold' style={[
              styles.railDotText,
              (i === step || done) && styles.railDotTextOn,
            ]}>
              {done && i !== step ? '✓' : String(i + 1)}
            </CustomText>
          </View>
          <CustomText fontType='primary' style={[styles.railLabel, i === step && styles.railLabelOn]}>
            {label}
          </CustomText>
        </TouchableOpacity>
      );
    })}
  </View>
);

// Read-only key/value list, used by every review section.
const ReviewList = ({ rows }) => {
  const shown = rows.filter(([, v]) => v !== undefined);
  if (!shown.length) return null;
  return (
    <View style={styles.reviewList}>
      {shown.map(([label, value]) => (
        <View key={label} style={styles.reviewRow}>
          <CustomText fontType='primary' style={styles.reviewLabel}>{label}</CustomText>
          <CustomText fontType='primary' style={[styles.reviewValue, !value && styles.reviewEmpty]}>
            {value || 'Not provided'}
          </CustomText>
        </View>
      ))}
    </View>
  );
};

// The document's OWN status, not the profile's — a verified document on a
// pending profile is a normal, meaningful state.
const DocStatus = ({ doc }) => {
  const status = doc?.status || (doc?.submitted ? 'pending' : 'missing');
  const map = {
    verified: ['#0f2a1c', '#6ee6b0', 'Verified'],
    pending: ['#241f0c', BRAND_COLOR, 'Awaiting review'],
    rejected: ['#2b1212', '#f87171', 'Rejected'],
    missing: ['#1e1e22', '#9a9aa2', 'Not submitted'],
  };
  const [bg, fg, text] = map[status] || map.missing;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <CustomText fontType='primary' weight='Bold' style={[styles.pillText, { color: fg }]}>
        {text}
      </CustomText>
    </View>
  );
};

// A stored document face. photoUrl is required — the bucket is private.
const ReviewImage = ({ src, label }) => (
  <View style={styles.reviewImgWrap}>
    {src ? (
      <Image source={{ uri: photoUrl(src) }} style={styles.reviewImg} resizeMode='cover' />
    ) : (
      <View style={[styles.reviewImg, styles.reviewImgEmpty]}>
        <CustomText fontType='primary' style={styles.docText}>No {label.toLowerCase()}</CustomText>
      </View>
    )}
    <CustomText fontType='primary' style={styles.reviewImgCaption}>{label}</CustomText>
  </View>
);

// The one thing steps 2 and 3 both do when OCR cannot read a photo: offer a
// retry, or a human. Never a dead end, and never a silent pass — asking our team
// to check the document is something the user actively chooses, and it is
// recorded as their choice.
//
// `children` is where the licence step slots in its number field: a licence
// nobody can read still needs a number for support to look it up.
// `children` carries the manual number field, revealed in place once the user
// picks that option. Nothing here clears the photographs: OCR fails for reasons
// that have nothing to do with the image — a provider timeout, an IP off the
// allowlist — and sending someone back to re-photograph a document that was fine
// is the wrong response to our outage.
const OcrFallback = ({
  message, busy, onRetry, onManual, manualOpen, manualLabel, children,
}) => (
  <View style={[styles.banner, styles.bannerWarn]}>
    <CustomText fontType='primary' weight='Bold' style={styles.bannerTitle}>
      We couldn&apos;t verify that automatically
    </CustomText>
    <CustomText fontType='primary' style={styles.bannerBody}>{message}</CustomText>
    <CustomText fontType='primary' style={styles.bannerBody}>
      {manualOpen
        ? 'Enter the number and our team will check your document by hand. That usually takes '
          + 'a little longer than an automatic check.'
        : 'Your photos are saved — we can read them again, or you can enter the number '
          + 'yourself and our team will check the document by hand.'}
    </CustomText>
    {children}
    {!manualOpen ? (
      <>
        <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={onRetry}>
          <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
            {busy ? 'Reading again…' : 'Retry verification'}
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} disabled={busy} onPress={onManual}>
          <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>
            {manualLabel || 'Enter the number manually'}
          </CustomText>
        </TouchableOpacity>
      </>
    ) : null}
  </View>
);

// ───────────────────────────────────────────────────────────────────────────

const OnboardingWizardScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const mode = route.params?.mode || 'onboarding';
  const isEdit = mode === 'edit';
  const isReview = mode === 'review';
  const [step, setStep] = useState(0);
  // Furthest step reached, so completed steps stay tappable after going back.
  const [furthest, setFurthest] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState(null);
  const scroller = useRef(null);

  // Step 1 — no profile photo here; the step-4 selfie becomes the avatar.
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', dateOfBirth: '',
    address: '', city: '', state: '', pincode: '',
  });
  // The values as loaded, so "has anything changed?" is a comparison rather than
  // a flag every input has to remember to set.
  const [initialForm, setInitialForm] = useState({
    firstName: '', lastName: '', email: '', dateOfBirth: '',
    address: '', city: '', state: '', pincode: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStates, setShowStates] = useState(false);

  // ── Step 2: the Aadhaar card itself ──
  const [aadhaarFront, setAadhaarFront] = useState(null);
  const [aadhaarBack, setAadhaarBack] = useState(null);
  // The card is stored and OCR has run. Says nothing about whether it could be
  // read — `aadhaarOcrFailed` is that.
  const [aadhaarScanned, setAadhaarScanned] = useState(false);
  const [documentVerified, setDocumentVerified] = useState(false);
  const [aadhaarOcrFailed, setAadhaarOcrFailed] = useState(false);
  const [aadhaarOcrMessage, setAadhaarOcrMessage] = useState('');
  // The user chose a human check over another retry. Recorded server-side too;
  // this is the local copy that drives the wording of step 5.
  const [aadhaarManualVerify, setAadhaarManualVerify] = useState(false);

  // ── Step 3: the licence ──
  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceFront, setLicenceFront] = useState(null);
  const [licenceBack, setLicenceBack] = useState(null);
  // Set from the server's `needsConsent`: OCR could not read the licence.
  const [licenceScanned, setLicenceScanned] = useState(false);
  // Set when OCR could not read the licence. Carries the message and, once the
  // user picks manual entry, `manualOpen` — which reveals the number field in
  // place instead of sending them anywhere.
  const [licenceFallback, setLicenceFallback] = useState(null);
  // Same idea for Aadhaar, whose failure state is already three flags, so this
  // one only tracks whether the number field has been revealed.
  const [aadhaarManualOpen, setAadhaarManualOpen] = useState(false);

  // ── Step 4: the selfie ──
  const [selfie, setSelfie] = useState(null);
  const [selfieSaved, setSelfieSaved] = useState(false);
  // 'blocked' means the OS will not prompt again and only Settings can fix it;
  // 'denied' means asking again is still worth doing. There is NO skip built on
  // either — the distinction only decides which remedy we offer.
  const [cameraPermission, setCameraPermission] = useState(null);

  // ── Step 5: the KYC check ──
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [numberConfirmed, setNumberConfirmed] = useState(false);
  const [aadhaarDetails, setAadhaarDetails] = useState(null);
  const [aadhaarRef, setAadhaarRef] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const load = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/verification`);
      setStatus(res.data);
      // Publish to redux so the shell header's badge tracks the real status
      // without the header itself polling.
      if (res.data?.verificationStatus) {
        dispatch(updateProfile({ verificationStatus: res.data.verificationStatus }));
      }
      const p = res.data?.profile || {};
      const loaded = {
        firstName: p.firstName || '', lastName: p.lastName || '',
        email: p.email || '',
        dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '',
        address: p.address || '', city: p.city || '',
        state: p.state || '', pincode: p.pincode || '',
      };
      setForm(loaded);
      setInitialForm(loaded);
      const licence = res.data?.documents?.licence;
      if (licence?.licenceNumber) setLicenceNumber(licence.licenceNumber);
      // Reopening must resume where each step got to, not restart it.
      const aad = res.data?.documents?.aadhaar;
      if (aad?.scanned) setAadhaarScanned(true);
      if (aad?.documentVerified) setDocumentVerified(true);
      // Uploaded but unreadable, and no number settled on yet — the step is
      // still sitting on its fallback, so restore it rather than showing a
      // fresh upload prompt over photos that are already on file.
      if (aad?.scanned && !aad?.documentVerified && !aad?.numberConfirmed) setAadhaarOcrFailed(true);
      if (aad?.manualConsent) setAadhaarManualVerify(true);
      if (licence?.scanned) setLicenceScanned(true);
      if (licence?.scanned && !licence?.licenceNumber) {
        setLicenceFallback((f) => f || {
          message: 'We could not read your driving licence automatically.',
          manualOpen: false,
        });
      }
      // A number already settled on means step 5's first phase is done, whether
      // or not the OTP has been taken yet — otherwise reopening the screen asks
      // for a number the user cannot supply, because it is masked from here on.
      if (aad?.numberConfirmed) setNumberConfirmed(true);
      if (aad?.otpVerified) setOtpVerified(true);
      if (p.profilePhoto) setSelfieSaved(true);
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
    setLicenceFallback(null);
    setStep(n);
    setFurthest((f) => Math.max(f, n));
    scroller.current?.scrollTo({ y: 0, animated: true });
  };

  // Drives whether Cancel is offered: with nothing changed there is nothing to
  // discard, so the button would be noise.
  const isDirty = Object.keys(initialForm).some((k) => (form[k] || '') !== (initialForm[k] || ''))
    || !!aadhaarFront || !!aadhaarBack || !!licenceFront || !!licenceBack || !!selfie;

  const cancel = () => {
    if (!isDirty) { navigation.goBack(); return; }
    Alert.alert('Discard changes?', 'Your unsaved changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  // base64 so the image can be posted as a data URI. `includeBase64` plus a
  // modest maxWidth keeps the payload inside the server's 12mb JSON limit.
  const PICKER_OPTIONS = {
    mediaType: 'photo',
    includeBase64: true,
    quality: 0.8,
    maxWidth: 1600,
    maxHeight: 1600,
    saveToPhotos: false,
  };

  // Runs a picker and stores whatever comes back.
  //
  // The picker is called FIRST and asks for permission itself. An explicit
  // pre-check here was a bug: react-native-permissions reports UNAVAILABLE for
  // any permission whose native handler is not linked into the build, and the
  // iOS Camera handler is opt-in via the Podfile — so the pre-check refused to
  // open the camera on devices whose camera worked and whose permission was
  // already granted. `requestCameraPermission` is now only consulted AFTER a
  // refusal, to decide which remedy to offer.
  const runPicker = (setter, launcher, options) => async () => {
    const res = await launcher({ ...PICKER_OPTIONS, ...options });

    if (res.didCancel) return;
    if (res.errorCode) {
      const denied = res.errorCode === 'permission' || res.errorCode === 'camera_unavailable';
      if (denied) {
        // Ask again — that usually IS the fix, since a first refusal is often a
        // mis-tap. The verdict tells the banner whether to offer another prompt
        // or a trip to Settings.
        const verdict = await requestCameraPermission(false);
        setCameraPermission(verdict);
        if (verdict === 'granted') {
          // Granted on the second ask, so just go again rather than making the
          // user tap through an error they have already resolved.
          const retry = await launcher({ ...PICKER_OPTIONS, ...options });
          if (retry.didCancel) return;
          if (!retry.errorCode && retry.assets?.[0]?.base64) {
            const a = retry.assets[0];
            setError('');
            setter(`data:${a.type || 'image/jpeg'};base64,${a.base64}`);
            return;
          }
        }
        setError('We need permission to use your camera for this photo.');
        return;
      }
      setError(res.errorMessage || 'Could not open the camera.');
      return;
    }

    const asset = res.assets?.[0];
    if (!asset?.base64) { setError('Could not read that photo. Please try again.'); return; }

    setError('');
    setCameraPermission('granted');
    setter(`data:${asset.type || 'image/jpeg'};base64,${asset.base64}`);
  };

  // Documents may come from the camera OR the gallery. A licence photographed
  // last week is just as readable as one photographed now, and forcing the
  // camera turns a blocked permission into a blocked signup. Liveness is the
  // selfie's job, not the document's.
  const captureDocument = (setter) => () => {
    Alert.alert('Add photo', 'How would you like to add this document?', [
      { text: 'Take photo', onPress: runPicker(setter, launchCamera, { cameraType: 'back' }) },
      { text: 'Choose from library', onPress: runPicker(setter, launchImageLibrary, { selectionLimit: 1 }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // The selfie is camera-only, deliberately. A gallery pick would defeat the
  // whole point of a live capture — anyone could submit a photo of anyone.
  const captureSelfie = (options = {}) =>
    runPicker(setSelfie, launchCamera, { cameraType: 'front', ...options });

  // ── Step 1: your details ──────────────────────────────────────────────────
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
      const res = await axios.put(`${API_URL}/user/onboarding`, form);
      setInitialForm(form);
      // Keep the header/profile name in step with what was just saved.
      dispatch(updateProfile({
        userName: [form.firstName, form.lastName].filter(Boolean).join(' ') || undefined,
        email: form.email || undefined,
      }));
      await load();
      // The server withdraws the approval when identity details change, because
      // the documents were verified against the old ones. Say so rather than
      // letting the badge quietly change.
      if (res.data?.verificationInvalidated) {
        notify('Saved. Your documents need checking again, so your profile is back for review.');
      }
      goStep(STEP_AADHAAR);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save your details.');
    } finally {
      setBusy(false);
    }
  };

  // ── Step 2: upload the Aadhaar card ───────────────────────────────────────
  // Both faces go up and OCR reads the front. Whatever it reads is kept for
  // step 5 — the number is never asked for here, because most of the time it
  // does not need to be asked for at all.
  const scanAadhaar = async () => {
    setError('');
    if (!aadhaarFront || !aadhaarBack) {
      setError('Photograph both the front and back of your Aadhaar card.'); return;
    }

    setBusy(true);
    try {
      const res = await axios.post(`${API_URL}/user/verification/aadhaar/scan`, {
        frontImage: aadhaarFront,
        backImage: aadhaarBack,
      });
      setAadhaarScanned(true);

      if (res.data?.needsManualEntry) {
        // Not a failure the user caused, and not the end of the step — the
        // fallback below offers a retry or a human.
        setDocumentVerified(false);
        setAadhaarOcrFailed(true);
        setAadhaarOcrMessage(res.data?.message || 'We could not read your Aadhaar card.');
      } else {
        setDocumentVerified(true);
        setAadhaarOcrFailed(false);
        setAadhaarManualVerify(false);
        // Handed back so step 5 can show the number already filled in. It is
        // masked in every other response.
        setAadhaarNumber(res.data?.aadhaarNumber || '');
        notify('Aadhaar card read successfully.');
      }
      await load();
    } catch (e) {
      setError(e.response?.data?.error || 'Could not read your Aadhaar card.');
    } finally {
      setBusy(false);
    }
  };

  // "Read my photos again." The scans are already stored server-side, so this
  // re-runs OCR against them — the user is never asked to re-photograph a
  // document that was fine. OCR fails for reasons that have nothing to do with
  // the image (provider timeout, an IP off the allowlist), and those are worth
  // one more attempt.
  const retryOcr = async (kind) => {
    setError('');
    setBusy(true);
    try {
      const res = await axios.post(`${API_URL}/user/verification/${kind}/retry-ocr`);
      const failed = !!res.data?.needsManualEntry;

      if (kind === 'aadhaar') {
        setDocumentVerified(!failed);
        setAadhaarOcrFailed(failed);
        if (failed) {
          setAadhaarOcrMessage(res.data?.message || 'We still could not read your Aadhaar card.');
        } else {
          setAadhaarManualVerify(false);
          setAadhaarNumber(res.data?.aadhaarNumber || '');
          notify('Aadhaar card read successfully.');
        }
      } else if (failed) {
        setLicenceFallback((f) => ({
          ...(f || {}),
          message: res.data?.message || 'We still could not read your licence.',
          manualOpen: false,
        }));
      } else {
        setLicenceFallback(null);
        setLicenceNumber(res.data?.licenceNumber || '');
        notify('Driving licence read successfully.');
      }
      await load();
    } catch (e) {
      const data = e.response?.data;
      if (data?.needsScan) setError(data.error);
      else setError(data?.error || 'Could not read that document again.');
    } finally {
      setBusy(false);
    }
  };

  // Manual entry for the Aadhaar number, in this step rather than deferred to
  // step 5 — the user is looking at the card right now.
  const saveAadhaarNumberManually = async () => {
    setError('');
    const number = aadhaarNumber.replace(/\s/g, '');
    if (!/^\d{12}$/.test(number)) { setError('Enter the 12-digit Aadhaar number.'); return; }

    setBusy(true);
    try {
      const res = await axios.post(`${API_URL}/user/verification/aadhaar/number`, {
        aadhaarNumber: number,
      });
      setNumberConfirmed(true);
      setAadhaarDetails(res.data);
      if (res.data?.manualVerification) setAadhaarManualVerify(true);
      await load();
      goStep(STEP_LICENCE);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save that Aadhaar number.');
    } finally {
      setBusy(false);
    }
  };

  // ── Step 3: upload the driving licence ────────────────────────────────────
  // The number is not asked for up front: OCR reads it off the front. It is only
  // collected when OCR could not, because support cannot look up a licence with
  // no number attached.
  const scanLicence = async () => {
    setError('');
    if (!licenceFront || !licenceBack) {
      setError('Photograph both the front and back of your licence.'); return;
    }

    setBusy(true);
    try {
      const res = await axios.post(`${API_URL}/user/verification/licence/scan`, {
        frontImage: licenceFront,
        backImage: licenceBack,
      });
      setLicenceScanned(true);

      if (res.data?.needsManualEntry) {
        setLicenceFallback({
          message: res.data?.message || 'We could not read your driving licence.',
          manualOpen: false,
        });
        await load();
      } else {
        setLicenceFallback(null);
        setLicenceNumber(res.data?.licenceNumber || '');
        await load();
        goStep(STEP_SELFIE);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Could not read your driving licence.');
    } finally {
      setBusy(false);
    }
  };

  const saveLicenceNumberManually = async () => {
    setError('');
    const number = licenceNumber.trim().toUpperCase().replace(/[\s-]/g, '');
    if (!LICENCE_RE.test(number)) {
      setError('Enter a valid licence number, for example KA0520190001234.'); return;
    }

    setBusy(true);
    try {
      await axios.post(`${API_URL}/user/verification/licence/number`, { licenceNumber: number });
      setLicenceFallback(null);
      await load();
      goStep(STEP_SELFIE);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save that licence number.');
    } finally {
      setBusy(false);
    }
  };

  // ── Step 4: the live selfie ───────────────────────────────────────────────
  // Required, and there is no skip. A blocked camera gets a permission request,
  // not a way past this step.
  const saveSelfie = async () => {
    if (!selfie) { setError('Take a selfie first.'); return; }
    setError('');
    setBusy(true);
    try {
      const res = await axios.post(`${API_URL}/user/verification/selfie`, { image: selfie });
      // The header avatar renders from redux, not from this response — without
      // this dispatch it keeps showing the old photo (or the placeholder) until
      // the app is restarted.
      const saved = res.data?.profile?.profilePhoto;
      if (saved) dispatch(updateProfile({ profilePhoto: saved }));
      setSelfieSaved(true);
      await load();
      setBusy(false);
      goStep(STEP_KYC);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not save your photo.');
      setBusy(false);
    }
  };

  // ── Step 5: Aadhaar KYC ───────────────────────────────────────────────────
  // Confirm the number first, then prove it with the OTP.
  //
  // The confirm call is not busywork in front of the OTP: it catches a typo, a
  // number already registered to somebody else, and a number that disagrees with
  // the card uploaded in step 2 — all before a code is sent to a phone the user
  // may not be holding. It also returns the details on file for that Aadhaar, so
  // the user can see what is about to be verified.
  const confirmAadhaarNumber = async () => {
    setError('');
    const number = aadhaarNumber.replace(/\s/g, '');
    // No number in hand is normal when OCR read the card: it is returned once,
    // at scan time, and masked in every response afterwards, so reopening the
    // screen leaves this empty. The server falls back to what it read.
    if (number && !/^\d{12}$/.test(number)) {
      setError('Enter the 12-digit Aadhaar number.'); return;
    }
    if (!number && !documentVerified) {
      setError('Enter the 12-digit Aadhaar number.'); return;
    }

    setBusy(true);
    try {
      const res = await axios.post(`${API_URL}/user/verification/aadhaar/number`,
        number ? { aadhaarNumber: number } : {});
      setAadhaarDetails(res.data);
      setNumberConfirmed(true);
      if (res.data?.manualVerification) setAadhaarManualVerify(true);
      await load();
    } catch (e) {
      const data = e.response?.data;
      if (data?.needsScan) {
        // The card is missing — the number has nothing to be checked against.
        setError(data.error);
        goStep(STEP_AADHAAR);
      } else {
        setError(data?.error || 'Could not verify that Aadhaar number.');
      }
    } finally {
      setBusy(false);
    }
  };

  // `kycNumber` is only sent when this screen still holds it. Otherwise the
  // server uses the number the confirm step wrote — the one this code is about
  // to prove — rather than the client keeping a regulated identifier around just
  // to hand it back.
  const sendAadhaarOtp = async () => {
    setError('');
    const number = aadhaarNumber.replace(/\s/g, '');

    setBusy(true);
    try {
      const res = await axios.post(`${API_URL}/user/check-kyc`,
        { uid: 'self', ...(number ? { kycNumber: number } : {}) });
      setAadhaarRef(res.data?.kycRef || '');
      setOtpSent(true);
      notify('OTP sent to your Aadhaar-linked mobile number');
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'Could not send the Aadhaar OTP.');
    } finally {
      setBusy(false);
    }
  };

  const verifyAadhaarOtp = async () => {
    setError('');
    if (!/^\d{4,8}$/.test(aadhaarOtp.trim())) { setError('Enter the OTP you received.'); return; }

    setBusy(true);
    try {
      const number = aadhaarNumber.replace(/\s/g, '');
      await axios.post(`${API_URL}/user/verify-kyc`, {
        ref: aadhaarRef,
        otp: aadhaarOtp.trim(),
        ...(number ? { kycNumber: number } : {}),
        uid: 'self',
        // Set when OCR could not read the card, so the reviewer knows this row
        // needs human eyes even though the OTP passed.
        manualConsent: aadhaarManualVerify,
      });
      setOtpVerified(true);
      setOtpSent(false);
      notify('Aadhaar verified.');
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.response?.data?.message || 'That OTP could not be verified.');
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    setBusy(true);
    try {
      await axios.post(`${API_URL}/user/verification/submit`);
    } catch {
      // Best-effort: the documents are already stored and the server promotes
      // the profile to `pending` on its own once everything is present. Blocking
      // here would strand the user at the end of a flow they have completed.
    }
    setBusy(false);
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
  const licenceDone = !!docs.licence?.submitted;
  // With the provider bypassed there is no OTP to take, so the card goes to the
  // support team instead. The number is still confirmed — it is what the card is
  // checked against — but the step ends at Submit rather than at a code.
  const kycProven = otpVerified || (BYPASS_AADHAAR_VERIFY && numberConfirmed);

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
        {step > 0 || isEdit || isReview ? (
          <TouchableOpacity
            style={styles.headerBack}
            onPress={() => {
              if (step > 0 && !isReview) { goStep(step - 1); return; }
              if (isEdit) { cancel(); return; }
              navigation.goBack();
            }}
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
            {isReview ? 'Identity & documents' : isEdit ? 'Edit profile' : 'Complete your profile'}
          </CustomText>
          <CustomText fontType='primary' style={styles.headerSub}>
            {isReview ? 'What we have on file' : `Step ${step + 1} of ${STEPS.length}`}
          </CustomText>
        </View>
        {isReview ? (
          // Hands off to edit mode rather than making this screen editable too —
          // one editable surface keeps the invalidation rules in one place.
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => navigation.navigate('OnboardingWizard', { mode: 'edit' })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CustomText fontType='primary' weight='Bold' style={styles.headerActionText}>Edit</CustomText>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBackSpacer} />
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView ref={scroller} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps='handled'>
          <StepRail step={step} furthest={furthest} onGo={goStep} allReachable={isReview} />

          {error ? (
            <CustomText fontType='primary' style={styles.error}>{error}</CustomText>
          ) : null}

          {/* ── Step 1: your details ── */}
          {step === STEP_DETAILS && !isReview && (
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
                  {busy ? 'Saving…' : isEdit ? 'Save and continue' : 'Continue'}
                </CustomText>
              </TouchableOpacity>
              {/* Only offered once something has actually changed. */}
              {isEdit && isDirty ? (
                <TouchableOpacity style={styles.linkBtn} disabled={busy} onPress={cancel}>
                  <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>
                    Cancel
                  </CustomText>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          {/* ── Step 2: upload the Aadhaar card ──
              Upload only. The number belongs to step 5, where it is either
              confirmed from what OCR read here or collected because it could not
              be read. */}
          {step === STEP_AADHAAR && !isReview && (
            <>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>
                Upload your Aadhaar card
              </CustomText>
              <CustomText fontType='primary' style={styles.hint}>
                Photograph both sides. Keep the whole card in frame and the text readable —
                we read the details straight off it.
              </CustomText>

              <View style={styles.docRow}>
                <DocCapture label='Front' uri={aadhaarFront || photoUrl(docs.aadhaar?.imageKey)}
                  onPress={captureDocument(setAadhaarFront)} required />
                <DocCapture label='Back' uri={aadhaarBack || photoUrl(docs.aadhaar?.backImageKey)}
                  onPress={captureDocument(setAadhaarBack)} required />
              </View>

              {documentVerified ? (
                <View style={[styles.banner, styles.bannerOk]}>
                  <CustomText fontType='primary' weight='Bold' style={styles.bannerTitle}>
                    Aadhaar card read
                  </CustomText>
                  <CustomText fontType='primary' style={styles.bannerBody}>
                    We read your card. You&apos;ll confirm the number in the last step.
                  </CustomText>
                </View>
              ) : null}

              {aadhaarManualVerify && !documentVerified && !aadhaarOcrFailed ? (
                <View style={[styles.banner, styles.bannerWarn]}>
                  <CustomText fontType='primary' weight='Bold' style={styles.bannerTitle}>
                    Manual check requested
                  </CustomText>
                  <CustomText fontType='primary' style={styles.bannerBody}>
                    Our team will check your Aadhaar card by hand.
                  </CustomText>
                </View>
              ) : null}

              {/* OCR could not read the card. Retry re-reads the photos already
                  on file — nothing is cleared and nothing is re-photographed —
                  and manual entry opens the number field right here. */}
              {aadhaarOcrFailed ? (
                <OcrFallback
                  message={aadhaarOcrMessage}
                  busy={busy}
                  manualOpen={aadhaarManualOpen}
                  onRetry={() => retryOcr('aadhaar')}
                  onManual={() => setAadhaarManualOpen(true)}
                  manualLabel='Enter my Aadhaar number instead'
                >
                  {aadhaarManualOpen ? (
                    <>
                      <Field label='Aadhaar number' value={aadhaarNumber}
                        onChange={(t) => setAadhaarNumber(t.replace(/[^\d\s]/g, ''))}
                        placeholder='0000 0000 0000' keyboardType='number-pad'
                        maxLength={14} required />
                      <TouchableOpacity style={styles.primaryBtn} disabled={busy}
                        onPress={saveAadhaarNumberManually}>
                        <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                          {busy ? 'Saving…' : 'Save and continue'}
                        </CustomText>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.linkBtn} disabled={busy}
                        onPress={() => setAadhaarManualOpen(false)}>
                        <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>
                          Try reading my photos again
                        </CustomText>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </OcrFallback>
              ) : (
                <>
                  <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={scanAadhaar}>
                    <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                      {busy ? 'Reading…' : aadhaarScanned ? 'Upload again' : 'Upload and verify'}
                    </CustomText>
                  </TouchableOpacity>
                  {documentVerified || aadhaarManualVerify ? (
                    <TouchableOpacity style={styles.linkBtn} disabled={busy}
                      onPress={() => goStep(STEP_LICENCE)}>
                      <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>
                        Continue
                      </CustomText>
                    </TouchableOpacity>
                  ) : null}
                  {isEdit && isDirty ? (
                    <TouchableOpacity style={styles.linkBtn} disabled={busy} onPress={cancel}>
                      <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>
                        Cancel
                      </CustomText>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </>
          )}

          {/* ── Step 3: upload the driving licence ── */}
          {step === STEP_LICENCE && !isReview && (
            <>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>
                Upload your driving licence
              </CustomText>
              <CustomText fontType='primary' style={styles.hint}>
                Photograph both sides. We read the licence number and expiry date off the
                front, so you don&apos;t need to type them.
              </CustomText>
              {licenceDone ? (
                <CustomText fontType='primary' style={styles.ok}>
                  Your licence is on file. Uploading again replaces it.
                </CustomText>
              ) : null}

              <View style={styles.docRow}>
                <DocCapture label='Front' uri={licenceFront || photoUrl(docs.licence?.frontImageKey)}
                  onPress={captureDocument(setLicenceFront)} required />
                <DocCapture label='Back' uri={licenceBack || photoUrl(docs.licence?.backImageKey)}
                  onPress={captureDocument(setLicenceBack)} required />
              </View>

              {/* Same two options as the Aadhaar step: read the stored photos
                  again, or type the number here. The photos are never cleared. */}
              {licenceFallback ? (
                <OcrFallback
                  message={licenceFallback.message}
                  busy={busy}
                  manualOpen={licenceFallback.manualOpen}
                  onRetry={() => retryOcr('licence')}
                  onManual={() => setLicenceFallback((f) => ({ ...f, manualOpen: true }))}
                  manualLabel='Enter my licence number instead'
                >
                  {/* Support has to be able to look the licence up, and an
                      unreadable photo is exactly the case where they cannot get
                      the number from the scan either. */}
                  {licenceFallback.manualOpen ? (
                    <>
                      <Field label='Licence number' value={licenceNumber}
                        onChange={(t) => setLicenceNumber(t.toUpperCase())}
                        placeholder='KA0520190001234' autoCapitalize='characters' required />
                      <TouchableOpacity style={styles.primaryBtn} disabled={busy}
                        onPress={saveLicenceNumberManually}>
                        <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                          {busy ? 'Saving…' : 'Save and continue'}
                        </CustomText>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.linkBtn} disabled={busy}
                        onPress={() => setLicenceFallback((f) => ({ ...f, manualOpen: false }))}>
                        <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>
                          Try reading my photos again
                        </CustomText>
                      </TouchableOpacity>
                    </>
                  ) : null}
                </OcrFallback>
              ) : (
                <>
                  <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={scanLicence}>
                    <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                      {busy ? 'Reading…' : licenceScanned ? 'Upload again' : 'Upload and verify'}
                    </CustomText>
                  </TouchableOpacity>
                  {licenceDone ? (
                    <TouchableOpacity style={styles.linkBtn} disabled={busy}
                      onPress={() => goStep(STEP_SELFIE)}>
                      <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>
                        Keep the one on file
                      </CustomText>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </>
          )}

          {/* ── Step 4: live selfie ──
              REQUIRED, and there is no skip — not even a hidden one. A camera
              that will not open gets a permission request, and if the OS has
              stopped prompting, a route into Settings. That is the only remedy
              offered, by design. */}
          {step === STEP_SELFIE && !isReview && (
            <>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>Take a selfie</CustomText>
              <CustomText fontType='primary' style={styles.hint}>
                This becomes your profile photo and helps hosts recognise you. It has to be
                taken now with your front camera — you can&apos;t choose an existing picture.
              </CustomText>

              <View style={styles.selfieWrap}>
                <TouchableOpacity
                  style={styles.selfieFrame}
                  onPress={captureSelfie()}
                >
                  {selfie ? (
                    <Image source={{ uri: selfie }} style={styles.selfieImage} resizeMode='cover' />
                  ) : (
                    <>
                      <Icon name='camera-outline' size={30} color='#757575' />
                      <CustomText fontType='primary' style={styles.docText}>
                        Tap to take a selfie
                      </CustomText>
                    </>
                  )}
                </TouchableOpacity>
                {selfie ? (
                  <TouchableOpacity style={styles.linkBtn} onPress={captureSelfie()}>
                    <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>Retake</CustomText>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Only shown once a capture has actually been refused — never on
                  a pre-check, which is what used to report "no camera" on a
                  working phone. 'blocked' means the OS has stopped prompting, so
                  the button goes to Settings; anything else gets another prompt. */}
              {cameraPermission && cameraPermission !== 'granted' && !selfie ? (
                <View style={[styles.banner, styles.bannerWarn]}>
                  <CustomText fontType='primary' weight='Bold' style={styles.bannerTitle}>
                    Camera access is needed
                  </CustomText>
                  <CustomText fontType='primary' style={styles.bannerBody}>
                    {cameraPermission === 'blocked'
                      ? 'The camera is turned off for Cocarr, so we can\'t ask again from '
                        + 'here. Open Settings, allow the camera, then come back and tap the circle.'
                      : 'Your selfie has to be taken now, so we need the camera. Allow it and '
                        + 'we\'ll go straight to it.'}
                  </CustomText>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    disabled={busy}
                    onPress={async () => {
                      // Only jump to Settings when the OS has stopped asking —
                      // otherwise the in-app prompt is the better experience.
                      const verdict = await requestCameraPermission(cameraPermission === 'blocked');
                      setCameraPermission(verdict);
                      if (verdict !== 'blocked') captureSelfie()();
                    }}
                  >
                    <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                      {cameraPermission === 'blocked' ? 'Open Settings' : 'Allow camera'}
                    </CustomText>
                  </TouchableOpacity>
                </View>
              ) : null}

              <TouchableOpacity style={styles.primaryBtn} disabled={busy || !selfie} onPress={saveSelfie}>
                <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                  {busy ? 'Saving…' : 'Save and continue'}
                </CustomText>
              </TouchableOpacity>

              {/* Edit mode already has a photo on file, so the step is satisfied
                  and this simply moves on. In onboarding there is no such
                  control: the only way forward is to take the photo. */}
              {isEdit || selfieSaved ? (
                <TouchableOpacity style={styles.linkBtn} disabled={busy}
                  onPress={() => goStep(STEP_KYC)}>
                  <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>
                    {selfieSaved ? 'Keep my current photo' : 'Done'}
                  </CustomText>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          {/* ── Step 5: Aadhaar KYC ──
              Two phases: settle the number, then prove it with the OTP. */}
          {step === STEP_KYC && !isReview && (
            <>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>Aadhaar KYC</CustomText>

              {!kycProven ? (
                <CustomText fontType='primary' style={styles.hint}>
                  {documentVerified
                    ? 'We read this number off the card you uploaded. Confirm it, then we\'ll '
                      + 'verify it with a one-time code.'
                    : 'We couldn\'t read the number from your card, so please enter it. We\'ll '
                      + 'check it and then verify it with a one-time code.'}
                </CustomText>
              ) : null}

              {/* Phase 1 — the number.
                  The field is only shown when there is something for the user to
                  type into it. When OCR read the card and this screen no longer
                  has the number (it is returned once and masked thereafter), an
                  empty box would read as "we lost it" — so say what will be
                  used instead. */}
              {!kycProven ? (
                <>
                  {documentVerified && !aadhaarNumber ? (
                    <CustomText fontType='primary' style={styles.hint}>
                      We&apos;ll use the number we read from the Aadhaar card you uploaded.
                    </CustomText>
                  ) : (
                    <Field label='Aadhaar number' value={aadhaarNumber}
                      onChange={(t) => setAadhaarNumber(t.replace(/[^\d\s]/g, ''))}
                      placeholder='0000 0000 0000' keyboardType='number-pad' maxLength={14}
                      // Locked once confirmed, and while an OTP for it is in
                      // flight — the code is bound to the number it was sent for.
                      editable={!numberConfirmed && !otpSent} required />
                  )}

                  {!numberConfirmed ? (
                    <TouchableOpacity style={styles.primaryBtn} disabled={busy}
                      onPress={confirmAadhaarNumber}>
                      <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                        {busy ? 'Checking…' : 'Verify and fetch details'}
                      </CustomText>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : null}

              {/* What we hold for that Aadhaar, so the user can see what is about
                  to be verified rather than being asked to trust a number back. */}
              {numberConfirmed && aadhaarDetails && !otpVerified ? (
                <ReviewList rows={[
                  ['Aadhaar number', aadhaarDetails.aadhaarNumber],
                  ['Name on card', aadhaarDetails.holderName],
                  ['Date of birth', aadhaarDetails.dateOfBirth],
                  ['Gender', aadhaarDetails.gender],
                  ['Address', aadhaarDetails.address],
                ]} />
              ) : null}

              {/* Phase 2 — the OTP. Skipped entirely when the provider is
                  bypassed; the card goes to the support team instead. */}
              {numberConfirmed && !otpVerified && !BYPASS_AADHAAR_VERIFY ? (
                <>
                  {!otpSent ? (
                    <>
                      <CustomText fontType='primary' style={styles.hint}>
                        We&apos;ll send a one-time code to the mobile number registered against
                        this Aadhaar.
                      </CustomText>
                      <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={sendAadhaarOtp}>
                        <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                          {busy ? 'Sending…' : 'Send Aadhaar OTP'}
                        </CustomText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.linkBtn}
                        disabled={busy}
                        onPress={() => { setNumberConfirmed(false); setAadhaarDetails(null); }}
                      >
                        <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>
                          Use a different number
                        </CustomText>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Field label='OTP' value={aadhaarOtp}
                        onChange={(t) => setAadhaarOtp(t.replace(/\D/g, ''))}
                        placeholder='Enter the code' keyboardType='number-pad' maxLength={8} required />
                      <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={verifyAadhaarOtp}>
                        <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                          {busy ? 'Verifying…' : 'Verify OTP'}
                        </CustomText>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.linkBtn} disabled={busy} onPress={sendAadhaarOtp}>
                        <CustomText fontType='primary' weight='SemiBold' style={styles.linkText}>
                          Resend OTP
                        </CustomText>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              ) : null}

              {BYPASS_AADHAAR_VERIFY && numberConfirmed ? (
                <View style={[styles.banner, styles.bannerWarn]}>
                  <CustomText fontType='primary' weight='Bold' style={styles.bannerTitle}>
                    Manual verification
                  </CustomText>
                  <CustomText fontType='primary' style={styles.bannerBody}>
                    Automatic Aadhaar verification is unavailable at the moment, so our team
                    will check your card against this number by hand.
                  </CustomText>
                </View>
              ) : null}

              {otpVerified ? (
                <CustomText fontType='primary' style={styles.ok}>Aadhaar verified.</CustomText>
              ) : null}

              {/* Submit. The last action of the whole wizard — everything else is
                  already stored by the time this is pressed. */}
              {kycProven ? (
                <>
                  <View style={[styles.banner, styles.bannerOk]}>
                    <CustomText fontType='primary' weight='Bold' style={styles.bannerTitle}>
                      That&apos;s everything
                    </CustomText>
                    <CustomText fontType='primary' style={styles.bannerBody}>
                      Submitting sends your profile to our team. Once it&apos;s approved you can
                      book a ride — in the meantime, enjoy browsing our cars.
                    </CustomText>
                  </View>
                  <TouchableOpacity style={styles.primaryBtn} disabled={busy} onPress={finish}>
                    <CustomText fontType='primary' weight='Bold' style={styles.primaryBtnText}>
                      {busy ? 'Submitting…' : 'Submit'}
                    </CustomText>
                  </TouchableOpacity>
                </>
              ) : null}
            </>
          )}

          {/* ── Review mode: read-only sections, selected from the rail ── */}
          {isReview && step === STEP_DETAILS && (
            <View>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>Your details</CustomText>
              <ReviewList rows={[
                ['Full name', [form.firstName, form.lastName].filter(Boolean).join(' ')],
                ['Date of birth', form.dateOfBirth],
                ['Email', form.email],
                ['Address', form.address],
                ['City', form.city],
                ['State', form.state],
                ['PIN code', form.pincode],
              ]} />
            </View>
          )}

          {isReview && step === STEP_AADHAAR && (
            <View>
              <View style={styles.reviewHead}>
                <CustomText fontType='primary' weight='Bold' style={styles.h2}>Aadhaar card</CustomText>
                <DocStatus doc={docs.aadhaar} />
              </View>
              {docs.aadhaar?.scanned ? (
                <>
                  <ReviewList rows={[
                    ['Name on card', docs.aadhaar.holderName],
                    ['Date of birth', docs.aadhaar.dateOfBirth],
                    ['Read automatically', docs.aadhaar.documentVerified ? 'Yes' : 'No'],
                  ]} />
                  {docs.aadhaar.rejectionReason ? (
                    <CustomText fontType='primary' style={styles.error}>
                      {docs.aadhaar.rejectionReason}
                    </CustomText>
                  ) : null}
                  {/* The number is masked server-side and deliberately not shown —
                      there is nothing useful a user can do with it. */}
                  <View style={styles.docRow}>
                    <ReviewImage src={docs.aadhaar.imageKey} label='Front' />
                    <ReviewImage src={docs.aadhaar.backImageKey} label='Back' />
                  </View>
                </>
              ) : (
                <CustomText fontType='primary' style={styles.hint}>
                  You haven&apos;t added your Aadhaar card yet.
                </CustomText>
              )}
            </View>
          )}

          {isReview && step === STEP_LICENCE && (
            <View>
              <View style={styles.reviewHead}>
                <CustomText fontType='primary' weight='Bold' style={styles.h2}>Driving licence</CustomText>
                <DocStatus doc={docs.licence} />
              </View>
              {docs.licence?.submitted ? (
                <>
                  <ReviewList rows={[
                    ['Licence number', docs.licence.licenceNumber],
                    ['Name on licence', docs.licence.holderName],
                    ['Expires', docs.licence.expiryDate],
                  ]} />
                  {docs.licence.rejectionReason ? (
                    <CustomText fontType='primary' style={styles.error}>
                      {docs.licence.rejectionReason}
                    </CustomText>
                  ) : null}
                  <View style={styles.docRow}>
                    <ReviewImage src={docs.licence.frontImageKey} label='Front' />
                    <ReviewImage src={docs.licence.backImageKey} label='Back' />
                  </View>
                </>
              ) : (
                <CustomText fontType='primary' style={styles.hint}>
                  You haven&apos;t added your driving licence yet.
                </CustomText>
              )}
            </View>
          )}

          {isReview && step === STEP_SELFIE && (
            <View>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>Selfie</CustomText>
              {status?.profile?.profilePhoto ? (
                <View style={styles.selfieWrap}>
                  <Image
                    source={{ uri: photoUrl(status.profile.profilePhoto) }}
                    style={styles.selfieFrame}
                    resizeMode='cover'
                  />
                </View>
              ) : (
                <CustomText fontType='primary' style={styles.hint}>
                  You haven&apos;t added a selfie. It becomes your profile photo.
                </CustomText>
              )}
            </View>
          )}

          {isReview && step === STEP_KYC && (
            <View>
              <CustomText fontType='primary' weight='Bold' style={styles.h2}>Aadhaar KYC</CustomText>
              <ReviewList rows={[
                ['Number on file', docs.aadhaar?.numberConfirmed ? 'Yes' : 'No'],
                ['Verified by OTP', docs.aadhaar?.otpVerified ? 'Yes' : 'No'],
                docs.aadhaar?.manualConsent
                  ? ['Manual check', 'Requested — our team will verify by hand']
                  : null,
              ].filter(Boolean)} />
            </View>
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
  inputLocked: { backgroundColor: '#0e0e11', color: '#6b6b73' },
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

  headerAction: { width: 44, alignItems: 'flex-end', justifyContent: 'center' },
  headerActionText: { color: BRAND_COLOR, fontSize: 14 },

  reviewHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  reviewList: { backgroundColor: '#141418', borderRadius: 10, paddingHorizontal: 14, marginTop: 6 },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 16,
    paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1e1e22',
  },
  reviewLabel: { fontSize: 12, color: '#9a9aa2' },
  reviewValue: { fontSize: 13, color: '#fff', flexShrink: 1, textAlign: 'right' },
  reviewEmpty: { color: '#6b6b73', fontStyle: 'italic' },

  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 10.5, letterSpacing: 0.4 },

  reviewImgWrap: { flex: 1 },
  reviewImg: {
    width: '100%', aspectRatio: 3 / 2, borderRadius: 8,
    borderWidth: 1, borderColor: '#26262c', backgroundColor: '#141418',
  },
  reviewImgEmpty: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' },
  reviewImgCaption: { fontSize: 11, color: '#6b6b73', textAlign: 'center', marginTop: 5 },

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
