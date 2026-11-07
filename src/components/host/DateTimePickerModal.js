import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  FlatList,
  TouchableHighlight,
  ToastAndroid,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
import { API_URL } from '../../utils/constants';
import axios from 'axios';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';

import { C, themedStyleSheet } from '../../theme';

export function DateTimePickerModal({ show,setShow,setData,type='start' }) {
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const navigation = useNavigation();
  const [markedDates, setMarkedDates] = useState({});
  const [startTimeSlots, setStartTimeSlots] = useState([]);
  const [cars, setCars] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const actionsheetRef = useRef(null);  

    
  // Round time to nearest 30 minutes
  const roundToNearestFive = (date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.round(minutes/5) * 5;
    const newDate = new Date(date);
    newDate.setMinutes(roundedMinutes, 0, 0);
    return newDate;
  };

  useEffect(() => {
    // Initialize with rounded current time

    const now = new Date();
    const rounded = roundToNearestFive(now);
    // setStartTime(rounded);

    // Initialize calendar marked dates
    updateMarkedDates(now);
  }, []);

  const updateMarkedDates = (start) => {
    const marked = {};
    const startStr = start.toISOString().split('T')[0];
    
    marked[startStr] = {
      startingDay: true,
      color: C.primaryText,
      textColor: C.onPrimary
    };
    
    setMarkedDates(marked);
  };

  const onDayPress = (day) => {
    const selectedDate = new Date(day.dateString);
    const now = new Date();
    
    if (selectedDate > now) {
      ToastAndroid.show('Please select a valid date', ToastAndroid.SHORT);
      return;
    }
    
    setStartDate(selectedDate);
    setMarkedDates({
      [day.dateString]: {
        startingDay: true,
        color: C.primaryText,
        textColor: C.onPrimary
      }
    });
  };

  const handleConfirm = async() => {
    try {
      // Combine dates and times
      const startDateTime = new Date(startDate);
      startDateTime.setHours(new Date(startTime).getHours(), new Date(startTime).getMinutes());

      // Update endDateTime field in setData
      setData(startDateTime.toISOString());
      setShow(false)
    } catch (error) {
      console.log('error',error)
      ToastAndroid.show(error || 'Something went wrong',ToastAndroid.SHORT)
    }
  };

  const generateStartTimeSlots = (startDate) => {
    console.log('generate start slots', startDate);
    const startSlots = [];
    const now = new Date();

    const generateSlots = (startHour, date) => {
      const slots = [];
      for (let i = startHour; i >= 0; i--) {
        for (let j = 0; j < 60; j += 5) {
          const hour12 = i % 12 === 0 ? 12 : i % 12;
          const period = i < 12 ? 'AM' : 'PM';
          const label = `${hour12 < 10 ? '0' : ''}${hour12}:${j < 10 ? '0' : ''}${j} ${period}`;
          const value = new Date(date);
          value.setHours(i, j);
          slots.push({ label, value: value.toISOString() });
        }
      }
      return slots;
    };

    startSlots.push(...generateSlots(23, startDate));

    setStartTimeSlots(startSlots);
    setStartTime();
  };

  useEffect(() => {
    generateStartTimeSlots(startDate);
  }, [startDate]);

  useEffect(()=>{
    if(show){
      actionsheetRef.current.show();
    }
    else{
      actionsheetRef.current.hide();
    }
  },[show])

  return (
    <ActionSheet onClose={() => setShow(false)} ref={actionsheetRef} containerStyle={{ backgroundColor: C.surface, minHeight: '50%', maxHeight: '50%' }}>
      <View style={{ flexDirection: 'column'}}>
        <View style={styles.modalContent}>
          <Calendar
            style={styles.calendar}
            theme={{
              calendarBackground: C.surfaceLow,
              borderColor: C.border,
              textSectionTitleColor: C.text,
              dayTextColor: C.text,
              textSectionTitleColor: C.text,
              todayTextColor: C.primaryText,
              selectedDayTextColor: C.onPrimary,
              monthTextColor: C.text,
              textDayHeaderColor: C.textSecondary,
              textDayHeaderFontSize: 12,
              textDayHeaderTextTransform: 'uppercase',
              textDayFontSize: 13,
              textMonthFontSize: 12,
              monthFontTextTransform: 'uppercase',
              textDisabledColor: C.textDisabled,
              arrowColor: C.primaryText
            }}
            maxDate={new Date().toISOString().split('T')[0]}
            minDate={new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0]}
            markingType={'single'}
            markedDates={Object.keys(markedDates).reduce((acc, date) => {
              acc[date] = {
                ...markedDates[date],
                ...(startDate && startDate.toDateString() === date ? { borderRadius: 8 } : {})
              };
              return acc;
            }, {})}
            onDayPress={onDayPress}
          />

          <View style={{ flexDirection: 'column', height: 100 }}>
            <View style={styles.timePickerContainer}>
              <CustomText fontType='primary' weight='ExtraBold' style={styles.timePickerLabel}>Start Time</CustomText>
              <View style={{ overflow: 'hidden', backgroundColor: C.surfaceLow, borderRadius: 8, padding: 8, paddingHorizontal: 0 }}>

                <FlatList
                  horizontal
                  data={startTimeSlots}
                  keyExtractor={(item) => item.value.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setStartTime(item.value)} style={{ backgroundColor: item.value === startTime ? '#EDBF311e' : C.surface, borderRadius: 24, marginHorizontal: 5 }}>
                      <CustomText weight='Medium' style={[
                        styles.timeSlot,
                        item.value === startTime && styles.selectedTimeSlot
                      ]}>
                        {item.label}
                      </CustomText>
                    </TouchableOpacity>
                  )}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmButton,
            ]}
            onPress={handleConfirm}
          >
            <CustomText weight='Bold' style={styles.confirmButtonText}>Submit Date and Time</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </ActionSheet>
  );
}




const styles = themedStyleSheet(C => ({
  modalContainer: {
    flexDirection: 'column',
    // flex: 1,
    // height:'100%',
    // backgroundColor: 'rgba(0,0,0,0.5)',
    // justifyContent: 'flex-end',
  },

  modalContent: {
    // backgroundColor: '#000',
    // height: '100%',
    // flex: 1,
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
    color: C.text,
  },

  closeButton: {
    padding: 5,
  },

  calendar: {
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    // height: 30,
    borderColor: C.background,
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
    color: C.textSecondary,
    marginBottom: 10,
  },

  pickerButton: {
    backgroundColor: C.surfaceHigh,
    padding: 15,
    borderRadius: 10,
  },

  pickerButtonText: {
    color: C.text,
    fontSize: 16,
    textAlign: 'center',
  },

  confirmButton: {
    backgroundColor: C.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },

  confirmButtonDisabled: {
    backgroundColor: C.surfaceHighest,
  },

  confirmButtonText: {
    color: C.onPrimary,
    textTransform: 'uppercase',
    fontSize: 12,
  },

  timePickerContainer: {
    marginBottom: 20,
    width: '100%',
    height: 100,
    flex: 1,
  },

  timePickerLabel: {
    color: C.textTertiary,
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  timeSlot: {
    // borderWidth: 1,
    // borderColor: '#2C2C2E',
    color: C.textSecondary,
    // backgroundColor: '#2C2C2E',
    padding: 10,
    borderRadius: 5,
    fontSize: 12,
    marginHorizontal: 5,
  },

  selectedTimeSlot: {
    color: C.primaryText,
  }
}));

