import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, TouchableHighlight, Dimensions, Linking, ScrollView, ToastAndroid } from 'react-native';
import axios from 'axios';
import { API_URL, BOOKING_BOOKED, BOOKING_FINISHED, BRAND_COLOR } from '../../utils/constants';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate, photoUrl, notify } from '../../utils/utils';
import HeaderBlock from '../../components/CenterHeader';
import CustomText from '../../components/CustomText';
import Icon from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
// import { setShowCancelRide } from '../../store/bookingSlice';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { CancelScreen } from './CancelScreen';
import ExtensionScreen from './ExtensionScreen';
import FiveStar from '../../components/host/FiveStar';
import  RescheduleSummary  from './RescheduleSummary';
export default function RideInfoScreen({ route,navigation }) {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const authInfo = useSelector((state) => state.auth);
  const [showExtension, setShowExtension] = useState(false);
  const [showCancelRide, setShowCancelRide] = useState(false);
  const [showPaymentResult, setShowPaymentResult] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const dispatch = useDispatch();

  const getBookingInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/booking/${bookingId}`);
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


  const onCancel = async () => {
    await getBookingInfo();
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


  const onReschedule = () => {
    setShowReschedule(true);
    if(booking.isRescheduled) {
      notify('Booking is already rescheduled');
    } else if(new Date(booking.startTime) < new Date()) {
      notify('You cannot reschedule a ride after start time');
    } else {
      // setShowReschedule(true);
      navigation.navigate('RescheduleScreen',{id:booking.id});
    }
  }

  const onStartRide = () => {
    const startTime = new Date(booking.startTime);
              const now = new Date();
              const timeDiff = startTime - now;
              const minutesDiff = timeDiff / (1000 * 60);
              
              if (minutesDiff <= 30 && minutesDiff >= -30) {
                navigation.navigate('StartBooking', {bookingId: booking.bookingId})
              } else {
                navigation.navigate('StartBooking', {bookingId: booking.bookingId})
                // notify('Ride can be started only within 30 mins of start time');
              }
    
  }
  return (
    <View style={styles.container}>
      <HeaderBlock title="Ride Info" navigation={navigation} showBackButton={true} customSecondaryText={`#${booking.bookingId}`} />
      {/* Vehicle image carousel, with the car info below it (like the car
          detail screen) rather than overlaid on the photo. */}
      <VehicleGallery vehicle={booking.vehicle} />
      <TabViewInfo booking={booking}/>
      {booking.status === BOOKING_BOOKED ? <View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:16}}>
          <TouchableHighlight 
            style={[
              styles.cancelButton,
              {marginRight:8}
              // {flex:1}
            ]} 
            onPress={()=>setShowCancelRide(booking)}
            >
            {/* <CustomText fontType='primary' weight='Bold' style={{ fontSize:12, fontWeight:'500',textTransform:'uppercase',color:'#ff3f33BA',textAlign:'center'}}>{'Cancel'}</CustomText> */}
            <Ionicons name='close-circle-outline' size={24} color={'#ff3f33BA'}/>
          </TouchableHighlight>

          {!booking.isRescheduled || (new Date(booking.startTime) < new Date())  ? <TouchableHighlight 
            style={[
              styles.extendButton,
              {backgroundColor:'#EDBF3135',paddingVertical:12}
            ]} 
            onPress={onReschedule}
            >
            <Ionicons name='time-outline' size={24} color={BRAND_COLOR}/>
          </TouchableHighlight> : null}
          <TouchableHighlight 
            style={[
              styles.extendButton,
              {backgroundColor:'#EDBF3135',paddingVertical:16,flex:1,marginRight:0,marginLeft:8}
            ]} 
            onPress={onStartRide}
            >
            <CustomText fontType='primary' weight='Bold' style={{ fontSize:12, fontWeight:'500',textTransform:'uppercase',color:BRAND_COLOR,textAlign:'center'}}>{'Start Ride'}</CustomText>
          </TouchableHighlight>
      </View> : null}

        {booking.status === 'ongoing' ? <View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:16}}>
          <TouchableHighlight 
            style={[
              styles.cancelButton,
            ]} 
            onPress={()=>navigation.navigate('EndBooking',{bookingId:booking.bookingId})}
            >
            <CustomText fontType='primary' weight='Bold' style={{ fontSize:12, fontWeight:'500',textTransform:'uppercase',color:BRAND_COLOR,textAlign:'center',color:'#ff3f33BA'}}>{'End Ride'}</CustomText>
          </TouchableHighlight>
           <TouchableHighlight 
            style={[
              styles.extendButton,
              {backgroundColor:'#EDBF3135',paddingVertical:12,flex:1,marginRight:0,marginLeft:8}
            ]} 
            onPress={()=>setShowExtension(booking)}
            >
            <CustomText fontType='primary' weight='Bold' style={{ color:'#EDBF31',fontSize:12, fontWeight:'500',textTransform:'uppercase',textAlign:'center'}}>{'Extend Ride'}</CustomText>
          </TouchableHighlight>
          </View>  : null}
          
          {showPaymentResult ? <PaymentResultPopup response={showPaymentResult} /> : null}
          {showExtension ? <ExtensionScreen getBookingInfo={getBookingInfo} setShowPaymentResult={setShowPaymentResult} booking={booking} show={showExtension} setShow={setShowExtension}/> : null}
          {showCancelRide ? <CancelScreen showCancelRide={showCancelRide} setShowCancelRide={setShowCancelRide} getBookingInfo={getBookingInfo}/> : null}
          {showReschedule ? <RescheduleSummary show={showReschedule} setShow={setShowReschedule} id={booking.id}/> : null}
    </View>
  );
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



// Swipeable vehicle image carousel with the car name/specs below it.
const VehicleGallery = ({ vehicle }) => {
  const images = (vehicle?.images || []).filter((i) => !i.isDeleted);
  const [idx, setIdx] = useState(0);
  const width = Dimensions.get('window').width;
  return (
    <View>
      {images.length > 0 ? (
        <View>
          <ScrollView
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {images.map((im, i) => (
              <Image key={im.id || i} source={{ uri: photoUrl(im.url) }} style={{ width, height: 200, backgroundColor: '#1c1c1e' }} resizeMode="cover" />
            ))}
          </ScrollView>
          {images.length > 1 && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: -18 }}>
              {images.map((_, i) => (
                <View key={i} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === idx ? BRAND_COLOR : '#5a5a62' }} />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={{ width: '100%', height: 200, backgroundColor: '#1c1c1e', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="car-outline" size={40} color="#3a3a40" />
        </View>
      )}

      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
        <CustomText fontType='primary' weight='Bold' style={{ color: '#f0f0f2', fontSize: 18, letterSpacing: -.3 }}>{vehicle.brand?.name} {vehicle.vehicleName}</CustomText>
        <CustomText fontType='primary' weight='Regular' style={{ color: '#a3a3a3', fontSize: 10, textTransform: 'uppercase', letterSpacing: .15, marginTop: 3 }}>{vehicle.vehicleFuelType} · {vehicle.vehicleSeats} Seater · {vehicle.vehicleYear}</CustomText>
      </View>
    </View>
  );
};

const TabViewInfo = ({booking}) => {

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'overview', title: 'Overview' },
    { key: 'rideInfo', title: 'Ride Info' },
    { key: 'payment', title: 'Payment Info' },
    { key: 'review', title: 'Review' },
    { key: 'documents', title: 'Photos' },
  ]);

  const renderScene = SceneMap({
    overview: ()=><Overview booking={booking}/>,
    payment: ()=><Payment booking={booking}/>,
    rideInfo: ()=><RideInfo booking={booking}/>,
    review: ()=><Review booking={booking}/>,
    documents: ()=><Documents booking={booking}/>
  });

  const renderTabBar = (props) => {
    return (
      <TabBar
      {...props}
      // tabStyle={{...props.tabStyle}}
      // tabStyle={{...props.tabStyle,width:'auto'}}
      style={{backgroundColor:'#000'}}
      indicatorStyle={{backgroundColor:BRAND_COLOR,height:0}}
      labelStyle={{color:'#fff',fontSize:8,fontWeight:'500',textTransform:'uppercase',letterSpacing:.15}}
      activeColor='#fff'
      renderTabBarItem={props => {
        const active = props.navigationState.routes[props.navigationState.index].key === props.route.key ? true : false;
          return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setIndex(routes.findIndex(r => r.key === props.route.key))} style={{paddingVertical:8,paddingHorizontal:18,backgroundColor:!active ? '#1c1c1e' : '#EDBF313A',marginRight:12,borderRadius:24,marginLeft:props.route.key === 'overview' ? 16 : 0}}>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                  <Text style={{color:active ? BRAND_COLOR : '#757575',fontSize:10,fontWeight:'600',textTransform:'uppercase',letterSpacing:.15}}>{props.route.title}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
        inactiveColor='#757575'
      />
    )
  }
  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      overdrag={true}
      style={{backgroundColor:'#000'}}
      
      renderTabBar={(props)=>renderTabBar(props)}
      // initialLayout={{ width: Dimensions.get('window').width }}
    />
  ) 
}



const Overview = ({booking}) => {

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

  console.log('booking',booking.vehicle?.host?.user?.profilePhoto)
  return (
    <ScrollView style={{flex:1}}>

        <View style={{marginTop:32,paddingBottom:16,marginHorizontal:16}}>

        <View style={{flexDirection:'column',alignItems:'flex-start',justifyContent:'space-between',borderWidth:1,borderColor:'#EDBF3115',paddingHorizontal:16,paddingVertical:12,borderRadius:8,backgroundColor:'#EDBF3113'}}>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
        <View style={{flexDirection:'column', alignItems:'flex-start',backgroundColor:'#1c1c1e',borderRadius:40,width:40,height:40,justifyContent:'center',alignItems:'center',marginRight:12}}>
        {booking.vehicle?.host?.user?.profilePhoto && <Image source={{uri:photoUrl(booking.vehicle?.host?.user?.profilePhoto)}} style={{width:40, height:40, borderRadius:40}}/>}
        </View>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',flex:1}}>
            <View style={{flexDirection:'column',alignItems:'flex-start',justifyContent:'space-between'}}>
            <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,letterSpacing:.15,textTransform:'uppercase'}}>Host Name</CustomText>
                <CustomText fontType='primary' weight='Medium' style={{color:'#f3f3f3',fontSize:14,letterSpacing:.15}}>{booking.vehicle?.host ? booking.vehicle?.host?.user?.name : 'Cocarr'}</CustomText>
            </View>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:12,flex:1}}>
                <TouchableHighlight onPress={()=>Linking.openURL(`tel:${booking.vehicle?.host?.user?.contactNumber}`)}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,paddingVertical:4,paddingHorizontal:8,borderRadius:12,height:48,width:48,backgroundColor:'#EDBF3115'}}>
                  <Ionicons name='call-outline' size={16} color='#EDBF31'/>
                </View>
                </TouchableHighlight>
            </View>
        </View>
          </View>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingTop:18,paddingBottom:18,borderTopWidth:1,borderTopColor:'#1c1c1e',marginTop:12,width:'100%'}}>
        <CustomText numberOfLines={2} fontType='primary' weight='Medium' style={{color:'#a3a3a3',fontSize:12,letterSpacing:.15,lineHeight:18}}>{booking.vehicle.pickupPoint.name}{booking.vehicle.pickupPoint.city.name}</CustomText>
        <TouchableHighlight onPress={()=>Linking.openURL(`https://maps.google.com/?q=${booking.vehicle?.pickupPoint?.lat},${booking.vehicle?.pickupPoint?.long}`)}>
                <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,paddingVertical:4,paddingHorizontal:8,borderRadius:12,height:48,width:48,backgroundColor:'#EDBF3115'}}>
                  <Ionicons name='location-outline' size={16} color='#EDBF31'/>
                </View>
                </TouchableHighlight>
        </View>
        </View>

        </View>

              <View style={{paddingBottom:16,marginHorizontal:16,borderBottomWidth:1,borderBottomColor:'#1c1c1e'}}>
          
          <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
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
          </View>
          <View style={{marginTop:16,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between'}}>
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
          </View>
          
          </View>

          {booking.status === BOOKING_FINISHED ? <View style={{paddingBottom:16,marginHorizontal:16,marginTop:28}}>
                    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15,width:'55%'}}>Rated by host</CustomText>
                      <StarRating rating={booking.hostReview ? booking.hostReview.rating : 0}/>
                    </View>
              </View> : null}
    </ScrollView>
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
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Damage Protection</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.protectionPlanFee ? `Rs.${booking.protectionPlanFee}` : 'N/A'}</CustomText>
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
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>End Kms</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={styles.bookingDetail}>{booking.endKms ? `${booking.endKms} Kms` : '-'}</CustomText>
                    </View>
              </View>
              
                    <View style={{flexDirection:'column',alignItems:'flex-start',justifyContent:'flex-start',width:'50%'}}>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Status</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={{...styles.bookingDetail,textTransform:'capitalize'}}>{booking.status}</CustomText>
                    </View>
              
                    <View style={{flexDirection:'column',alignItems:'flex-start',justifyContent:'flex-start',width:'50%'}}>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Booking Type</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={{...styles.bookingDetail,textTransform:'capitalize'}}>{booking.deliveryType === 'self' ? 'Self Pickup' : 'Doorstep Delivery'}</CustomText>
                    </View>
                    </View>
          </View>
      </View>
  )
}

const Documents = ({booking}) => {
  const startImages = (booking?.images || []).filter(image => image.isStartImage === true);
  const endImages = (booking?.images || []).filter(image => image.isEndImage === true);
  return (
    <ScrollView style={{flex:1}}>
              <View style={{paddingBottom:16,marginHorizontal:16,marginTop:24}}>
          
              <View style={{flexDirection:'column',justifyContent:'space-between'}}>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15,marginBottom:12}}>Ride Start Images</CustomText>
                    <View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'flex-start',gap:12}}>
                      {
                        startImages.map((image,index)=>(
                          <View key={image.id || index} style={{width:'48%'}}>
                            <Image source={{uri:photoUrl(image.url)}} style={{width:'100%',height:100,borderRadius:6}}/>
                          </View>
                        ))
                      }
                    </View>
              </View>
             
              {endImages.length > 0 ? <View style={{flexDirection:'column',marginTop:24,borderTopWidth:1,borderTopColor:'#1c1c1e',paddingTop:16}}>
                      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Ride End Image</CustomText>
                    <View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'flex-start',gap:12}}>
                      {
                        endImages.map((image,index)=>(
                          <View key={image.id || index} style={{width:'48%',position:'relative'}}>
                            <View >
                                <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15,paddingBottom:8}}>{image.type}</CustomText>
                            </View>
                            <Image source={{uri:photoUrl(image.url)}} style={{width:'100%',height:100,borderRadius:6}}/>
                          </View>
                        ))
                      }
                    </View>
              </View> : null}
          </View>
    </ScrollView>
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
    // marginHorizontal:8,
    // marginBottom:16
  },
  cancelButton:{
    backgroundColor:'#ff333325',
    // opacity:0.25,
    // width:,
    padding:12,
    borderRadius:8,
    // marginHorizontal:16,
    // marginBottom:16
  }
});
