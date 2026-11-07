import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';
import CustomText from '../../components/CustomText';
import axios from 'axios';
import { addHoursToDate, formatDate, showToast } from '../../utils/utils';
import { API_URL } from '../../utils/constants';
import RazorpayCheckout from 'react-native-razorpay';

import { C, themedStyleSheet } from '../../theme';

export default function ExtensionPopup({ setShowPaymentResult, setShow, show, booking,getBookingInfo }) {
  const [data, setData] = useState({ dateTime: '', hours: '' });
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateTime, setDateTime] = useState(new Date());
  const [extensionAllowed, setExtensionAllowed] = useState(false);
  const [extensionInfo, setExtensionInfo] = useState({ isAvailable: false, totalAmount: '' });
  const actionSheetRef = useRef(null);

  useEffect(() => {
    if (data.hours) {
      let newTime = addHoursToDate(booking.endTime, data.hours);
      setData(prev => ({ ...prev, dateTime: newTime }));
    }
  }, [data.hours]);

  useEffect(() => {
    if(show) actionSheetRef.current.show();
  }, [show]);





  useEffect(() => {
    setExtensionInfo(prev => ({ ...prev, totalAmount: 0 }));
    setExtensionAllowed(false);
  }, [data.hours]);

  const checkExtension = async () => {
    try {
      setSubmitting(true);
      let res = await axios.post(`${API_URL}/booking/extension-summary/${booking.bookingId}`, { hoursToExtend: data.hours });
      if (res.data.isAvailable) {
        setExtensionAllowed(true);
        setExtensionInfo({ isAvailable: true, totalAmount: res.data.totalAmount });
        setSubmitting(false);
      } else {
        showToast('error', 'Couldn\'t allow', res.data.error.message);
      }
    } catch (error) {
      setSubmitting(false);
      setLoading(false);
      console.log(error.response.data);
      showToast('error', 'Couldn\'t allow', error.response.data.error.message);
    }
  };



  const handlePayment = async (amount,orderId,prefills) => {
    try {
      
      const options = {
        name: 'Coccarr',
        description: 'Car Rental Payment',
        image: 'https://your-app-logo.png',
        currency: 'INR',
        order_id: orderId,
        "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information, especially their phone number
          "name": prefills.name, //your customer's name
          "email": prefills.email, 
          "contact": prefills.contactNumber  //Provide the customer's phone number for better conversion rates 
      },
        key: 'rzp_test_Z3US7Xs7SFtOHg', // Replace with your Razorpay key
        amount: amount * 100, 
        theme: { color: C.primaryText }
      };

      const paymentData = await RazorpayCheckout.open(options);
      setShowPaymentResult({message:'',status:'pending',loading:true});
      // Handle successful payment
      if (paymentData.razorpay_payment_id) {
        setShow(false);   
        setShowPaymentResult({message:'Your payment has been processed and your ride is confirmed',status:'success',loading:false});
        // Make API call to your backend to verify payment
        const response = await axios.post(`${API_URL}/booking/extension/confirm`,{paymentId:paymentData.razorpay_payment_id,orderId:paymentData.razorpay_order_id,signature:paymentData.razorpay_signature})
        await getBookingInfo();
        setTimeout(() => {
          setShowPaymentResult(null);
        }, 2000);
      }
    } catch (error) {
      if (error.code === 'PAYMENT_CANCELLED') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment');
      } else {
        Alert.alert('Payment Failed', 'There was an error processing your payment');
        console.error('Payment Error:', error);
      }
    }
  };

  const initiateExtension = async () => {
    try {
      setSubmitting(true);
      let res = await axios.post(`${API_URL}/booking/extension/${booking.bookingId}`, { hoursToExtend: data.hours });
      await handlePayment(res.data.amount, res.data.orderId, res.data.prefills);
      setSubmitting(false);
    } catch (error) {
      setSubmitting(false);
      setLoading(true);
      if (error.response) {
        Alert.alert(error.response.data.error.code);
      } else if (error.request) {
        console.log('Error request:', error.request);
      } else {
        console.log('Error message:', error.message);
      }
    }
  };

  const onClose = () => {
    setShow(false);
  };

  return (
    <ActionSheet
      ref={actionSheetRef}
      containerStyle={{backgroundColor:C.surface}}
      isVisible={show}
      onClose={onClose}
    >
      <View style={styles.modalContainer}>
        {!loading ? (
          <>
            <View style={styles.header}>
              <CustomText fontType='primary' weight='Bold' style={styles.headerText}>Extend Ride</CustomText>
            </View>
            <ScrollView style={styles.contentContainer}>
              <View style={styles.formGroup}>
                <CustomText fontType='primary' weight='Regular' style={styles.label}>Select Hours to extend</CustomText>
                <TimeTab options={[{ value: 3, label: '3H' }, { value: 6, label: '6H' }, { value: 9, label: '9H' }, { value: 12, label: '12H' }, { value: 24, label: '1D' }, { value: 48, label: '2D' }]} value={data.hours} onChange={(value) => setData(prev => ({ ...prev, hours: value }))} />
              </View>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:16}}>
                <View style={styles.formGroup}>
                    <CustomText fontType='primary' weight='Bold' style={styles.label}>Existing End Time</CustomText>
                    <CustomText fontType='primary' weight='Regular' style={styles.value}>{formatDate(booking.endTime,'long')}</CustomText>
                </View>
                <View style={styles.formGroup}>
                    <CustomText fontType='primary' weight='Bold' style={styles.label}>Extended End Time</CustomText>
                    <CustomText fontType='primary' weight='Regular' style={styles.value}>{data.dateTime ? formatDate(data.dateTime,'long') : '-'}</CustomText>
                </View>
              </View>
              {extensionInfo.totalAmount ? (
                <View style={styles.formGroup}>
                  <CustomText fontType='primary' weight='Bold' style={styles.label}>Total Amount to Pay</CustomText>
                  <CustomText fontType='primary' weight='Regular' style={styles.value}>{extensionInfo.totalAmount}</CustomText>
                </View>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  submitting && styles.confirmButtonDisabled
                ]}
                onPress={extensionAllowed ? initiateExtension : checkExtension}
                disabled={submitting}
              >
                <CustomText fontType='primary' weight='SemiBold' style={styles.buttonText}>
                  {extensionAllowed ? (submitting ? 'Paying now...' : 'Pay Now') : (submitting ? 'Checking Availability...' : 'Check Availability')}
                </CustomText>
              </TouchableOpacity>
            </ScrollView>
          </>
        ) : (
          <ActivityIndicator size='large' color={C.primaryText} style={styles.loader} />
        )}
      </View>
    </ActionSheet>
  );
}

const styles = themedStyleSheet(C => ({
  modalContainer: {
    padding: 24,
  },

  header: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.borderStrong,
  },

  headerText: {
    fontSize: 14,
    textTransform:'uppercase',
    color: C.textSecondary,
    textAlign: 'center',
  },

  contentContainer: {
    paddingVertical: 24,
  },

  formGroup: {
    flexDirection:'column',
    marginBottom: 16,
  },

  label: {
    fontSize: 10,
    color: C.textSecondary,
    textTransform:'uppercase',
    letterSpacing:.15,
    marginBottom: 2,
  },

  value: {
    fontSize: 12,
    color: C.text,
  },

  confirmButton: {
    backgroundColor: C.surfaceLow,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },

  confirmButtonDisabled: {
    backgroundColor: C.disabled,
  },

  buttonText: {
    fontSize: 12,
    textTransform:'uppercase',
    textAlign:'center',
    color: C.primaryText,
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  relativeContainer:{
    position:'relative',
    marginTop:12
  },

  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
  },

  option: {
    padding: 12,
    paddingHorizontal:12,
    // borderRadius: 6,
    backgroundColor: C.surfaceHigh,
  },

  optionText: {
    fontSize: 12,
  },

  selectedOption: {
    backgroundColor: C.primary,
  },

  unselectedOption: {
    backgroundColor: C.surfaceHigh,
  },

  customButton: {
    padding: 12,
    borderRadius: 6,
    borderTopLeftRadius:0,
    borderBottomLeftRadius:0,
    backgroundColor: C.surfaceHigh,
  },

  customText: {
    fontSize: 12,
    color: C.text,
  },

  input: {
    fontSize: 14,
    backgroundColor:C.surfaceLow,
    padding:12,
    borderRadius:6,
    color: C.text,
  }
}));


const TimeTab = ({ options, value, onChange }) => {
  const [custom, setCustom] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.relativeContainer}>
        {!custom ? (
          <View style={styles.optionContainer}>
            {options.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => onChange(item.value)}
                style={[
                  styles.option,
                  index === 0 ? {borderTopLeftRadius:6,borderBottomLeftRadius:6} : null,
                //   index === options.length - 1 ? {borderTopRightRadius:6,borderBottomRightRadius:6} : null,
                  value === item.value ? styles.selectedOption : styles.unselectedOption
                ]}
              >
                <CustomText fontType='primary' weight='Bold' style={[styles.optionText,value === item.value ? {color:C.onPrimary} : {color:C.text}]}>{item.label}</CustomText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.customButton} onPress={() => setCustom(true)}>
              <CustomText fontType='primary' weight='Bold' style={styles.customText}>Custom</CustomText>
            </TouchableOpacity>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(value)}
            onChangeText={(text) => onChange(Number(text))}
          />
        )}
      </View>
    </View>
  );
}
