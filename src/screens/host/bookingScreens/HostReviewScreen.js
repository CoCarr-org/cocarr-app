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
// import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/AntDesign';
import { useDispatch, useSelector } from 'react-redux';
import { setShowLastBooking} from '../../../store/bookingSlice';
import axios from 'axios';
import { API_URL } from '../../../utils/constants';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';
import CustomText from '../../../components/CustomText';
import { useNavigation } from '@react-navigation/native';

import { C, themedStyleSheet } from '../../../theme';

export function HostReviewScreen({bookingInfo,onClose,show}) {
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const [review, setReview] = useState({
    totalRating: '',
    comment: ''
  });
  const dispatch = useDispatch();
  const actionSheetRef = useRef(null);

  useEffect(()=>{
    console.log('show',bookingInfo);
    if(show){
      actionSheetRef.current.show();
    }
    else{
      actionSheetRef.current.hide();
    }
  },[show]);

  const submitReview = async () => 
    {
        try {
          setIsLoading(true);
          const response = await axios.post(`${API_URL}/host/bookings/review/${bookingInfo.id}`, {
            totalRating: review.totalRating,
            comment: review.comment
          });
          onClose();
          navigation.goBack('HostBookingInfo',{bookingId:bookingInfo.id});
        } catch (error) {
            console.error('Error submitting review:', error.message);
            Alert.alert('Error', error.message);
        }
        setIsLoading(false);
  };


  return (
    <ActionSheet
      ref={actionSheetRef}
      containerStyle={{backgroundColor:C.surfaceHigh}}
      isModal={true}
      closeOnTouchOutside={false}
      closeOnPressBack={false}
      draggable={false}
      closeOnTouchBackdrop={false}
      isVisible={true}
      onClose={onClose}
      defaultOverlayOpacity={0.75}
      // gestureEnabled={true}
    >
      <ScrollView style={styles.modalContainer}>


      <View style={{paddingBottom:12,borderBottomWidth:1,borderBottomColor:C.borderStrong,borderTopWidth:0,borderTopColor:C.borderStrong}}>
        <CustomText fontType='primary' weight='SemiBold' style={{color:C.text, fontSize:11, fontWeight:'500',marginBottom:1,textAlign:'center',textTransform:'uppercase'}}>#{bookingInfo.bookingId}</CustomText>
        <CustomText fontType='primary' weight='Regular' style={{color:C.textSecondary, fontSize:12,marginBottom:1,textAlign:'center'}}>{bookingInfo.vehicle.brand?.name} - {bookingInfo.vehicle.vehicleNumber}</CustomText>
      </View>

      <View style={{paddingVertical:24}}>
    <StarRating rating={review.totalRating} title='Rate the Guest' setRating={(value)=>setReview({...review,totalRating:value})} />
        <View style={{marginVertical:12,position:'relative'}}>
          <CustomText fontType='primary' weight='Regular' style={{color:C.textTertiary, fontSize:11,letterSpacing:.05,position:'absolute',right:12,bottom:24,zIndex:9}}>{review.comment.length}/200</CustomText>
          <TextInput
           numberOfLines={4}
           
          style={{backgroundColor:C.surface,padding:12,borderRadius:8,marginVertical:12,textAlign:'left',verticalAlign:'top'}}
          placeholder='Write a review'
          value={review.comment}
          placeholderTextColor={C.textTertiary}
          maxLength={200}
          onChangeText={(value)=>setReview({...review,comment:value})}
          />
       </View>
      </View>
      <View style={{paddingBottom:24}}>

        <TouchableOpacity 
          style={[
            styles.confirmButton,
            (!review.totalRating || !review.comment || isLoading) && styles.confirmButtonDisabled
          ]} 
          onPress={submitReview}
          disabled={!review.totalRating || !review.comment || isLoading}
          >
          <CustomText fontType='primary' weight='Bold' style={{ fontSize:12, fontWeight:'500',textTransform:'uppercase'}}>{isLoading ? 'Submitting...' : 'Submit Review'}</CustomText>
        </TouchableOpacity>
          </View>
      </ScrollView>
    </ActionSheet>
  );
}



const StarRating = ({ rating, setRating, title }) => {
  const handleStarPress = (index) => {
    setRating(index + 1);
  };

  return (
    <View style={{flexDirection:'row', justifyContent:'space-between',marginVertical:12, alignItems:'center',gap:10}}>
      <CustomText fontType='primary' weight='Bold' style={{color:C.textSecondary, fontSize:12, marginBottom:1,textAlign:'center',letterSpacing:-.015,textTransform:'uppercase'}}>{title}</CustomText>
      <View style={{ flexDirection: 'row', justifyContent: 'center'}}>
        {[...Array(5)].map((_, index) => (
          <TouchableOpacity key={index} onPress={() => handleStarPress(index)}>
            <Icon
              name={index < rating ? 'star' : 'staro'}
              size={30}
              style={{marginLeft:2}}
              color={index < rating ? C.primaryText : C.textTertiary}
              />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};




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
    backgroundColor: C.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
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

