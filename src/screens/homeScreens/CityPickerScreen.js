import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { setShowCityPicker, setShowCityLocation } from '../../store/bookingSlice';
import axios from 'axios';
import { API_URL } from '../../utils/constants';
import CustomText from '../../components/CustomText';

import { C, themedStyleSheet } from '../../theme';

// Centered modal city picker, mirroring the web city-selection modal:
// a header with a dismiss (X) button, a search box, and an alphabetical
// list of serviced cities with a check on the selected one.
export function CityPickerScreen() {
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const bookingInfo = useSelector((state) => state.booking);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchCities();
  }, []);

  async function fetchCities() {
    try {
      const response = await axios.get(`${API_URL}/city`);
      const list = Array.isArray(response.data) ? response.data : [];
      setCities(list.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  }

  const filteredCities = search.trim()
    ? cities.filter((c) => (c.name || '').toLowerCase().includes(search.trim().toLowerCase()))
    : cities;

  // Selecting a city fills both the city and the location (= city coordinates,
  // resolved to a readable address when possible).
  const handleConfirm = async (item) => {
    try {
      const detectedLocation = { name: item.name, latitude: item.lat, longitude: item.lng };
      try {
        const res = await axios.get(`${API_URL}/utility/get-place?lat=${item.lat}&long=${item.lng}`);
        if (res.data) detectedLocation.name = res.data;
      } catch (e) {
        // fall back to the city name
      }
      dispatch(setShowCityLocation({
        selectedCity: { id: item.id, name: item.name },
        selectedLocation: detectedLocation,
      }));
      onClose();
    } catch (error) {
      console.error('Error confirming city selection:', error);
    }
  };

  const onClose = () => {
    setSearch('');
    dispatch(setShowCityPicker(false));
  };

  return (
    <Modal
      visible={!!bookingInfo.showCityPicker}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => {}}>
          <View style={styles.header}>
            <CustomText fontType="primary" weight="Bold" style={styles.title}>Select city</CustomText>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.closeButton}>
              <Icon name="close" size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search city"
              placeholderTextColor={C.textTertiary}
              style={styles.searchInput}
            />
          </View>

          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <CustomText fontType="primary" weight="Regular" style={styles.empty}>No matching city</CustomText>
            }
            renderItem={({ item }) => {
              const selected = bookingInfo.selectedCity?.id === item.id;
              return (
                <TouchableOpacity style={[styles.cityItem, selected && styles.cityItemSelected]} onPress={() => handleConfirm(item)}>
                  <Icon name="location-outline" size={18} color={selected ? C.primaryText : C.textTertiary} />
                  <CustomText fontType="primary" weight={selected ? 'Medium' : 'Regular'} style={{ flex: 1, color: selected ? C.text : C.text, fontSize: 15, textTransform: 'capitalize' }}>{item.name}</CustomText>
                  {selected && <Icon name="checkmark-circle" size={20} color={C.primaryText} />}
                </TouchableOpacity>
              );
            }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = themedStyleSheet(C => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '72%',
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderStrong,
    overflow: 'hidden',
    paddingBottom: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.borderStrong,
  },

  title: {
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  closeButton: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBox: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },

  searchInput: {
    backgroundColor: C.surfaceHigh,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    color: C.text,
  },

  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  cityItemSelected: {
    backgroundColor: C.surface,
  },

  empty: {
    color: C.textTertiary,
    fontSize: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
  }
}));
