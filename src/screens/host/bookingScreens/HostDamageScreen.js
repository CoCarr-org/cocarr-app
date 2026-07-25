import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ActivityIndicator, ScrollView, Modal, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../../utils/constants';
import CustomText from '../../../components/CustomText';
import { useNavigation } from '@react-navigation/native';
import CenterHeader from '../../../components/CenterHeader';
import { launchImageLibrary } from 'react-native-image-picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UnauthAxios, notify } from '../../../utils/utils';

const MAX_PHOTOS = 10;

const DAMAGE_PARTS = [
  { label: 'Front Driver Door', value: 'front-driver-door' },
  { label: 'Passenger Door', value: 'passenger-door' },
  { label: 'Front Bumper', value: 'front-bumper' },
  { label: 'Bonnet', value: 'bonnet' },
  { label: 'Rear Bumper', value: 'rear-bumper' },
  { label: 'Right Quarter Panel', value: 'right-quarter-panel' },
  { label: 'Left Quarter Panel', value: 'left-quarter-panel' },
  { label: 'Rear Right Door', value: 'rear-right-door' },
  { label: 'Rear Left Door', value: 'rear-left-door' },
  { label: 'Driver Side Rear View Mirror', value: 'driver-side-mirror' },
  { label: 'Passenger Side Rear View Mirror', value: 'passenger-side-mirror' },
  { label: 'Other', value: 'other' },
];

const DAMAGE_TYPES = [
  { label: 'Scratch', value: 'scratch' },
  { label: 'Multiple Scratches', value: 'multiple-scratches' },
  { label: 'Dent', value: 'dent' },
  { label: 'Minor Damage', value: 'minor-damage' },
  { label: 'Broken Part', value: 'broken-part' },
  { label: 'Major Damage', value: 'major-damage' },
  { label: 'Accident', value: 'accident' },
  { label: 'Other', value: 'other' },
];

// Self-contained dropdown bound to the parent's selected value. A plain RN
// Modal bottom-sheet (no external actions-sheet dependency) — reliably opens
// and marks the active row with a check.
const Dropdown = ({ label, placeholder, options, selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 18 }}>
      <CustomText fontType="primary" weight="SemiBold" style={styles.fieldLabel}>{label}</CustomText>
      <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen(true)} style={styles.field}>
        <Text style={[styles.fieldValue, !selected && styles.fieldPlaceholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Icon name="chevron-down" size={16} color="#8a8a8a" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <CustomText fontType="primary" weight="Bold" style={styles.sheetTitle}>{label}</CustomText>
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const active = selected?.value === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.7}
                  onPress={() => { onSelect(option); setOpen(false); }}
                  style={[styles.sheetRow, active && styles.sheetRowActive]}
                >
                  <CustomText fontType="primary" weight={active ? 'Bold' : 'Regular'} style={[styles.sheetRowText, active && { color: BRAND_COLOR }]}>
                    {option.label}
                  </CustomText>
                  {active && <Icon name="checkmark-circle" size={18} color={BRAND_COLOR} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export function HostDamageScreen({ route }) {
  const navigation = useNavigation();
  const { bookingId } = route.params;
  const authInfo = useSelector((state) => state.auth);
  const [booking, setBooking] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState({
    damageDescription: '',
    damagePart: '',
    damageType: '',
    damageImage: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get(`${API_URL}/booking/${bookingId}`);
        setBooking(response.data);
      } catch (error) {
        console.error('Error fetching booking data:', error.message);
        notify('Error');
      }
    })();
  }, [bookingId]);

  const selectImages = () => {
    const remaining = MAX_PHOTOS - data.damageImage.length;
    if (remaining <= 0) {
      notify(`You can add up to ${MAX_PHOTOS} photos`);
      return;
    }
    // selectionLimit caps how many can be picked in one go; picking appends to
    // whatever's already been added, so the host can add photos in batches.
    launchImageLibrary({ mediaType: 'photo', selectionLimit: remaining, quality: 0.5 }, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        notify('Could not open the photo library');
        return;
      }
      if (response.assets?.length) {
        setData((prev) => ({
          ...prev,
          damageImage: [...prev.damageImage, ...response.assets].slice(0, MAX_PHOTOS),
        }));
      }
    });
  };

  const handleRemoveImage = (index) => {
    setData((prev) => ({ ...prev, damageImage: prev.damageImage.filter((_, i) => i !== index) }));
  };

  const isValid = data.damagePart && data.damageType && data.damageDescription.trim() && data.damageImage.length > 0;

  const onSubmit = async () => {
    if (!isValid || submitting) return;
    try {
      setSubmitting(true);
      const uploadPromises = data.damageImage.map(async (image) => {
        if (!image) return null;

        const urlRes = await axios.get(`${API_URL}/image/url`, {
          params: { fileName: image.fileName, fileType: image.type },
        });

        const formData = new FormData();
        Object.entries(urlRes.data.fields).forEach(([field, value]) => {
          formData.append(field, value);
        });
        formData.append('acl', 'public-read');
        formData.append('file', { uri: image.uri, type: image.type, name: image.fileName });

        await UnauthAxios().post(urlRes.data.url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).catch((error) => {
          console.error('Upload error:', error.response?.data || error.message);
          throw error;
        });

        // The presigned bucket URL has no trailing slash, so `url + key` is
        // malformed. The bucket is private — store the API image-proxy URL.
        return { url: `${API_URL}/image/${urlRes.data.fields.key}` };
      });

      const uploadedImages = (await Promise.all(uploadPromises)).filter(Boolean);

      await axios.post(`${API_URL}/damage/create`, {
        bookingId: booking.id,
        damageType: data.damageType.value,
        damageDescription: data.damageDescription,
        damagedPart: data.damagePart.value,
        damageImage: uploadedImages,
      }, {
        headers: { Authorization: `${authInfo.token}` },
      });

      notify('Damage reported');
      navigation.navigate('HostBookingInfo', { bookingId });
    } catch (error) {
      console.error('Error reporting damage:', error.response ? error.response.data : error.message);
      notify('Could not submit the damage report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <CenterHeader title={'Report Damage'} customSecondaryText={booking.bookingId} navigation={navigation} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={styles.notice}>
          <Icon name="information-circle-outline" size={16} color={BRAND_COLOR} />
          <CustomText fontType="primary" weight="Regular" numberOfLines={3} style={styles.noticeText}>
            Add the damaged part, type, a short description and clear photos as evidence.
          </CustomText>
        </View>

        <Dropdown
          label="Damaged Part"
          placeholder="Select the damaged part"
          options={DAMAGE_PARTS}
          selected={data.damagePart || null}
          onSelect={(value) => setData((prev) => ({ ...prev, damagePart: value }))}
        />

        <Dropdown
          label="Damage Type"
          placeholder="Select the damage type"
          options={DAMAGE_TYPES}
          selected={data.damageType || null}
          onSelect={(value) => setData((prev) => ({ ...prev, damageType: value }))}
        />

        <View style={{ marginBottom: 18 }}>
          <CustomText fontType="primary" weight="SemiBold" style={styles.fieldLabel}>Description</CustomText>
          <View style={styles.textareaWrap}>
            <TextInput
              multiline
              numberOfLines={4}
              maxLength={300}
              style={styles.textarea}
              placeholder="Describe what happened…"
              placeholderTextColor="#757575"
              value={data.damageDescription}
              onChangeText={(value) => setData((prev) => ({ ...prev, damageDescription: value }))}
            />
            <CustomText fontType="primary" weight="Regular" style={styles.charCount}>{data.damageDescription.length}/300</CustomText>
          </View>
        </View>

        <View style={{ marginBottom: 8 }}>
          <View style={styles.photoHeader}>
            <CustomText fontType="primary" weight="SemiBold" style={styles.fieldLabel}>Photos</CustomText>
            <CustomText fontType="primary" weight="SemiBold" style={styles.photoCount}>{data.damageImage.length}/{MAX_PHOTOS}</CustomText>
          </View>

          <View style={styles.photoGrid}>
            {data.damageImage.length < MAX_PHOTOS && (
              <TouchableOpacity activeOpacity={0.8} onPress={selectImages} style={[styles.photoTile, styles.addTile]}>
                <Icon name="camera-outline" size={24} color="#8a8a8a" />
                <CustomText fontType="primary" weight="SemiBold" style={styles.addTileText}>Add Photos</CustomText>
              </TouchableOpacity>
            )}
            {data.damageImage.map((image, index) => (
              <View key={index} style={styles.photoTile}>
                <Image source={{ uri: image.uri }} style={styles.photoImg} />
                <TouchableOpacity onPress={() => handleRemoveImage(index)} style={styles.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!isValid || submitting}
          onPress={onSubmit}
          style={[styles.submitBtn, (!isValid || submitting) && styles.submitBtnDisabled]}
        >
          {submitting
            ? <ActivityIndicator color="#000" />
            : <CustomText fontType="primary" weight="Bold" style={[styles.submitText, (!isValid) && { color: '#8a8a8a' }]}>Submit Damage Report</CustomText>}
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  notice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#EDBF3110', borderWidth: 1, borderColor: '#EDBF3122',
    borderRadius: 10, padding: 12, marginBottom: 22,
  },
  noticeText: { color: '#c9c9c9', fontSize: 12, flex: 1, lineHeight: 17 },

  fieldLabel: {
    color: '#8a8a8a', fontSize: 11, textTransform: 'uppercase',
    letterSpacing: 0.4, marginBottom: 8,
  },
  field: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#141416', borderWidth: 1, borderColor: '#26262a',
    borderRadius: 10, paddingVertical: 14, paddingHorizontal: 14,
  },
  fieldValue: { color: '#efefef', fontSize: 14, flex: 1, marginRight: 8 },
  fieldPlaceholder: { color: '#757575' },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#161618', borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingHorizontal: 16, paddingBottom: 28,
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#3a3a40', marginTop: 10, marginBottom: 8 },
  sheetTitle: { color: '#f0f0f2', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6, paddingHorizontal: 4 },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15, paddingHorizontal: 12, borderRadius: 10,
    borderBottomWidth: 1, borderBottomColor: '#202024',
  },
  sheetRowActive: { backgroundColor: '#EDBF310F' },
  sheetRowText: { color: '#e3e3e3', fontSize: 14 },

  textareaWrap: {
    backgroundColor: '#141416', borderWidth: 1, borderColor: '#26262a', borderRadius: 10,
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 26,
  },
  textarea: { color: '#efefef', fontSize: 14, textAlignVertical: 'top', minHeight: 90, padding: 0 },
  charCount: { position: 'absolute', right: 12, bottom: 8, color: '#757575', fontSize: 11 },

  photoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  photoCount: { color: BRAND_COLOR, fontSize: 12 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  photoTile: { width: '31.5%', aspectRatio: 1, borderRadius: 10, backgroundColor: '#141416', overflow: 'hidden' },
  addTile: {
    borderWidth: 1, borderColor: '#3a3a40', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  addTileText: { color: '#8a8a8a', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.2 },
  photoImg: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center',
  },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#1c1c1e', backgroundColor: '#000' },
  submitBtn: { backgroundColor: BRAND_COLOR, borderRadius: 10, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { backgroundColor: '#2a2a2c' },
  submitText: { color: '#000', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.3 },
});
