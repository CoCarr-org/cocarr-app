import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, TouchableHighlight, Dimensions, TextInput, ToastAndroid, Linking, ScrollView } from 'react-native';
import axios from 'axios';
import { API_URL, BOOKING_INITIATED, BOOKING_BOOKED, BOOKING_FINISHED, BOOKING_ONGOING, BOOKING_CANCELLED, BRAND_COLOR } from '../../../utils/constants';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate, photoUrl, notify } from '../../../utils/utils';
import HeaderBlock from '../../../components/CenterHeader';
import CustomText from '../../../components/CustomText';
import Icon from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
// import { setShowCancelRide } from '../../store/bookingSlice';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { HostEndBookingScreen } from './HostEndBookingScreen';
import ActionSheet from 'react-native-actions-sheet';
import FiveStar from '../../../components/host/FiveStar';
import { useNavigation } from '@react-navigation/native';
import { HostReviewScreen } from './HostReviewScreen';
// import { CancelScreen } from './CancelScreen';
// import ExtensionScreen from './ExtensionScreen';
export default function HostBookingInfoScreen({ route }) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const authInfo = useSelector((state) => state.auth);
  const [showCancelRide, setShowCancelRide] = useState(false);
  const [showEndBooking, setShowEndBooking] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const dispatch = useDispatch();

  const getBookingInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/host/bookings/${bookingId}`, {
        headers: {
          'Authorization': `${authInfo.token}`
        }
      });
      console.log('response',response.data);
      setBooking(response.data);
      setLoading(false);
    } catch (error) {
      console.log('error', error);
      setError('Error fetching booking information');
      setLoading(false);
    }
  };

  useEffect(() => {
    getBookingInfo();
  }, []);


  const onCancel = async (data) => {
    try 
    {
      const response = await axios.post(`${API_URL}/host/bookings/cancel/${bookingId}`, {
        reason:data.cancelReason
      });
      await getBookingInfo();
      setShowCancelRide(false);
    } catch (error) {
        console.log('error', error);
        notify('Something went wrong');
    }
  }


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EDBF31" />
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
      <HeaderBlock title="Booking Info" navigation={navigation} showBackButton={true} customSecondaryText={`#${booking.bookingId}`} />
      {/* Clean header: vehicle photo banner with the car info + status below it,
          instead of the old empty gradients over a commented-out image. */}
      <BookingHeader booking={booking} />
      <TabViewInfo booking={booking} setShowReview={setShowReview}/>
        {booking.isAllowedForReport ? <TouchableHighlight 
            style={[
              styles.cancelButton,
            ]} 
            onPress={()=>navigation.navigate('HostDamageScreen',{bookingId:booking.bookingId})}
            >
              {/* <Ionicons name='alert-circle-outline' size={24} color='#ff3f33AA'/> */}
            <CustomText fontType='primary' weight='Bold' style={{ fontSize:12, fontWeight:'500',textTransform:'uppercase',color:'#ff3f33AA',textAlign:'center'}}>{'Report Damage'}</CustomText>
          </TouchableHighlight>  : null}
          
        {/* {booking.status === BOOKING_BOOKED ? <TouchableHighlight 
            style={[
              styles.extendButton,
              {backgroundColor:'#EDBF3135',paddingVertical:12}
            ]} 
            onPress={()=>navigation.navigate('HostStartBooking',{bookingId:booking.id})}
            >
            <CustomText fontType='primary' weight='Bold' style={{ fontSize:12, fontWeight:'500',textTransform:'uppercase',color:BRAND_COLOR,textAlign:'center'}}>{'Start Ride'}</CustomText>
          </TouchableHighlight>  : null}
        {booking.status === 'ongoing' ? <TouchableHighlight 
            style={[
              styles.extendButton,
              {backgroundColor:'#EDBF3135',paddingVertical:12}
            ]} 
            onPress={()=>navigation.navigate('HostEndBooking',{bookingId:booking.id})}
            >
            <CustomText fontType='primary' weight='Bold' style={{ fontSize:12, fontWeight:'500',textTransform:'uppercase',color:BRAND_COLOR,textAlign:'center'}}>{'End Ride'}</CustomText>
          </TouchableHighlight>  : null} */}
          {showCancelRide ? <CancelRidePopup show={showCancelRide} onCancel={onCancel}/> : null}
          {showReview ? <HostReviewScreen bookingInfo={booking} onClose={()=>setShowReview(false)} show={showReview}/> : null}
    </View>
  );
}

const CancelRidePopup = ({onCancel,show}) => {

  const [data, setData] = useState({
    cancelReason:''
  });

  useEffect(()=>{
    if(show){
      cancelRideRef.current.show();
    }
    else{
      cancelRideRef.current.hide();
    }
  },[show]);
  const cancelRideRef = useRef(null);
  return (
    <ActionSheet ref={cancelRideRef} containerStyle={{backgroundColor:'#101010',minHeight:'35%',paddingHorizontal:16}} defaultOverlayOpacity={0.75} height={'50%'} safeAreaInsets={{bottom:0}}>
      <View style={{flexDirection:'column'}}>
        <CustomText fontType='primary' weight='Medium' style={{color:'#ff0000',fontSize:16,textAlign:'center',maxWidth:'70%',marginHorizontal:'auto',marginTop:20}}>Are you sure you want to cancel this ride?</CustomText>

        <View style={{flexDirection:'column',justifyContent:'space-between',marginTop:20,width:'100%'}}>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,marginBottom:4,textAlign:'left',textTransform:'uppercase'}}>Reason for cancellation</CustomText>
            <TextInput numberOfLines={3} multiline={true}

            style={{backgroundColor:'#1c1c1e',padding:12,borderRadius:8,textAlign:'left',marginBottom:18}}
            value={data.cancelReason}
            placeholderTextColor='#757575'
              onChangeText={(value)=>setData({...data,cancelReason:value})}
            />
        </View>

        <View>
        <TouchableHighlight 
            style={[
              // styles.extendButton,
              {backgroundColor:'#ff000095',paddingVertical:16,borderRadius:8}
            ]} 
            onPress={()=>onCancel(data)}
            >
            <CustomText fontType='primary' weight='SemiBold' style={{ fontSize:11, fontWeight:'500',textTransform:'uppercase',color:'#fff',textAlign:'center'}}>{'Yes, I want to cancel ride'}</CustomText>
          </TouchableHighlight>
        </View>
      </View>
    </ActionSheet>
  )
}

const STATUS_META = {
  [BOOKING_INITIATED]: { label: 'Pending',   fg: '#c9a24b', bg: '#EDBF3115', bd: '#EDBF3133' },
  [BOOKING_BOOKED]:   { label: 'Upcoming',  fg: '#EDBF31', bg: '#EDBF3122', bd: '#EDBF3155' },
  [BOOKING_ONGOING]:  { label: 'Ongoing',   fg: '#6ee6b0', bg: '#3fce8f22', bd: '#3fce8f59' },
  [BOOKING_FINISHED]: { label: 'Completed', fg: '#a3a3a3', bg: '#26262a',   bd: '#3a3a40' },
  [BOOKING_CANCELLED]: { label: 'Cancelled', fg: '#ff8f8f', bg: '#ef444422', bd: '#ef444455' },
};

// Vehicle photo banner + car name/specs/registration + status badge.
const BookingHeader = ({ booking }) => {
  const v = booking.vehicle || {};
  const img = (v.images || []).filter((i) => !i.isDeleted)[0]?.url;
  const st = STATUS_META[booking.status] || STATUS_META[BOOKING_FINISHED];
  return (
    <View>
      {img ? (
        <Image source={{ uri: photoUrl(img) }} style={{ width: '100%', height: 190, backgroundColor: '#1c1c1e' }} resizeMode="cover" />
      ) : (
        <View style={{ width: '100%', height: 190, backgroundColor: '#1c1c1e', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="car-outline" size={40} color="#3a3a40" />
        </View>
      )}
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <CustomText fontType='primary' weight='Bold' style={{ color: '#f0f0f2', fontSize: 18, letterSpacing: -.3, flex: 1 }}>{v.brand?.name} {v.vehicleName}</CustomText>
          <View style={{ backgroundColor: st.bg, borderWidth: 1, borderColor: st.bd, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 10 }}>
            <CustomText fontType='primary' weight='Bold' style={{ color: st.fg, fontSize: 9, textTransform: 'uppercase', letterSpacing: .3 }}>{st.label}</CustomText>
          </View>
        </View>
        <CustomText fontType='primary' weight='Regular' style={{ color: '#a3a3a3', fontSize: 10, textTransform: 'uppercase', letterSpacing: .15, marginTop: 4 }}>
          {[v.vehicleFuelType, v.vehicleSeats && `${v.vehicleSeats} Seater`, v.vehicleYear, v.vehicleNumber].filter(Boolean).join(' · ')}
        </CustomText>
      </View>
    </View>
  );
};

const TabViewInfo = ({booking,setShowReview}) => {

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'overview', title: 'Overview' },
    { key: 'rideInfo', title: 'Ride Info' },
    { key: 'payment', title: 'Payment Info' },
    { key: 'review', title: 'Review' },
    { key: 'documents', title: 'Photos' },
  ]);

  const renderScene = SceneMap({
    overview: ()=><Overview booking={booking} setShowReview={setShowReview}/>,
    // userInfo: ()=><UserInfo userInfo={booking.user}/>,
    rideInfo: ()=><RideInfo booking={booking}/>,
    payment: ()=><Payment booking={booking}/>,
    review: ()=><Review booking={booking}/>,
    documents: ()=><Documents booking={booking}/>
  });

  // Plain horizontal pill row (not TabBar's scrollEnabled mode, which
  // mis-measures custom items and runs away). Simple controlled selector.
  const renderTabBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}
      style={{ backgroundColor: '#000', flexGrow: 0 }}>
      {routes.map((r, i) => {
        const active = i === index;
        return (
          <TouchableOpacity key={r.key} activeOpacity={0.8} onPress={() => setIndex(i)}
            style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 24, backgroundColor: active ? '#EDBF313A' : '#1c1c1e' }}>
            <Text style={{ color: active ? BRAND_COLOR : '#757575', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: .15 }}>{r.title}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      overdrag={true}
      style={{backgroundColor:'#000'}}
      renderTabBar={renderTabBar}
    />
  )
}


const UserInfo = ({userInfo}) => {
  return (
    <View>
          <View style={{paddingBottom:16,marginHorizontal:16,borderBottomWidth:1,borderBottomColor:'#1c1c1e'}}>
        
            <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',rowGap:16}}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'100%'}}>
                      <View>
                        <Image source={{uri:photoUrl(userInfo.profilePhoto)}} style={{width:80,height:80,borderRadius:100}}/>
                      </View>
                </View>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                      <View>
                        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Name</CustomText>
                        <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{userInfo.name}</CustomText>
                      </View>
                </View>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                      <View>
                        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Contact Number</CustomText>
                        <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{userInfo.contactNumber}</CustomText>
                      </View>
                </View>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                      <View>
                        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Contact Number</CustomText>
                        <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{userInfo.contactNumber}</CustomText>
                      </View>
                </View>
            </View>
        </View>

    </View>
  )
}

const Overview = ({booking,setShowReview}) => {
  return (
    <ScrollView style={{flex:1}}>


            <View style={{paddingBottom:16,marginHorizontal:16,marginTop:24}}>

            {booking.status === BOOKING_BOOKED ? <View style={{flexDirection:'column',alignItems:'center',justifyContent:'space-between',paddingBottom:32}}>
              <CustomText fontType='primary' weight='Bold' style={{color:'#757575',fontSize:10,letterSpacing:.15,textTransform:'uppercase',marginBottom:8}}>Ride Start OTP</CustomText>
              <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                {booking.startOtp?.toString().split('').map((digit, index) => (
                  <View key={index} style={{backgroundColor:'#1c1c1e', paddingHorizontal:12, paddingVertical:8, borderRadius:4}}>
                    <CustomText fontType='primary' weight='SemiBold' style={{color:'#c3c3c3', fontSize:16, letterSpacing:.15}}>{digit}</CustomText>
                  </View>
                ))}
              </View>
            </View> : null}
            
            {booking.status === BOOKING_ONGOING ? <View style={{flexDirection:'column',alignItems:'center',justifyContent:'space-between',paddingBottom:32}}>
              <CustomText fontType='primary' weight='Bold' style={{color:'#757575',fontSize:10,letterSpacing:.15,textTransform:'uppercase',marginBottom:8}}>Ride End OTP</CustomText>
              <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                {booking.endOtp?.toString().split('').map((digit, index) => (
                  <View key={index} style={{backgroundColor:'#1c1c1e', paddingHorizontal:12, paddingVertical:8, borderRadius:4}}>
                    <CustomText fontType='primary' weight='SemiBold' style={{color:'#c3c3c3', fontSize:16, letterSpacing:.15}}>{digit}</CustomText>
                  </View>
                ))}
              </View>
            </View> : null}
              <View style={{flexDirection:'column',alignItems:'flex-start',justifyContent:'space-between',borderWidth:1,borderColor:'#EDBF3115',paddingHorizontal:16,paddingVertical:12,borderRadius:8,backgroundColor:'#EDBF3113'}}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
              <View style={{flexDirection:'column', alignItems:'flex-start',backgroundColor:'#1c1c1e',borderRadius:40,width:40,height:40,justifyContent:'center',alignItems:'center',marginRight:12}}>
              {booking.user?.profilePhoto && <Image source={{uri:photoUrl(booking.user?.profilePhoto)}} style={{width:40, height:40, borderRadius:40}}/>}
            </View>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flex:1}}>
              <View>
                  <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,letterSpacing:.15,textTransform:'uppercase'}}>Rider Name</CustomText>

                  <CustomText fontType='primary' weight='Medium' style={{color:'#f3f3f3',fontSize:14,letterSpacing:.15}}>{booking.user.name}</CustomText>
              </View>
                  <TouchableHighlight onPress={()=>Linking.openURL(`tel:${booking.user.contactNumber}`)}>
                  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,paddingVertical:4,paddingHorizontal:8,borderRadius:12,height:48,width:48,backgroundColor:'#EDBF3115'}}>
                    <Ionicons name='call-outline' size={16} color='#EDBF31'/>
                  </View>
                  </TouchableHighlight>
            </View>
                </View>
                
                {booking.deliveryType !== 'self' ? <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingTop:18,paddingBottom:18,borderTopWidth:1,borderTopColor:'#1c1c1e',marginTop:12,width:'100%'}}>
                  <CustomText numberOfLines={2} fontType='primary' weight='Medium' style={{color:'#a3a3a3',fontSize:12,letterSpacing:.15,lineHeight:18}}>{booking.address}{booking?.city?.name}</CustomText>
                  <TouchableHighlight onPress={()=>Linking.openURL(`https://maps.google.com/?q=${booking.vehicle?.pickupPoint?.lat},${booking.vehicle?.pickupPoint?.long}`)}>
                          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,paddingVertical:4,paddingHorizontal:8,borderRadius:12,height:48,width:48,backgroundColor:'#EDBF3115'}}>
                            <Ionicons name='location-outline' size={16} color='#EDBF31'/>
                          </View>
                          </TouchableHighlight>
                </View> : null}

              </View>

            </View>


              <View style={{paddingBottom:16,marginHorizontal:16,borderBottomWidth:1,borderBottomColor:'#1c1c1e'}}>
          
          <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',rowGap:16}}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Selected Pickup Time</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{formatDate(booking.startTime, 'long')}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Selected Drop Time</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{formatDate(booking.endTime, 'long')}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Actual Pickup Time</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.pickupTime ? formatDate(booking.pickupTime, 'long') : 'N/A'}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Actual Drop Time</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.dropTime ? formatDate(booking.dropTime, 'long') : 'N/A'}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Ride Type</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={{...styles.bookingDetail,textTransform:'capitalize'}}>{booking.deliveryType === 'self' ? 'Rider Pickup' : 'Doorstep Delivery'}</CustomText>
                    </View>
              </View>
          </View>
          
          </View>
             
 
              

          {booking.status === BOOKING_FINISHED ? <View style={{paddingTop:16,marginHorizontal:16,}}>
                      <CustomText fontType='primary' weight='Bold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Review the guest</CustomText>
          
          <TouchableOpacity onPress={()=>setShowReview(true)}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                <View style={{flexDirection:'column',alignItems:'flex-start',justifyContent:'flex-start'}}>
                      <FiveStar onPress={()=>setShowReview(true)} size={32} rating={booking.hostReview?.totalRating ? booking.hostReview.totalRating : 0}/>
                        {booking.hostReview?.comment ? <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3',fontSize:13}}>{booking.hostReview?.comment}</CustomText> : null}
                </View>
                {!booking.hostReview ? <View>
                  <Ionicons name='chevron-forward-outline' size={20} color='#454545'/>
                </View> : null}
            </View>
            </TouchableOpacity>
          </View> : null}

          {booking.damages && booking.damages.length > 0 ? <View style={{flexDirection:'column',alignItems:'flex-start',justifyContent:'space-between',borderWidth:1,borderColor:'#FDBF3115',paddingHorizontal:16,paddingVertical:16,borderRadius:8,backgroundColor:'#FF8a3113',marginHorizontal:16,marginTop:16}}>
          
          <View style={{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',rowGap:16}}>
              <View style={{width:'100%',flexDirection:'row',alignItems:'center',justifyContent:'flex-start'}}>
                <MaterialIcons name='error' size={20} color='#ff0000'/>
              <CustomText fontType='primary' weight='SemiBold' style={{color:'#ff0000',fontSize:12,textTransform:'uppercase',letterSpacing:.15,marginLeft:8}}>Damage Reported</CustomText>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'100%'}}>
                    <View>  
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Damaged Part</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.damages[0].damagedPart.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Damage Type</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.damages[0].damageType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</CustomText>
                    </View>
              </View>

              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Status</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.damages[0].damageStatus.charAt(0).toUpperCase() + booking.damages[0].damageStatus.slice(1)}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'100%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Damage Description</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.damages[0].damageDescription}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'100%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Damage Images</CustomText>
                      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',gap:12,marginTop:8}}>

                      {
                        booking.damages[0].damageImage.split(',').map((image,index)=>(
                          <Image source={{uri:photoUrl(image)}} style={{width:'48%',height:100,borderRadius:6}} key={index}/>
                        ))
                      }
                      </View>
                    </View>
              </View>
          </View>
          
          </View> : null}
      </ScrollView>
  )
}

const RideInfo = ({booking}) => {
  return (
    <View>


              
              <View style={{paddingBottom:16,marginHorizontal:16,borderBottomWidth:1,borderBottomColor:'#1c1c1e'}}>
          
          <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',rowGap:16}}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Start Kms</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.startKms ? `${booking.startKms} Kms` : '-'}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Start Fuel</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.startFuel ? `${booking.startFuel}%` : '-'}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>End Kms</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.endKms ? `${booking.endKms} Kms` : '-'}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>End Fuel</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.endFuel ? `${booking.endFuel}%` : '-'}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Status</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={{...styles.bookingDetail,textTransform:'capitalize'}}>{booking.status}</CustomText>
                    </View>
              </View>
          </View>
          

          
          </View>
          {booking.status === BOOKING_FINISHED ? <View style={{paddingTop:16,marginHorizontal:16,}}>
                      <CustomText fontType='primary' weight='Bold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Review the guest</CustomText>
          
          <TouchableOpacity onPress={()=>setShowReview(true)}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
                <View style={{flexDirection:'column',alignItems:'flex-start',justifyContent:'flex-start'}}>
                      <FiveStar onPress={()=>setShowReview(true)} size={32} rating={booking.hostReview?.totalRating ? booking.hostReview.totalRating : 0}/>
                        {booking.hostReview?.comment ? <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3',fontSize:13}}>{booking.hostReview?.comment}</CustomText> : null}
                </View>
                {!booking.hostReview ? <View>
                  <Ionicons name='chevron-forward-outline' size={20} color='#454545'/>
                </View> : null}
            </View>
            </TouchableOpacity>
          </View> : null}
      </View>
  )
}


const Payment = ({booking}) => {
  return (
    <View>
              <View style={{paddingBottom:16,marginHorizontal:16,borderBottomWidth:1,borderBottomColor:'#1c1c1e'}}>
          
          <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Total Amount</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>Rs.{booking.totalAmount}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Refundable Deposit</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.depositAmount ? `Rs.${booking.depositAmount}` : 'N/A'}</CustomText>
                    </View>
              </View>
          </View>
          <View style={{marginTop:16,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Payment Method</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.paymentMethod ? booking.paymentMethod : 'N/A'}</CustomText>
                    </View>
              </View>
          </View>
          
          </View>



           {booking.isRefunded ?   <View style={{paddingBottom:16,marginHorizontal:16,borderBottomWidth:1,borderBottomColor:'#1c1c1e'}}>
          
          <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Refunded Amount</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.refundedAmount ? `Rs.${booking.refundedAmount}` : 'N/A'}</CustomText>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Refundable Deposit</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.depositAmount ? `Rs.${booking.depositAmount}` : 'N/A'}</CustomText>
                    </View>
              </View>
          </View>
          <View style={{marginTop:16,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                    <View>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Payment Method</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.paymentMethod ? booking.paymentMethod : 'N/A'}</CustomText>
                    </View>
              </View>
          </View>
          
          </View> : null}
    </View>
  )
}

const Documents = ({booking}) => {

  const startImages = booking.images.filter(image=>image.isStartImage === true)
  const endImages = booking.images.filter(image=>image.isEndImage === true)
  return (
    <View>
              <View style={{paddingBottom:16,marginHorizontal:16,}}>
          
          <View style={{marginTop:28,flexDirection:'column',alignItems:'flex-start',justifyContent:'space-between'}}>
            <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15,marginBottom:12}}>Start Images</CustomText>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',gap:12,flexWrap:'wrap'}}>
            {
              startImages?.map((image,index)=>{
                return <Image source={{uri:image.url}} style={{width:100,height:100,borderRadius:5,width:'48%'}}/>
              })
            }
            </View>
          </View>
         
         {endImages.length > 0 ? <View style={{marginTop:28,flexDirection:'column',alignItems:'flex-start',justifyContent:'space-between',borderTopWidth:1,borderTopColor:'#1c1c1e',paddingTop:16}}>
            <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15,marginBottom:12}}>End Images</CustomText>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',gap:12,flexWrap:'wrap'}}>
            {
              endImages?.map((image,index)=>{
                return <Image source={{uri:image.url}} style={{width:100,height:100,borderRadius:5,width:'48%'}}/>
              })
            }
            </View>
          </View> : null}
          
          </View>
    </View>
  )
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
              color={index < rating ? '#EDBF31' : '#a3a3a3'}
              />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View>
              <View style={{paddingVertical:40,marginHorizontal:16}}>
          
          <View style={{flexDirection:'column',alignItems:'flex-start',justifyContent:'space-between'}}>
              
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',marginBottom:28}}>
                    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15,width:'55%'}}>Comfort Rating</CustomText>
                      <StarRating rating={booking.review?.comfortRating ? booking.review.comfortRating : 0}/>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',marginBottom:28}}>
                    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15,width:'55%'}}>Host Rating</CustomText>
                      <StarRating rating={booking.review?.hostRating ? booking.review.hostRating : 0}/>
                    </View>
              </View>
              <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',marginBottom:28}}>
                    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15,width:'55%'}}>Cleanliness Rating</CustomText>
                      <StarRating rating={booking.review?.cleanlinessRating ? booking.review.cleanlinessRating : 0}/>
                    </View>
              </View>
              
              <View style={{flexDirection:'column',alignItems:'center',justifyContent:'flex-start',marginBottom:28}}>
                    <View style={{flexDirection:'column',justifyContent:'flex-start'}}>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Comment</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3',fontSize:12,letterSpacing:.15}}>{booking.review?.comment ? booking.review.comment : 'N/A'}</CustomText>
                    </View>
              </View>
              
          </View>
          
          </View>
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    backgroundColor:'#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
  },
  bookingInfo: {
    padding: 20,
    paddingBottom:8,
    paddingHorizontal:0
  },
  bookingTitle: {
    color: '#e3e3e3',
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
    color: '#e3e3e3',
    fontSize: 12,
    marginBottom: 10,
  },
  extendButton:{
    backgroundColor:'#EDBF31',
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
});
