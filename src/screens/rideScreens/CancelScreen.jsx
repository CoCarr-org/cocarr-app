import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  FlatList,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

import axios from 'axios';
import { API_URL } from '../../utils/constants';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';
import CustomText from '../../components/CustomText';
import { formatDate } from '../../utils/utils';

import { C, themedStyleSheet } from '../../theme';

export function CancelScreen({showCancelRide, setShowCancelRide,getBookingInfo}) {
  const bookingInfo = showCancelRide;
  const [isLoading, setIsLoading] = useState(true);
  const [refundSummary, setRefundSummary] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [review, setReview] = useState({
    comfort: '',
    host: '',
    cleanliness: '',
    comment: ''
  });
//   const dispatch = useDispatch();
  const actionSheetRef = useRef(null);


    useEffect(() => {
        if (bookingInfo) {
            actionSheetRef.current.show();
        }
        // else {
        //     actionSheetRef.current.hide();
        // }
    }, [bookingInfo]);


  const onCancel = async () => 
    {
        try {
          setIsLoading(true);
          const response = await axios.post(`${API_URL}/booking/cancel/${bookingInfo.bookingId}`);
            setShowCancelRide(null);
            if(actionSheetRef.current) actionSheetRef.current.hide();
            getBookingInfo();
        } catch (error) {
            console.error('Error submitting review:', error.message);
            Alert.alert('Error', error.message);
        }
        setIsLoading(false);
  };

  const onClose = () => {
      setShowCancelRide(null);
    if(actionSheetRef.current) actionSheetRef.current.hide();
  }

  useEffect(() => {
    async function getCancellationSummary() {
        try
        {
            const response = await axios.post(`${API_URL}/booking/refund-summary/${bookingInfo.bookingId}`);
            setRefundSummary(response.data);
            setIsLoading(false);
        }
        catch(error)
        {
            // setIsLoading(false);
            setShowCancelRide(null);
            Alert.alert('Error', error.message);
        }
    }
    if(bookingInfo) getCancellationSummary();
  }, [bookingInfo]);

  return (
    <ActionSheet
      ref={actionSheetRef}
      containerStyle={{backgroundColor:C.surfaceHigh}}
      isModal={true}

      isVisible={true}
      onClose={onClose}
      defaultOverlayOpacity={0.75}
      // gestureEnabled={true}
    >
      {!isLoading ?
        <ScrollView style={styles.modalContainer}>
        <View style={{paddingVertical:24}}>
            <CustomText fontType='primary' weight='Bold' style={{color:C.textSecondary, fontSize:12, fontWeight:'500',textTransform:'uppercase',textAlign:'center'}}>Are you sure you want to cancel this ride?</CustomText>
        </View>

        <View style={{paddingVertical:12,marginBottom:24,borderBottomWidth:1,borderBottomColor:C.borderStrong,borderTopWidth:1,borderTopColor:C.borderStrong}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:C.text, fontSize:11, fontWeight:'500',marginBottom:1,textAlign:'center',textTransform:'uppercase'}}>#{bookingInfo.bookingId}</CustomText>
          <CustomText fontType='primary' weight='Regular' style={{color:C.textSecondary, fontSize:12,marginBottom:1,textAlign:'center'}}>{bookingInfo.vehicle.brand?.name} - {bookingInfo.vehicle.vehicleNumber}</CustomText>
        </View>

        <View>
            
            <View style={{paddingVertical:12}}>
                {refundSummary.current === 'before' ? <CustomText  fontType='primary' weight='Regular' style={{color:C.text, fontSize:14, fontWeight:'400',textAlign:'left',lineHeight:18}}>You will get refund of Rs.{refundSummary.beforeCutoff.refundAmount + refundSummary.beforeCutoff.deposit}</CustomText> : null}
                {refundSummary.current === 'second' ? <CustomText fontType='primary' weight='Regular' style={{color:C.text, fontSize:12, fontWeight:'400',textAlign:'left',lineHeight:18}}>You will get refund of Rs.{refundSummary.afterCutoff.refundAmount + refundSummary.afterCutoff.deposit}</CustomText> : null}
                {refundSummary.current === 'final' ? <CustomText fontType='primary' weight='Regular' style={{color:C.text, fontSize:12, fontWeight:'400',textAlign:'left',lineHeight:18}}>You will get refund of Rs.{refundSummary.finalCutoff.refundAmount}</CustomText> : null}
                <View style={{marginVertical:16}}>
                    <CustomText numberOfLines={2} fontType='primary' weight='Regular' style={{color:C.textSecondary, fontSize:12,textAlign:'left',lineHeight:20,marginBottom:8}}><Text style={{fontWeight:'bold',textDecorationLine:'underline'}}>Before 24 Hours: </Text>If you cancel the ride before {formatDate(refundSummary.cutOffTime)} you will get refund of Rs.{refundSummary.beforeCutoff.refundAmount + refundSummary.beforeCutoff.deposit} {refundSummary.beforeCutoff.deposit ? `including refundable deposit of ${refundSummary.beforeCutoff.deposit}` : null}</CustomText>
                    <CustomText numberOfLines={2} fontType='primary' weight='Regular' style={{color:C.textSecondary, fontSize:12,textAlign:'left',lineHeight:20,marginBottom:8}}><Text style={{fontWeight:'bold',textDecorationLine:'underline'}}>Before 12 Hours: </Text>If you cancel the ride before {formatDate(refundSummary.finalCutOffTime)} you will get refund of Rs.{refundSummary.secondCutoff.refundAmount + refundSummary.secondCutoff.deposit} {refundSummary.secondCutoff.deposit ? `including refundable deposit of ${refundSummary.secondCutoff.deposit}` : null}</CustomText>
                    <CustomText numberOfLines={2} fontType='primary' weight='Regular' style={{color:C.textSecondary, fontSize:12,textAlign:'left',lineHeight:20}}><Text style={{fontWeight:'bold',textDecorationLine:'underline'}}>After 12 Hours: </Text>If you cancel the ride after {formatDate(refundSummary.finalCutOffTime)} you will get refund of deposit only which is Rs.{refundSummary.finalCutoff.deposit}</CustomText>
                </View>
            </View>
        </View>

        <View style={{paddingBottom:24,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12}}>
        
          <TouchableOpacity 
            style={[
              styles.confirmButton,
              submitLoading && styles.confirmButtonDisabled
            ]} 
            onPress={onCancel}
            disabled={submitLoading}
            >
            <CustomText fontType='primary' weight='Bold' style={{ fontSize:11,color:C.text, fontWeight:'500',textTransform:'uppercase',textAlign:'center'}}>{isLoading ? 'Cancelling Ride...' : 'Yes, Cancel Ride'}</CustomText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.backButton,
              submitLoading && styles.confirmButtonDisabled
            ]} 
            onPress={onClose}
            disabled={submitLoading}
            >
            <CustomText fontType='primary' weight='Bold' style={{ fontSize:12,color:C.text, fontWeight:'500',textTransform:'uppercase',textAlign:'center'}}>{'Go Back'}</CustomText>
          </TouchableOpacity>
            </View>
        </ScrollView>  : <ActivityIndicator size='large' color={C.primaryText} style={{flex:1,justifyContent:'center',alignItems:'center'}} />
      }
    </ActionSheet>
  );
}





const styles = themedStyleSheet(C => ({
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
    color: C.text,
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
    borderBottomColor: C.borderStrong,
  },

  confirmButton: {
    backgroundColor: C.danger,
    padding: 12,
    borderRadius: 6,
    flex:1,
    // width:'50%',
    // alignItems: 'center',
    color:C.text
  },

  backButton: {
    backgroundColor: C.surface,
    padding: 12,
    borderRadius: 6,
    flex:1,
    // width:'50%',
    // alignItems: 'center',
    color:C.text
  },

  confirmButtonDisabled: {
    backgroundColor: C.surfaceHighest,
    color:C.textSecondary
  },

  confirmButtonText: {
    // color: '#000',
    fontSize: 14,
    fontWeight: '500',
  }
}));

