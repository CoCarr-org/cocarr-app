import React, { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, FlatList, TouchableHighlight, ToastAndroid, ScrollView } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { setDates, setSelectedCity, setShowCityLocation, setShowCityPicker } from '../../store/bookingSlice';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomText from '../../components/CustomText';
import LocationSearchScreen from './LocationSearchScreen';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import axios from 'axios';
import LocationInvalidScreen from './LocationInvalidScreen';
import LocationChangeNotificationScreen from './LocationChangeNotificationScreen';
import { getCurrentLocation, notify } from '../../utils/utils';

export function DatePickerScreen({ visible, onClose, onSelect }) {
  const insets = useSafeAreaInsets();
    const bookingState = useSelector((state) => state.booking);
  const [startDate, setStartDate] = useState(bookingState.startDateTime ? new Date(bookingState.startDateTime) : new Date());
  const [endDate, setEndDate] = useState(bookingState.endDateTime ? new Date(bookingState.endDateTime) : new Date());
  const [startTime, setStartTime] = useState(bookingState.startDateTime ? new Date(bookingState.startDateTime) : new Date());
  const [endTime, setEndTime] = useState(bookingState.endDateTime ? new Date(bookingState.endDateTime) : new Date());
  const [markedDates, setMarkedDates] = useState({});
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [startTimeSlots, setStartTimeSlots] = useState([]);
  const [endTimeSlots, setEndTimeSlots] = useState([]);
  const from = useRoute().params?.from || 'page';
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showCityChange, setShowCityChange] = useState(false);
  const [showLocationValid, setShowLocationValid] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  // Round time to nearest 30 minutes
  const roundToNearestThirty = (date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes/30) * 30;
    const newDate = new Date(date);
    newDate.setMinutes(roundedMinutes, 0, 0);
    return newDate;
  };

  useEffect(() => {
    // Initialize with rounded current time
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Select Date & Time',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        color: '#efefef',
        fontSize: 13,
        fontWeight: '500',
      },
      headerLeft: () => <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="chevron-back" size={20} color="#a3a3a3" /></TouchableOpacity>,
      headerStyle: {
        backgroundColor: '#000',
      },
      headerTintColor: '#fff',
    })

    const now = new Date();
    const rounded = roundToNearestThirty(now);
    console.log('runngin on navrounded', rounded)
    // setStartTime(rounded);
    
    // Set end time to 24 hours after start
    const endDefault = new Date(rounded);
    endDefault.setHours(endDefault.getHours() + 24);
    // setEndTime(endDefault);

    // Initialize calendar marked dates
    updateMarkedDates(now, endDefault);
  }, []);

  const updateMarkedDates = (start, end) => {
    const marked = {};
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    if (startStr === endStr) {
      // For same day selection
      marked[startStr] = {
        selected: true,
        color: '#EDBF31',
        textColor: '#000',
        startingDay: true,
        endingDay: true
      };
    } else {
      // For date range selection
      marked[startStr] = {
        startingDay: true,
        color: '#EDBF31',
        textColor: '#000'
      };
      
      marked[endStr] = {
        endingDay: true,
        color: '#EDBF31',
        textColor: '#000'
      };
      
      // Mark dates in between
      let currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + 1);
      
      while (currentDate < end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        marked[dateStr] = {
          color: '#EDBF31',
          textColor: '#000'
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    setMarkedDates(marked);
  };

  const onDayPress = (day) => {
    const selectedDate = new Date(day.dateString);
    
    if (!startDate) {
      // First selection - set start date
      setStartDate(selectedDate);
      setEndDate(null);
      updateMarkedDates(selectedDate, selectedDate);
    } else if (!endDate) {
      // Second selection - set end date
      if (selectedDate < startDate) {
        // If selected date is before start date, swap them
        setEndDate(startDate);
        setStartDate(selectedDate);
        updateMarkedDates(selectedDate, startDate);
      } else {
        setEndDate(selectedDate);
        updateMarkedDates(startDate, selectedDate);
      }
    } else {
      // New selection - reset and start over
      setStartDate(selectedDate);
      setEndDate(null);
      updateMarkedDates(selectedDate, selectedDate);
    }
  };

  // Minimum booking window (hours). Picking a start time auto-selects the end.
  const MIN_BOOKING_HOURS = 12;
  const onSelectStartTime = (value) => {
    setStartTime(value);
    const end = new Date(new Date(value).getTime() + MIN_BOOKING_HOURS * 60 * 60 * 1000);
    setEndDate(end);
    setEndTime(end.toISOString());
  };

  const handleConfirm = () => {
    // Combine dates and times
    const startDateTime = new Date(startDate);
    startDateTime.setHours(new Date(startTime).getHours(), new Date(startTime).getMinutes());

    const endDateTime = new Date(endDate);
    endDateTime.setHours(new Date(endTime).getHours(), new Date(endTime).getMinutes());

    // Update booking state
    dispatch(setDates({
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString()
    }));
    if (from === 'home') {
      navigation.replace('CarsListing');
    } else {
      navigation.goBack();
    }
  };

  const generateStartTimeSlots = (startDate) => {
    console.log('generate start slots', startDate)
    const startSlots = [];
    const now = new Date();
    const threeHoursFromNow = new Date(now);
    threeHoursFromNow.setHours(now.getHours() + 3);

    const generateSlots = (startHour, date) => {
      const slots = [];
      for (let i = startHour; i < 24; i++) {
        const hour12 = i % 12 === 0 ? 12 : i % 12;
        const period = i < 12 ? 'AM' : 'PM';
        const label = `${hour12 < 10 ? '0' : ''}${hour12}:00 ${period}`;
        const value = new Date(date);
        value.setHours(i, 0);
        slots.push({ label, value: value.toISOString() });

        const labelHalf = `${hour12 < 10 ? '0' : ''}${hour12}:30 ${period}`;
        const valueHalf = new Date(date);
        valueHalf.setHours(i, 30);
        slots.push({ label: labelHalf, value: valueHalf.toISOString() });
      }
      return slots;
    };

    if (startDate.toDateString() === now.toDateString() || startDate < threeHoursFromNow) {
      startSlots.push(...generateSlots(threeHoursFromNow.getHours(), startDate));
    } else {
      startSlots.push(...generateSlots(0, startDate));
    }

    setStartTimeSlots(startSlots);
    setStartTime();
  };

  const generateEndTimeSlots = (startDate, endDate) => {
    const endSlots = [];
    console.log('generate end slots', startDate,'-', endDate)
    const generateSlots = (startHour, date) => {
      const slots = [];
      for (let i = startHour; i < 24; i++) {
        const hour12 = i % 12 === 0 ? 12 : i % 12;
        const period = i < 12 ? 'AM' : 'PM';
        const label = `${hour12 < 10 ? '0' : ''}${hour12}:00 ${period}`;
        const value = new Date(date);
        value.setHours(i, 0);
        slots.push({ label, value: value.toISOString() });

        const labelHalf = `${hour12 < 10 ? '0' : ''}${hour12}:30 ${period}`;
        const valueHalf = new Date(date);
        valueHalf.setHours(i, 30);
        slots.push({ label: labelHalf, value: valueHalf.toISOString() });
      }
      return slots;
    };

    const startDateTime = new Date(startDate);
    console.log('startDateTime', startDateTime)
    startDateTime.setHours(new Date(startTime).getHours(), new Date(startTime).getMinutes());
    const endDateTime = new Date(endDate);
    endDateTime.setHours(new Date(endTime).getHours(), new Date(endTime).getMinutes());

    if ((endDateTime - startDateTime) >= 12 * 60 * 60 * 1000) {
      endSlots.push(...generateSlots(0, endDate));
    } else {
      const twelveHoursLater = new Date(startDateTime);
      twelveHoursLater.setHours(twelveHoursLater.getHours() + 12);
      console.log('twelveHoursLater', startDateTime)
      if (twelveHoursLater.toDateString() === startDateTime.toDateString()) {
        endSlots.push(...generateSlots(twelveHoursLater.getHours(), startDate));
      }
    }

    console.log('endDate', endDate);
    console.log('endSlots', endSlots);
    setEndTimeSlots(endSlots);
    // setEndTime('');
  };


  useEffect(() => {
    generateStartTimeSlots(startDate);
  }, [startDate]);
  
  useEffect(() => {
    generateEndTimeSlots(startDate, endDate);
  }, [startDate, endDate, startTime]);


  useEffect(() => {
    // console.log('startDate', startDate)
    // console.log('endDate', endDate)
  }, [startDate, endDate, startTime, endTime]);

  const onLocationPress = async(item) => {
    try 
    {
      let response = await axios.post(`${API_URL}/utility/validate-place?placeId=${item.place_id}&cityId=${bookingState.selectedCity.id}`,{placeName:item.description})
      console.log('response', response.data.info.geometry.location)
      const { info, city, isCityChanged, isPlaceValid } = response.data;
      if (isCityChanged) {
        setShowLocationSearch(false)
        setShowCityChange({info:{name:info.formatted_address,place_id:info.place_id,latitude:info.geometry.location.lat,longitude:info.geometry.location.lng},city:city});
      } else if (!isPlaceValid) {
        setShowLocationSearch(false)
        setShowLocationValid(true);
      } else {
        setShowLocationSearch(false)
        dispatch(setSelectedCity(city));
        dispatch(setShowCityLocation({selectedCity:city,selectedLocation:{name:info.formatted_address,place_id:info.place_id,latitude:info.geometry.location.lat,longitude:info.geometry.location.lng}}))
        dispatch(setShowCityPicker(false));
      }
      
    } catch (error) {
      console.log(error)
    }
  }

  const detectUserLocation = async() => {
    try {
      setDetectingLocation(true)
      let location = await getCurrentLocation();
      console.log('location', location)
      let response = await axios.post(`${API_URL}/utility/validate-geo?lat=${location.latitude}&lng=${location.longitude}&cityId=${bookingState.selectedCity.id}`)
      console.log('response', response.data)
      const { info, city, isCityChanged, isPlaceValid } = response.data;
      if (isCityChanged) {
        setShowLocationSearch(false)
        setShowCityChange({info:{name:info.formatted_address,place_id:info.place_id,latitude:info.geometry.location.lat,longitude:info.geometry.location.lng},city:city});
      } else if (!isPlaceValid) {
        setShowLocationSearch(false)
        setShowLocationValid(true);
      } else {
        dispatch(setShowCityPicker(false));
        dispatch(setShowCityLocation({selectedCity:city,selectedLocation:{name:info.formatted_address,place_id:info.place_id,latitude:info.geometry.location.lat,longitude:info.geometry.location.lng}}))
      }
      setDetectingLocation(false)
    } catch (error) {
      console.log(error)
      setDetectingLocation(false)
      notify('Failed to detect location');
    }
  }

  return (
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <ScrollView style={styles.modalContent}>

        <TouchableHighlight underlayColor='#2C2C2E' onPress={() => setShowLocationSearch(true)}>
            <View style={{flexDirection: 'row', backgroundColor: '#1c1c1e', padding: 12, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'space-between', marginBottom: 12, width: '100%',alignItems: 'center'}}>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flex: 1, marginRight: 8}}>
                <FeatherIcon name="map-pin" size={22} color="#a3a3a3" />
                <CustomText numberOfLines={2} ellipsizeMode='tail' weight='Medium' style={{color: '#a3a3a3', fontSize: 12, marginLeft: 12, flexShrink: 1}}>
                  {detectingLocation ? 'Detecting Location...' : bookingState.selectedLocation ? bookingState.selectedLocation.name : bookingState.selectedCity ? bookingState.selectedCity.name : 'Selected Location'}
                </CustomText>
              </View>
              <View>
                <TouchableHighlight disabled={detectingLocation} underlayColor='#2f2f2f' onPress={()=>detectUserLocation()} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2d2d2d', borderRadius: 8, padding: 2, shadowOpacity: 0.5, shadowRadius: 1, shadowColor: '#454545', height: 48, width: 48}}>
                  <Icon name="locate-outline" size={20} color={BRAND_COLOR} />
                </TouchableHighlight>
              </View>
            </View>
        </TouchableHighlight>
        
          <Calendar
            style={styles.calendar}
            theme={{
              calendarBackground: '#1c1c1e',
              
              textSectionTitleColor: '#fff',
              dayTextColor: '#fff',
              textSectionTitleColor:' #fff',
              todayTextColor: '#EDBF31',
              selectedDayTextColor: '#000',
              monthTextColor: '#fff',
              textDayFontFamily: 'Inter-Medium',
              textMonthFontFamily: 'Inter-Medium',
              textDayHeaderFontFamily: 'Inter-SemiBold',
              textDayHeaderColor: '#a3a3a3',
              textDayHeaderFontSize: 12,
              textDayHeaderTextTransform: 'uppercase',
              textDayFontSize: 13,
              textMonthFontSize: 12,
              monthFontTextTransform: 'uppercase',
              textDisabledColor: '#444',
              arrowColor: '#EDBF31'
            }}
            minDate={new Date().toISOString().split('T')[0]}
            markingType={'period'}
            markedDates={markedDates}
            onDayPress={onDayPress}
          />

        <View style={{flex: 1,flexDirection: 'column'}}>
          <View style={styles.timePickerContainer}>
            <CustomText fontType='primary' weight='ExtraBold' style={styles.timePickerLabel}>Start Time</CustomText>
            <View style={{overflow: 'hidden',backgroundColor: '#1c1c1e',borderRadius: 8,padding: 8,paddingHorizontal: 0}}>

            <FlatList
              horizontal
              data={startTimeSlots}
              keyExtractor={(item) => item.value.toString()}
              // style={{}}
              // snapToOffsets={[...Array(startTimeSlots.length).fill(100)]}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => onSelectStartTime(item.value)} style={{backgroundColor: item.value === startTime ? '#EDBF311e' : '#1c1c1e',borderRadius: 24,marginHorizontal: 5}}>
                  <CustomText weight='Medium' style={[
                    styles.timeSlot,
                    item.value === startTime && styles.selectedTimeSlot
                  ]}>
                    {item.label}
                  </CustomText>
                </TouchableOpacity>
              )}
              // snapToAlignment="center"
              decelerationRate="fast"
              // snapToInterval={50}
              showsHorizontalScrollIndicator={false}
              />
              </View>
          </View>

          <View style={styles.timePickerContainer}>
            <CustomText fontType='Primary' weight='ExtraBold' style={styles.timePickerLabel}>End Time</CustomText>
            <View style={{overflow: 'hidden',backgroundColor: '#1c1c1e',borderRadius: 8,padding: 8,paddingHorizontal: 0}}>

            <FlatList
              horizontal
              data={endTimeSlots}
              style={{height: 36}}
              keyExtractor={(item) => item.value.toString()}
              // style={{height: 100}}
              // snapToOffsets={[...Array(startTimeSlots.length).fill(100)]}
              renderItem={({ item }) => (
                <TouchableOpacity style={{backgroundColor: item.value === endTime ? '#EDBF311e' : '#1c1c1e',borderRadius: 24,marginHorizontal: 5}} onPress={() => setEndTime(item.value)}>
                  <Text style={[
                    styles.timeSlot,
                    item.value === endTime && styles.selectedTimeSlot
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              // snapToAlignment=""
              decelerationRate="fast"
              // snapToInterval={100}
              showsHorizontalScrollIndicator={false}
              />
              </View>
          </View>

          </View>
            
     
          </ScrollView>

          <TouchableOpacity 
            style={[
              styles.confirmButton,
              (!startDate || !endDate || !startTime || !endTime) && styles.confirmButtonDisabled
            ]} 
            onPress={handleConfirm}
            disabled={!startDate || !endDate || !startTime || !endTime}
          >
            <CustomText weight='Bold' style={styles.confirmButtonText}>Save Dates</CustomText>
          </TouchableOpacity>
        {showLocationSearch && <LocationSearchScreen onPress={onLocationPress} show={showLocationSearch} setShow={setShowLocationSearch}/>}
        {showCityChange && <LocationChangeNotificationScreen show={showCityChange} setShow={setShowCityChange} onPress={(data,city)=>{
          console.log('on click data',city)
          dispatch(setShowCityLocation({
            selectedCity: city,
            selectedLocation: {name:data.name,place_id:data.place_id,latitude:data.latitude,longitude:data.longitude}
          }))
          setShowCityChange(false)
        }}/>}
        {showLocationValid && <LocationInvalidScreen show={showLocationValid} setShow={setShowLocationValid} onPress={()=>{
          setShowLocationValid(false)
        }}/>}
      </View>
  );
}




const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#000',
    // height: '100%',
    flex: 1,
    paddingHorizontal:20,
    paddingVertical:12
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  calendar: {
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    // height: 330,
    borderColor: '#000',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeSection: {
    // flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 14,
    color: '#a3a3a3',
    marginBottom: 10,
  },
  pickerButton: {
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 10,
  },
  pickerButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  confirmButton: {
    position:'absolute',
    bottom:0,
    left:0,
    right:0,
    backgroundColor: '#EDBF31',
    padding: 15,
    marginHorizontal:16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#4C4C4E',
  },
  confirmButtonText: {
    color: '#000',
    textTransform: 'uppercase',
    fontSize: 12,
  },
  timePickerContainer: {
    marginBottom: 20,
    width: '100%',
  },
  timePickerLabel: {
    color: '#757575',
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  timeSlot: {
    // borderWidth: 1,
    // borderColor: '#2C2C2E',
    color: '#a3a3a3',
    // backgroundColor: '#2C2C2E',
    padding: 10,
    borderRadius: 5,
    fontSize: 12,
    marginHorizontal: 5,
  },
  selectedTimeSlot: {
    color: BRAND_COLOR,
  },
});
