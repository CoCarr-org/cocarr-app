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
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { setDates, setSelectedCity, setShowCityLocation, setShowCityPicker } from '../../../store/bookingSlice';
import CustomText from '../../../components/CustomText';
import { API_URL } from '../../../utils/constants';
import axios from 'axios';
import { getCurrentLocation, photoUrl, notify } from '../../../utils/utils';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';

import { C, themedStyleSheet } from '../../../theme';

export function CreateScheduleScreen({ route }) {
    const vehicleId = route.params?.vehicleId || '';
    // Pre-select the car when opened from a specific car's Availability tab.
    const [scheduleInfo, setScheduleInfo] = useState({vehicleId:vehicleId,startTime:'',endTime:''});
  const [startDate, setStartDate] = useState(scheduleInfo.startTime ? new Date(scheduleInfo.startTime) : new Date());
  const [endDate, setEndDate] = useState(scheduleInfo.endTime ? new Date(scheduleInfo.endTime) : new Date());
  const [startTime, setStartTime] = useState(scheduleInfo.startTime ? new Date(scheduleInfo.startTime) : new Date());
  const [endTime, setEndTime] = useState(scheduleInfo.endTime ? new Date(scheduleInfo.endTime) : new Date());
  const [markedDates, setMarkedDates] = useState({});
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [startTimeSlots, setStartTimeSlots] = useState([]);
  const [endTimeSlots, setEndTimeSlots] = useState([]);
  const from = useRoute().params?.from || 'page';
  const [cars, setCars] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const carsPickerRef = useRef(null);  
  const [submitLoading, setSubmitLoading] = useState(false);

  
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
      headerTitle: 'Create Schedule',
      headerTitleAlign: 'center',
      headerTitleStyle: {
        color: C.text,
        fontSize: 13,
        fontWeight: '500',
      },
      headerLeft: () => <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="chevron-back" size={20} color={C.textSecondary} /></TouchableOpacity>,
      headerStyle: {
        backgroundColor: C.background,
      },
      headerTintColor: C.text,
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
    
    marked[startStr] = {
      startingDay: true,
      color: C.primaryText,
      textColor: C.onPrimary
    };
    
    if (startStr !== endStr) {
      marked[endStr] = {
        endingDay: true,
        color: C.primaryText,
        textColor: C.onPrimary
      };
      
      // Mark dates in between
      let currentDate = new Date(start);
      currentDate.setDate(currentDate.getDate() + 1);
      
      while (currentDate < end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        marked[dateStr] = {
          color: C.primaryText,
          textColor: C.onPrimary
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    setMarkedDates(marked);
  };
  const onDayPress = (day) => {
    const selectedDate = new Date(day.dateString);
    
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(selectedDate);
      setEndDate(null);
      setMarkedDates({
        [day.dateString]: {
          startingDay: true,
          color: C.primaryText,
          textColor: C.onPrimary
        }
      });
    } else {
      // Complete the range
      if (selectedDate >= startDate) {
        setEndDate(selectedDate);
        updateMarkedDates(startDate, selectedDate);
      } else {
        setStartDate(selectedDate);
        setEndDate(null);
        setMarkedDates({
          [day.dateString]: {
            startingDay: true,
            color: C.primaryText,
            textColor: C.onPrimary
          }
        });
      }
    }
  };

  const handleConfirm = async() => {
    try {
      // Combine dates and times
      setSubmitLoading(true)
      const startDateTime = new Date(startDate);
      startDateTime.setHours(new Date(startTime).getHours(), new Date(startTime).getMinutes());
      
      const endDateTime = new Date(endDate);
      endDateTime.setHours(new Date(endTime).getHours(), new Date(endTime).getMinutes());
      
      let res = await axios.post(`${API_URL}/host/schedule`,{
        vehicleId:scheduleInfo.vehicleId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString()
      })
      navigation.navigate('ScheduleInfo',{scheduleId:res.data.schedule.id});
    } catch (error) {
      setSubmitLoading(false)
      console.log('error',error.response.data)
      notify(error.response.data?.error || 'Something went wrong')
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


  const getMyCars = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API_URL}/host/vehicles?limit=${50}`);
      setCars(response.data.vehicles ? response.data.vehicles : [])
      setRefreshing(false);
    } catch (error) {
      console.log('error',error)
      setRefreshing(false);
      Alert.alert('Error',error.message)
    }
  }

  useEffect(()=>{
    getMyCars()
  },[])

  const handleCarSelect = (car) => {
    setScheduleInfo(prev => ({...prev,vehicleId:car.id}))
    carsPickerRef.current?.hide()
  }
  

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
      
      <TouchableOpacity onPress={() => carsPickerRef.current?.show()} style={{flexDirection:'row',  alignContent:"center",paddingHorizontal:16,paddingVertical:12,backgroundColor:C.surface,borderRadius:10,padding:12,width:'100%',marginBottom:12}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center',alignContent:"center",width:'100%'}}>
          <View>
              <CustomText fontType='primary' weight='Bold' style={{color:C.textTertiary, fontSize: 11,marginBottom:2,textTransform:'uppercase'}}>Selected Car</CustomText>
              <CustomText fontType='primary' weight='Bold' style={{color:C.text, fontSize:11,textTransform:'uppercase'}}>{cars.find(car => car.id === scheduleInfo.vehicleId)?.vehicleName || '-'}</CustomText>
          </View>
          <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
              <Icon name="chevron-down" size={16} color={C.textTertiary} />
          </View>
      </View>
    </TouchableOpacity>

        <Calendar
          style={styles.calendar}
          theme={{
            calendarBackground: C.surface,
            
            textSectionTitleColor: C.text,
            dayTextColor: C.text,
            textSectionTitleColor:C.text,
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
          minDate={new Date().toISOString().split('T')[0]}
          markingType={'period'}
          markedDates={Object.keys(markedDates).reduce((acc, date) => {
            acc[date] = {
              ...markedDates[date],
              ...(startDate && endDate && startDate.toDateString() === endDate.toDateString() ? { borderRadius: 8 } : {})
            };
            return acc;
          }, {})}
          onDayPress={onDayPress}
        />

      <View style={{flex: 1,flexDirection: 'column'}}>
        <View style={styles.timePickerContainer}>
          <CustomText fontType='primary' weight='ExtraBold' style={styles.timePickerLabel}>Start Time</CustomText>
          <View style={{overflow: 'hidden',backgroundColor: C.surface,borderRadius: 8,padding: 8,paddingHorizontal: 0}}>

          <FlatList
            horizontal
            data={startTimeSlots}
            keyExtractor={(item) => item.value.toString()}
            // style={{}}
            // snapToOffsets={[...Array(startTimeSlots.length).fill(100)]}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => setStartTime(item.value)} style={{backgroundColor: item.value === startTime ? '#EDBF311e' : C.surface,borderRadius: 24,marginHorizontal: 5}}>
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
          <View style={{overflow: 'hidden',backgroundColor: C.surface,borderRadius: 8,padding: 8,paddingHorizontal: 0}}>

          <FlatList
            horizontal
            data={endTimeSlots}
            style={{height: 36}}
            keyExtractor={(item) => item.value.toString()}
            // style={{height: 100}}
            // snapToOffsets={[...Array(startTimeSlots.length).fill(100)]}
            renderItem={({ item }) => (
              <TouchableOpacity style={{backgroundColor: item.value === endTime ? '#EDBF311e' : C.surface,borderRadius: 24,marginHorizontal: 5}} onPress={() => setEndTime(item.value)}>
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
          
   

        <TouchableOpacity 
          style={[
            styles.confirmButton,
            (!startDate || !endDate || !startTime || !endTime || !scheduleInfo.vehicleId) && styles.confirmButtonDisabled
          ]} 
          onPress={handleConfirm}
          disabled={!startDate || !endDate || !startTime || !endTime || !scheduleInfo.vehicleId}
        >
          <CustomText weight='Bold' style={styles.confirmButtonText}>Create Schedule</CustomText>
        </TouchableOpacity>
      </View>
      <ActionSheet ref={carsPickerRef} containerStyle={{backgroundColor:C.surface,height:'50%'}} height={'50%'} safeAreaInsets={{bottom:0}}>
          <ScrollView style={{paddingVertical:24}}>
          {
          cars.length > 0 && cars.map((car, index) => (
          <TouchableHighlight underlayColor={C.background} style={{borderRadius:8,paddingHorizontal:12,paddingVertical:4}} key={index} onPress={() => handleCarSelect(car)}>
              <View style={{flexDirection:'row', justifyContent:'flex-start', alignItems:'center',alignContent:"center",width:'100%',marginVertical:8}}>
                  <View>
                      {car.images[0]?.url ? (
                        <Image source={{uri:photoUrl(car.images[0].url)}} style={{width:48, height:48, borderRadius:4,backgroundColor:C.surfaceHigh,position:'relative'}}/>
                      ) : null}
                  </View>
                  <View style={{flexDirection:'column', justifyContent:'center', alignItems:'center',paddingLeft:12}}>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary, fontSize:11,letterSpacing:-.15}}>{car.vehicleNumber}</CustomText>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:C.text, fontSize:11,letterSpacing:-.15}}>{car.vehicleName}</CustomText>
                  </View>
              </View>
          </TouchableHighlight>
          ))
          }
          </ScrollView>
      </ActionSheet>

    </View>
  );
}




const styles = themedStyleSheet(C => ({
  modalContainer: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: C.background,
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

