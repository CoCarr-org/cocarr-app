import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, FlatList, Image, TextInput, Alert, ActivityIndicator, ToastAndroid, ScrollView } from 'react-native';

import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../utils/constants';

import CustomText from '../../components/CustomText';
import { formatDate, notify } from '../../utils/utils';
import { Calendar } from 'react-native-calendars';
import Header from '../../components/CenterHeader';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RazorpayCheckout from 'react-native-razorpay';
import { useNavigation } from '@react-navigation/native';

export function RescheduleScreen({route}) {
//   const bookingInfo = showReschedule;
const {id} = route.params;
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [startDate,setStartDate] = useState(new Date());
  const navigation = useNavigation();
  const [startTime,setStartTime] = useState(new Date());
  const [markedDates,setMarkedDates] = useState({});
  const [startTimeSlots,setStartTimeSlots] = useState([]);
  const [submitting,setSubmitting] = useState(false);
  const [showPaymentResult,setShowPaymentResult] = useState(null);

  useEffect(() => {
    async function getRescheduleSummary() {
        try
        {
            const response = await axios.post(`${API_URL}/booking/reschedule-summary/${id}`);
            console.log(response.data);
            setBooking(response.data);
            setIsLoading(false);
        }
        catch(error)
        {
            setIsLoading(false);
            // setShowReschedule(null);
            notify('Error', error.message);
        }
    }
    getRescheduleSummary();
  }, []);


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
  const onDayPress = (day) => {
    const selectedDate = new Date(day.dateString);
    setStartDate(selectedDate);
    setMarkedDates({
      [day.dateString]: {
        selected: true,
        color: '#EDBF31',
        textColor: '#000'
      }
    });
  };

    useEffect(() => {
        generateStartTimeSlots(startDate);
      }, [startDate]);


    //   const handleConfirmation = async() => {
    //     try {
    //         const response = await axios.post(`${API_URL}/booking/initiate-reschedule/${id}`,{
    //             startDate:startDate,
    //             startTime:startTime
    //         });
    //         console.log(response.data);
    //     } catch (error) {
    //         ToastAndroid.show('Error', error.message);
    //     }
    //   }

      const handleConfirmation = async () => {
        try {
            setSubmitting(true);
          const startDateTime = new Date(startDate);
          startDateTime.setHours(new Date(startTime).getHours(), new Date(startTime).getMinutes());
          const startTimeUnix = Math.floor(startDateTime.getTime() / 1000);
          const response = await axios.post(`${API_URL}/booking/initiate-reschedule/${id}`,{startTime:startTimeUnix});
          await handlePayment(response.data.amount,response.data.orderId,response.data.prefills,response.data.rescheduleId)
        } catch (err) {
            setSubmitting(false);
          console.log('error',err)
        //   ToastAndroid.show(err.response?.data?.error?.message);
        }
      }
    
    
      const handlePayment = async (amount,orderId,prefills,rescheduleId) => {
        try {
          
          const options = {
            name: 'Coccarr',
            description: 'Car Reschedule Payment',
            currency: 'INR',
            order_id: orderId,
            "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information, especially their phone number
              "name": prefills.name, //your customer's name
              "email": prefills.email, 
              "contact": prefills.contactNumber  //Provide the customer's phone number for better conversion rates 
          },
            key: 'rzp_test_Z3US7Xs7SFtOHg', // Replace with your Razorpay key
            amount: amount * 100, 
            theme: { color: '#EDBF31' }
          };
    
          const paymentData = await RazorpayCheckout.open(options);
          setShowPaymentResult({message:'',status:'pending',loading:true});
          
          // Handle successful payment
          if (paymentData.razorpay_payment_id) {
            // Make API call to your backend to verify payment
            const response = await axios.post(`${API_URL}/booking/confirm-reschedule`,{paymentId:paymentData.razorpay_payment_id,orderId:paymentData.razorpay_order_id,signature:paymentData.razorpay_signature,rescheduleId:rescheduleId})
    
            
            setShowPaymentResult({message:'Your payment has been processed and reschedule is confirmed',status:'success',loading:false});
    
              setTimeout(() => {
                setShowPaymentResult(null);
                navigation.navigate('RideInfo',{bookingId:booking.bookingId});
              }, 2000);
            // }
          }
        } catch (error) {
            console.log('error',error)
          if (error.code === 'PAYMENT_CANCELLED') {
            setShowPaymentResult({message:'Payment Cancelled',status:'failed',loading:false});
          } else {
            setShowPaymentResult({message:'Payment Failed',status:'failed',loading:false});
            console.error('Payment Error:', error);
          }
        }
      };

  return   <View style={{flex:1,backgroundColor:'#000'}}>
    {/* Header (back + "Reschedule") is the shared stack header — the previous
        in-screen Header had no navigation prop so its back button did nothing. */}
   { isLoading ? <ActivityIndicator size="large" color={BRAND_COLOR} /> :  <ScrollView contentContainerStyle={{paddingHorizontal:16}}>

        <View style={{flexDirection:'row',backgroundColor:'#101012',borderRadius:10,paddingVertical:12,marginVertical:8,paddingHorizontal:16}}>
            <View >
                <Text style={{...styles.vehicleName,fontSize:12}}>{booking.vehicle?.brand?.name} {booking.vehicle?.vehicleName}</Text>
                <Text style={{textTransform:'capitalize',fontSize:12}}>{booking.vehicle?.vehicleFuelType} · {booking.vehicle?.vehicleSeats} Seater · {booking.vehicle?.vehicleYear}</Text>
                <Text style={{...styles.headerPrimaryText,fontSize:12}}>{formatDate(booking.startTime,'long')} - {formatDate(booking.endTime,'long')}</Text>
            </View>
        </View>
                  <Calendar
            style={styles.calendar}
            theme={{
              calendarBackground: '#101012',
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
              arrowColor: '#EDBF31',
              selectedDayBackgroundColor: '#EDBF31'
            }}
            minDate={new Date().toISOString().split('T')[0]}
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
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setStartTime(item.value)} style={{backgroundColor: item.value === startTime ? '#EDBF311e' : '#1c1c1e',borderRadius: 24,marginHorizontal: 5}}>
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
            
              
          </ScrollView>  }
          <View style={{paddingHorizontal:16,paddingBottom:16}}>
            <CustomText weight='Medium' style={{color:BRAND_COLOR,fontSize:12,paddingBottom:8,textAlign:'center'}}>Reschedule fee: {booking?.rescheduleFee ? `₹${booking?.rescheduleFee}` : ''}</CustomText>
          <TouchableOpacity 
            style={[
              styles.confirmButton,
              (!startDate || !startTime || submitting) && styles.confirmButtonDisabled
            ]} 
            onPress={handleConfirmation}
            disabled={!startDate || !startTime || submitting}
          >
            <CustomText weight='Bold' style={styles.confirmButtonText}>Reschedule and Pay</CustomText>
          </TouchableOpacity>
          </View>
          {showPaymentResult ? <PaymentResultPopup response={showPaymentResult} /> : null}
          </View>
}


const PaymentResultPopup = ({response}) => {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000',position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:1000}}>
        {!response.loading ? <View style={{alignItems:'center',justifyContent:'center'}}>
          <View style={{borderRadius:24,padding:12}}>
            <Ionicons name={response.status === 'success' ? "checkmark-circle" : "close-circle-outline"} size={80} color={response.status === 'success' ? BRAND_COLOR : response.status === 'failed' ? '#ff0000' : '#a3a3a3'} />
          </View>
          <CustomText fontType='primary' weight='Medium' style={{color:response.status === 'success' ? BRAND_COLOR : response.status === 'failed' ? '#ff0000' : '#a3a3a3',fontSize:16,textAlign:'center',maxWidth:'70%',marginHorizontal:'auto',marginTop:20}}>{response ? response.status === 'success' ? 'Payment Successful' : 'Payment Failed' : 'Payment Result'}</CustomText>
          <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3',fontSize:13,textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',marginTop:8}}>{response.message}</CustomText>
        </View> : <ActivityIndicator size="large" color={BRAND_COLOR} />}
      </View>
    )
  }




const styles = StyleSheet.create({
  modalContainer: {
    paddingTop:24,
    paddingHorizontal:24,
    // minHeight:'45%',
    // flex:1,
    // alignItems:'space-between',
    // flex: 1,
    // paddingHorizontal:16,
    // paddingVertical:16,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    // justifyContent: 'flex-end',
  },
  contentContainer: {
    flex: 1,
    // height:'100%',
    paddingHorizontal:24,
    paddingVertical:24
  },
  modalContent: {
    // backgroundColor: '#000',
    height: '100%',
    flex: 1,
    paddingHorizontal:24,
    paddingVertical:24
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  calendar: {
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor:'#101012',
    // height: 330,
    borderColor: '#000',
  },
  cityItem: {
    flexDirection:'row',
    alignItems:'center',
    gap:12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    textAlign:'left',
    textTransform:'capitalize',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  confirmButton: {
    backgroundColor: '#EDBF31',
    padding: 12,
    borderRadius: 6,
    // flex:1,
    // width:'50%',
    // alignItems: 'center',
    color:'#fff'
  },
  backButton: {
    backgroundColor: '#1f1f1f',
    padding: 12,
    borderRadius: 6,
    flex:1,
    // width:'50%',
    // alignItems: 'center',
    color:'#fff'
  },
  confirmButtonDisabled: {
    backgroundColor: '#4C4C4E',
    color:'#a3a3a3'
  },
  confirmButtonText: {
    // color: '#000',
    fontSize: 12,
    fontWeight: '500',
    textTransform:'uppercase',
    textAlign:'center'
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

