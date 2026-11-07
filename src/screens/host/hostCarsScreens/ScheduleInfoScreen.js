import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TouchableHighlight,
  Dimensions,
  ToastAndroid,
} from 'react-native';
import axios from 'axios';
import { API_URL } from '../../../utils/constants';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate, notify } from '../../../utils/utils';
import HeaderBlock from '../../../components/CenterHeader';
import CustomText from '../../../components/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import ActionSheet from 'react-native-actions-sheet';

import { C, themedStyleSheet } from '../../../theme';

export default function ScheduleInfoScreen({ route,navigation }) {
  const { scheduleId } = route.params;
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteScheduleModal, setDeleteScheduleModal] = useState(false);
  const [deleteScheduleBlockModal, setDeleteScheduleBlockModal] = useState(false);
  const authInfo = useSelector((state) => state.auth);

  const getScheduleInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/host/schedule/${scheduleId}`, {
        headers: {
          'Authorization': `${authInfo.token}`
        }
      });
      setSchedule(response.data);
      setLoading(false);
    } catch (error) {
      console.log('error', error);
      setError('Error fetching booking information');
      setLoading(false);
    }
  };

  useEffect(() => {
    getScheduleInfo();
  }, []);


  const deleteSchedule = async () => {
    try {
      const response = await axios.delete(`${API_URL}/host/schedule/${schedule.id}`);
      console.log('response',response)
      navigation.replace('HostTab');
    } catch (error) {
      console.log('error', error);
      notify(error.message);
    }
  }

  const deleteScheduleBlock = async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/host/schedule-block/${id}`);
      console.log('response',response)
      setDeleteScheduleBlockModal(false);
      await getScheduleInfo();
    } catch (error) {
      console.log('error', error);
      notify(error.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={C.primaryText} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderBlock title="Schedule Info" navigation={navigation} showBackButton={true} customSecondaryText={`${schedule.vehicle?.vehicleNumber}`} rightComponent={<TouchableOpacity style={{padding:2,backgroundColor:'#ff000055',borderRadius:20,height:32,width:32,alignItems:'center',justifyContent:'center'}} onPress={()=>setDeleteScheduleModal(true)}><Icon name="trash-outline" size={18} color={C.danger} /></TouchableOpacity>} />

      <View style={{paddingBottom:16,marginHorizontal:16,borderBottomWidth:0,borderBottomColor:C.border}}>
          
          <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',rowGap:16}}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Schedule Start Time</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{formatDate(schedule.startTime, 'long')}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Schedule End Time</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{formatDate(schedule.endTime, 'long')}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Schedule Status</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{schedule.status}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Vehicle Number</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{schedule.vehicle?.vehicleNumber}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'100%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Vehicle Name</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{schedule.vehicle?.vehicleName}</CustomText>
                    </View>
              </View>
          </View>
      </View>
      <FlatList
        ListHeaderComponent={<View style={{backgroundColor:C.surface,paddingHorizontal:16,paddingVertical:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Schedule Blocks</CustomText>
          <TouchableOpacity onPress={()=>navigation.navigate('CreateScheduleBlock',{scheduleId:schedule.id})}>
            <CustomText fontType='primary' weight='SemiBold' style={{color:C.primaryText,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Create</CustomText>
          </TouchableOpacity>
        </View>}
        data={schedule.scheduleBlocks}
        renderItem={({item}) => <BlockCard block={item} setShow={setDeleteScheduleBlockModal}/>}
      />
      <DeleteSchedule isVisible={deleteScheduleModal} onClose={()=>setDeleteScheduleModal(false)} onDelete={deleteSchedule} />
      <DeleteScheduleBlock isVisible={deleteScheduleBlockModal} onClose={()=>setDeleteScheduleBlockModal(false)} onDelete={deleteScheduleBlock} id={deleteScheduleBlockModal} />
    </View>
  );
}


const BlockCard = ({block,setShow}) => {
  return (
    <View style={{paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.border}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
        <View>
            <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>From: {formatDate(block.startTime, 'long')}</CustomText>
            <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>To: {formatDate(block.endTime, 'long')}</CustomText>
        </View>
        <View style={{height:24,width:24,backgroundColor:'#ff000055',borderRadius:12,alignItems:'center',justifyContent:'center'}}>
          <TouchableOpacity onPress={()=>setShow(block.id)}>
            <Icon name="trash-outline" size={12} color={C.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const DeleteSchedule = ({ isVisible, onClose, onDelete }) => {

  const actionSheetRef = useRef(null);

  useEffect(() => {
    if(isVisible) actionSheetRef.current.show();
    else actionSheetRef.current.hide();
  }, [isVisible]);

  return (
    <ActionSheet ref={actionSheetRef} onDismiss={onClose} defaultOverlayOpacity={0.75} containerStyle={{backgroundColor:C.surface,padding:16}}>
      <View style={{padding:16}}>
        <CustomText fontType='primary' weight='Bold' style={{color:C.text,fontSize:11,marginBottom:8,textTransform:'uppercase',textAlign:'center'}}>Delete Schedule</CustomText>
        <CustomText fontType='primary' weight='Regular' style={{color:C.textTertiary,fontSize:14,marginBottom:24,textAlign:'center'}}>Are you sure you want to delete this schedule and all its blocks?</CustomText>
          <TouchableOpacity onPress={onDelete} style={{backgroundColor:'#ff000055',borderRadius:8,paddingVertical:16,paddingHorizontal:16,marginBottom:16}}>
          <CustomText fontType='primary' weight='Bold' style={{color:C.text,fontSize:11,textAlign:'center', textTransform:'uppercase'}}>Delete</CustomText>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{backgroundColor:C.surface,borderRadius:8,paddingVertical:16,paddingHorizontal:16}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:C.text,fontSize:11,textAlign:'center',textTransform:'uppercase'}}>Cancel</CustomText>
        </TouchableOpacity>
      </View>
    </ActionSheet>
  );
};

const DeleteScheduleBlock = ({ isVisible, onClose, onDelete,id }) => {

  const actionSheetRef = useRef(null);

  useEffect(() => {
    if(isVisible) actionSheetRef.current.show();
    else actionSheetRef.current.hide();
  }, [isVisible]);

  return (
    <ActionSheet ref={actionSheetRef} onDismiss={onClose} defaultOverlayOpacity={0.75} containerStyle={{backgroundColor:C.surface,padding:16}}>
      <View style={{padding:16}}>
        <CustomText fontType='primary' weight='Bold' style={{color:C.text,fontSize:11,marginBottom:8,textTransform:'uppercase',textAlign:'center'}}>Delete Schedule Block</CustomText>
        <CustomText fontType='primary' weight='Regular' style={{color:C.textTertiary,fontSize:14,marginBottom:24,textAlign:'center'}}>Are you sure you want to delete this schedule block?</CustomText>
        <TouchableOpacity onPress={()=>onDelete(id)} style={{backgroundColor:'#ff000055',borderRadius:8,paddingVertical:16,paddingHorizontal:16,marginBottom:16}}>
          <CustomText fontType='primary' weight='Bold' style={{color:C.text,fontSize:11,textAlign:'center', textTransform:'uppercase'}}>Delete</CustomText>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{backgroundColor:C.surface,borderRadius:8,paddingVertical:16,paddingHorizontal:16}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:C.text,fontSize:11,textAlign:'center',textTransform:'uppercase'}}>Cancel</CustomText>
        </TouchableOpacity>
      </View>
    </ActionSheet>
  );
};




const Overview = ({booking}) => {
  return (
    <View>
      <View style={{paddingBottom:16,marginHorizontal:16,borderBottomWidth:1,borderBottomColor:C.border}}>
  
  <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Selected Pickup Time</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{formatDate(booking.startTime, 'long')}</CustomText>
            </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Selected Drop Time</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{formatDate(booking.endTime, 'long')}</CustomText>
            </View>
      </View>
  </View>
  <View style={{marginTop:16,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Actual Pickup Time</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.pickupTime ? formatDate(booking.pickupTime, 'long') : 'N/A'}</CustomText>
            </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Actual Drop Time</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.dropTime ? formatDate(booking.dropTime, 'long') : 'N/A'}</CustomText>
            </View>
      </View>
  </View>
  <View style={{marginTop:16,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Status</CustomText>
              <CustomText fontType='primary' weight='Regular' style={{...styles.bookingDetail,textTransform:'capitalize'}}>{booking.status}</CustomText>
            </View>
      </View>
  </View>
  
  </View>

      <View style={{paddingBottom:16,marginHorizontal:16,borderBottomWidth:1,borderBottomColor:C.border}}>
  
  <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Pickup Kms / Fuel</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.startKms ? `${booking.startKms} Kms` : '-'} / {booking.startFuel ? `${booking.startFuel}%` : '-'}</CustomText>
            </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Drop Kms / Fuel</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.endKms ? `${booking.endKms} Kms` : '-'} / {booking.endFuel ? `${booking.endFuel}%` : '-'}</CustomText>
            </View>
      </View>
  </View>
  <View style={{marginTop:16,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Alloted Kms</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.kmAlloted ? `${booking.kmAlloted} Kms` : '-'}</CustomText>
            </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Extra Fee/Km</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>Rs.{booking.extraKmFee}</CustomText>
            </View>
      </View>
  </View>
  
  </View>
    </View>
  );
}


const Payment = ({booking}) => {
  return (
    <View>
      <View style={{paddingBottom:16,marginHorizontal:16,borderBottomWidth:1,borderBottomColor:C.border}}>
  
  <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Total Amount</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>Rs.{booking.totalAmount}</CustomText>
            </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Refundable Deposit</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.depositAmount ? `Rs.${booking.depositAmount}` : 'N/A'}</CustomText>
            </View>
      </View>
  </View>
  <View style={{marginTop:16,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Payment Method</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.paymentMethod ? booking.paymentMethod : 'N/A'}</CustomText>
            </View>
      </View>
  </View>
  
  </View>

      {booking.isRefunded ?   <View style={{paddingBottom:16,marginHorizontal:16,borderBottomWidth:1,borderBottomColor:C.border}}>
     
     <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
         <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
               <View>
                 <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Refunded Amount</CustomText>
                 <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.refundedAmount ? `Rs.${booking.refundedAmount}` : 'N/A'}</CustomText>
               </View>
         </View>
         <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
               <View>
                 <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Refundable Deposit</CustomText>
                 <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.depositAmount ? `Rs.${booking.depositAmount}` : 'N/A'}</CustomText>
               </View>
         </View>
     </View>
     <View style={{marginTop:16,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
         <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
               <View>
                 <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Payment Method</CustomText>
                 <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.paymentMethod ? booking.paymentMethod : 'N/A'}</CustomText>
               </View>
         </View>
     </View>
     
     </View> : null}
    </View>
  );
}

const Documents = ({booking}) => {
  return (
    <View>
      <View style={{paddingBottom:16,marginHorizontal:16,borderBottomWidth:1,borderBottomColor:C.border}}>
  
  <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Selected Pickup Time</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{formatDate(booking.startTime, 'long')}</CustomText>
            </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Selected Drop Time</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{formatDate(booking.endTime, 'long')}</CustomText>
            </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Status</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.status}</CustomText>
            </View>
      </View>
  </View>
  <View style={{marginTop:16,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Actual Pickup Time</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.pickupTime ? formatDate(booking.pickupTime, 'long') : 'N/A'}</CustomText>
            </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
            <View>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Actual Drop Time</CustomText>
              <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.dropTime ? formatDate(booking.dropTime, 'long') : 'N/A'}</CustomText>
            </View>
      </View>
  </View>
  
  </View>
    </View>
  );
}

const Review = ({booking}) => {

  const StarRating = ({ rating}) => {
    return (
      <View style={{ flexDirection: 'row'}}>
        {[...Array(5)].map((_, index) => (
          <TouchableOpacity key={index}>
            <Icon
              name={index < rating ? 'star' : 'staro'}
              size={20}
              style={{marginLeft:2}}
              color={index < rating ? C.primaryText : C.textSecondary}
              />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View>
      <View style={{paddingVertical:40,marginHorizontal:16}}>
  
  {booking.review ? <View style={{flexDirection:'column',alignItems:'flex-start',justifyContent:'space-between'}}>
      
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',marginBottom:28}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start'}}>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textSecondary,fontSize:10,textTransform:'uppercase',letterSpacing:.15,width:'55%'}}>Comfort Rating</CustomText>
              <StarRating rating={booking.review?.comfortRating ? booking.review.comfortRating : 0}/>
            </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',marginBottom:28}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start'}}>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textSecondary,fontSize:10,textTransform:'uppercase',letterSpacing:.15,width:'55%'}}>Host Rating</CustomText>
              <StarRating rating={booking.review?.hostRating ? booking.review.hostRating : 0}/>
            </View>
      </View>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',marginBottom:28}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start'}}>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textSecondary,fontSize:10,textTransform:'uppercase',letterSpacing:.15,width:'55%'}}>Cleanliness Rating</CustomText>
              <StarRating rating={booking.review.cleanlinessRating ? booking.review.cleanlinessRating : 0}/>
            </View>
      </View>
      
      <View style={{flexDirection:'column',alignItems:'center',justifyContent:'flex-start',marginBottom:28}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start'}}>
              <CustomText fontType='primary' weight='SemiBold' style={{color:C.textSecondary,fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Comment</CustomText>
            </View>
            <View style={{marginTop:12}}>
              <CustomText fontType='primary' weight='Regular' style={{color:C.text,fontSize:12,letterSpacing:.15}}>{booking.review.comment}</CustomText>
            </View>
      </View>
      
  </View> : null}
  
  </View>
    </View>
  );
}


const styles = themedStyleSheet(C => ({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },

  centered: {
    flex: 1,
    backgroundColor:C.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorText: {
    color: C.danger,
    fontSize: 16,
  },

  bookingInfo: {
    padding: 20,
    paddingBottom:8,
    paddingHorizontal:0
  },

  bookingTitle: {
    color: C.text,
    fontSize: 14,

    // fontWeight: 'bold',
    marginBottom:2
    // marginBottom: 20,
  },

  vehicleImage: {
    width: '100%',
    height: 180,
    borderRadius: 0,
  },

  bookingDetail: {
    color: C.text,
    fontSize: 12,
    marginBottom: 10,
  },

  extendButton:{
    backgroundColor:C.primary,
    // opacity:0.25,
    padding:12,
    borderRadius:6,
    marginHorizontal:16,
    marginBottom:16
  },

  cancelButton:{
    backgroundColor:'#ff333315',
    // opacity:0.25,
    padding:12,
    borderRadius:8,
    marginHorizontal:16,
    marginBottom:16
  }
}));
