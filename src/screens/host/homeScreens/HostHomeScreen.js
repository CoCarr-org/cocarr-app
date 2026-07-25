import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StatusBar, TouchableOpacity, Image, ScrollView, FlatList, TouchableHighlight, Dimensions, ToastAndroid, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { API_URL, BOOKING_BOOKED, BOOKING_CANCELLED, BOOKING_FINISHED, BOOKING_INITIATED, BOOKING_ONGOING, BRAND_COLOR } from '../../../utils/constants';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate, formatDateOnly, formatTime, getCurrentLocation, photoUrl } from '../../../utils/utils';
import CustomText from '../../../components/CustomText';
import { setSelectedCity, setShowCityLocation, setShowCityPicker } from '../../../store/bookingSlice';
import Carousel from 'react-native-reanimated-carousel';
import FiveStar from '../../../components/host/FiveStar';
// import Logo from '../../images/logo.png';
// import { BottomSheet, BottomSheetView } from '@gorhom/bottom-sheet';
// Cars awaiting admin approval surface first so hosts notice them.
const rankCar = (v) => (v.isDraft ? 2 : v.isAdminApproved ? 1 : 0);
const sortByApproval = (list) => [...(list || [])].sort((a, b) => rankCar(a) - rankCar(b));

export default function HostHomeScreen() {
  const navigator = useNavigation()
  const authInfo = useSelector((state) => state.auth);
  const { startDateTime, endDateTime,selectedCity,selectedLocation } = useSelector((state) => state.booking);
  const dispatch = useDispatch();
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showLocationValid, setShowLocationValid] = useState(false);
  const [showCityChange, setShowCityChange] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }


  

  return (
    <ScrollView style={{ flex: 1, backgroundColor:'#000'}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* <HomeIcon width={22} height={22} currentColor={color} /> */}
      {/* Title and profile live in TopBar now; keep the greeting only. */}
      <View style={{paddingHorizontal:16,paddingTop:4,paddingBottom:16}}>
        <CustomText fontType='primary' weight='Medium' style={{color:'#757575', fontSize:12}}>Hi, {authInfo?.userName}</CustomText>
      </View>

      {/* <PremiumMemberships/> */}

        {/* Cars and their scheduling are one list now — each car card expands to
            its availability windows, mirroring the web host dashboard. */}
        <CarsAndSchedules navigation={navigator} refreshing={refreshing}/>

{/* Bookings live on their own tab now, so the home feed no longer lists them. */}

{/*
            
          <WhyChooseCocarr/>

          <OfferSlider/> */}

          <FaqBlock/>

    </ScrollView>
  );
}


const PremiumMemberships = () => {
  const navigator = useNavigation()
  return (
    <TouchableHighlight underlayColor='#2C2C2E' onPress={()=>navigator.navigate('PremiumMembership')} style={{backgroundColor:'#1c1c1e',paddingHorizontal:0,paddingVertical:12,marginHorizontal:16,borderRadius:12,marginBottom:24}}>

    <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingVertical:0,paddingHorizontal:12,alignContent:"center",width:'100%'}} >

      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-start',paddingHorizontal:4,paddingVertical:2,width:'100%'}}>

        <View style={{backgroundColor:'#2c2c2e',borderRadius:8,height:32,width:32,justifyContent:'center',alignItems:'center'}}>
          <Icon name="star-outline" size={16} color={BRAND_COLOR}/> 
        </View>
        <View style={{flex:1}}>
        <CustomText fontType='primary' weight='Medium' style={{color:BRAND_COLOR, fontSize:12,letterSpacing:-0.05,marginLeft:12,lineHeight:16}}>Buy Premium Memberships and get 10% off on your all bookings</CustomText>
        </View>
        <View style={{marginLeft:'auto',paddingLeft:12}}>
          <Icon name="chevron-forward-outline" size={16} color={BRAND_COLOR}/>
        </View>
      </View>

    </View>
    </TouchableHighlight>
  )
}



const OfferSlider = ({navigation}) => {

  const [offers, setOffers] = useState([])

  const getOffers = async () => {
    const response = await axios.get(`${API_URL}/offers?limit=6`)
    setOffers(response.data)
  }

  useEffect(() => {
    getOffers()
  }, [])

  return (
    <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', backgroundColor:'#000'}}>
      <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingLeft:20,marginBottom:32}}> 
          <Text style={{color:'#e3e3e3', fontSize:16, fontWeight:'500',marginBottom:1}}>
            Offers
          </Text>
          <Text style={{color:'#a3a3a3', fontSize:12, fontWeight:'400'}}>
          Get exciting discounts and deals on your rides
          </Text>

      </View>
          <ScrollView alwaysBounceHorizontal={true} horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row'}}>
            {offers.length === 0 ? (
              <>
                {[1,2,3].map((item) => (
                  <View key={item} style={{marginRight: 16}}>
                    <View style={{
                      width: 180,
                      height: 120,
                      borderRadius: 10,
                      backgroundColor: '#1C1C1E',
                      opacity: 0.7
                    }}>
                      <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#1C1C1E',
                        opacity: 0.3,
                        transform: [{translateX: -100}],
                        animation: 'shimmer 1s infinite'
                      }} />
                    </View>
                    <View style={{marginTop: 8}}>
                      <View style={{
                        width: 80,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: '#1C1C1E',
                        marginBottom: 4,
                        opacity: 0.7
                      }} />
                      <View style={{
                        width: 60,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: '#1C1C1E',
                        opacity: 0.7
                      }} />
                    </View>
                  </View>
                ))}
              </>
            ) : (
              offers.map((car,index) => (
                <TouchableOpacity key={index} style={{marginRight: 16,marginLeft:index === 0 ? 24 : 0, backgroundColor:'#1C1C1E',borderRadius:10,borderWidth:1,borderColor:'#252525',paddingVertical:12,paddingHorizontal:16}} >
                  {/* {car.images && car.images.length > 0 && <Image source={{uri:car.images[0].url}} style={{width:180, height:120, borderRadius:10,borderBottomLeftRadius:0,borderBottomRightRadius:0,backgroundColor:'#757575'}}/>} */}
                  <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'flex-start',paddingVertical:8,paddingHorizontal:12}}>
                    <CustomText fontType='primary' weight='Regular' style={{color:'#fff', fontSize:13,marginBottom:4, fontWeight:'400'}}>{car.description}</CustomText>
                    <CustomText fontType='primary' weight='Medium' style={{color:'#EDBF31', fontSize:11, fontWeight:'500',marginTop:2}}>CODE: {car.code}</CustomText>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
         
        </View>
  )
}


const STATUS = (car) => car.isDraft ? 'draft' : car.isAdminApproved ? 'live' : 'pending';

// Combined cars + scheduling, mirroring the web host dashboard: one vertical
// list of cars, each card expandable to show that car's upcoming availability
// windows and an "Add schedule" action. Replaces the old split of a horizontal
// car strip on top and a separate schedule list at the bottom.
const CarsAndSchedules = ({ navigation, refreshing }) => {
  const [cars, setCars] = useState([]);
  const [schedulesByCar, setSchedulesByCar] = useState({});
  const [openCar, setOpenCar] = useState(null);

  const load = async () => {
    try {
      const [carsRes, schedRes] = await Promise.all([
        axios.get(`${API_URL}/host/vehicles?limit=20&sortBy=-createdAt`),
        axios.get(`${API_URL}/host/schedule?limit=100&sortBy=startTime`),
      ]);
      setCars(sortByApproval(carsRes.data.vehicles || []));
      const grouped = {};
      for (const s of (schedRes.data.schedules || [])) {
        const vid = s.vehicleId || s.vehicle?.id;
        if (!vid) continue;
        (grouped[vid] = grouped[vid] || []).push(s);
      }
      setSchedulesByCar(grouped);
    } catch (error) {
      console.log('Error loading cars/schedules:', error?.response?.data || error?.message);
    }
  };

  useEffect(() => { load(); }, [refreshing]);

  const Badge = ({ status }) => {
    const map = {
      draft:   { bg:'#26262a', bd:'#3a3a40', dot:'#b9b9c2', fg:'#b9b9c2', label:'Not Completed' },
      pending: { bg:'#EDBF3122', bd:'#EDBF3166', dot:BRAND_COLOR, fg:BRAND_COLOR, label:'Pending Approval' },
      live:    { bg:'#3fce8f22', bd:'#3fce8f59', dot:'#6ee6b0', fg:'#6ee6b0', label:'Live' },
    }[status];
    return (
      <View style={{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor:map.bg, borderWidth:1, borderColor:map.bd, borderRadius:100, paddingVertical:2, paddingHorizontal:8 }}>
        <View style={{ width:5, height:5, borderRadius:5, backgroundColor:map.dot }} />
        <CustomText fontType='primary' weight='Bold' style={{ color:map.fg, fontSize:9, letterSpacing:.15 }}>{map.label}</CustomText>
      </View>
    );
  };

  return (
    <View style={{ paddingHorizontal:16, paddingVertical:16 }}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <CustomText fontType='primary' weight='Bold' style={{ color:'#757575', fontSize:11, letterSpacing:.15, textTransform:'uppercase' }}>My Cars &amp; Schedules</CustomText>
        <TouchableOpacity onPress={() => navigation.navigate('AddCar')} style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
          <Icon name="add-circle-outline" size={16} color={BRAND_COLOR} />
          <CustomText fontType='primary' weight='Bold' style={{ color:BRAND_COLOR, fontSize:10, textTransform:'uppercase', letterSpacing:.15 }}>Add car</CustomText>
        </TouchableOpacity>
      </View>

      {cars.length === 0 && (
        <TouchableOpacity onPress={() => navigation.navigate('AddCar')} style={{ backgroundColor:'#141414', borderRadius:12, borderWidth:1, borderColor:'#252525', borderStyle:'dashed', paddingVertical:28, alignItems:'center' }}>
          <Icon name="add-circle-outline" size={26} color="#959595" style={{ marginBottom:6 }} />
          <CustomText fontType='primary' weight='SemiBold' style={{ color:'#959595', fontSize:11, textTransform:'uppercase', letterSpacing:.15 }}>List your first car</CustomText>
        </TouchableOpacity>
      )}

      {cars.map((car) => {
        const status = STATUS(car);
        const canSchedule = status === 'live';
        const upcoming = schedulesByCar[car.id] || [];
        const isOpen = openCar === car.id;
        return (
          <View key={car.id} style={{ backgroundColor:'#1c1c1e', borderRadius:12, marginBottom:12, overflow:'hidden', borderWidth:1, borderColor:'#232327' }}>
            {/* Card body → detail (or resume onboarding for a draft). */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => car.isDraft ? navigation.navigate('AddCar', { vehicleId: car.id }) : navigation.navigate('HostCarInfo', { vehicleId: car.id })}
              style={{ flexDirection:'row', padding:12, gap:12 }}
            >
              <View style={{ width:88, height:66, borderRadius:8, backgroundColor:'#2c2c2e', overflow:'hidden' }}>
                {car.images && car.images[0] && (
                  <Image source={{ uri: photoUrl(car.images[0].url) }} style={{ width:'100%', height:'100%' }} resizeMode="cover" />
                )}
              </View>
              <View style={{ flex:1, justifyContent:'center' }}>
                <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                  <Badge status={status} />
                  <CustomText fontType='primary' weight='Medium' style={{ color:'#a3a3a3', fontSize:11 }}>{car.vehicleNumber}</CustomText>
                </View>
                <CustomText fontType='primary' weight='SemiBold' numberOfLines={1} style={{ color:'#e3e3e3', fontSize:13 }}>{car.brand?.name} {car.vehicleName}</CustomText>
              </View>
            </TouchableOpacity>

            {/* Schedule assistance — only for approved cars, as on web. */}
            {canSchedule ? (
              <>
                <TouchableOpacity onPress={() => setOpenCar(isOpen ? null : car.id)} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:12, paddingVertical:11, borderTopWidth:1, borderTopColor:'#232327' }}>
                  <CustomText fontType='primary' weight='Bold' style={{ color:'#e3e3e3', fontSize:11, letterSpacing:.15 }}>📅  Schedule</CustomText>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                    <CustomText fontType='primary' weight='Medium' style={{ color:'#8a8a8a', fontSize:11 }}>{upcoming.length ? `${upcoming.length} upcoming` : 'None set'}</CustomText>
                    <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} color="#8a8a8a" />
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={{ paddingHorizontal:12, paddingBottom:12 }}>
                    {upcoming.length === 0 ? (
                      <CustomText fontType='primary' weight='Regular' style={{ color:'#757575', fontSize:12, paddingVertical:6 }}>No upcoming availability windows for this car.</CustomText>
                    ) : (
                      upcoming.slice(0, 6).map((s) => (
                        <TouchableOpacity key={s.id} onPress={() => navigation.navigate('ScheduleInfo', { scheduleId: s.id })} style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#151519', borderRadius:8, paddingVertical:10, paddingHorizontal:12, marginBottom:8 }}>
                          <View>
                            <CustomText fontType='primary' weight='Medium' style={{ color:'#e3e3e3', fontSize:12 }}>{formatDateOnly(s.startTime)} → {formatDateOnly(s.endTime)}</CustomText>
                            <CustomText fontType='primary' weight='Regular' style={{ color:'#8a8a8a', fontSize:10 }}>{formatTime(s.startTime)} – {formatTime(s.endTime)}{s.scheduleBlocks && s.scheduleBlocks.length > 0 ? `  ·  ${s.scheduleBlocks.length} pause(s)` : ''}</CustomText>
                          </View>
                          <Icon name="chevron-forward" size={14} color="#5a5a62" />
                        </TouchableOpacity>
                      ))
                    )}
                    <TouchableOpacity onPress={() => navigation.navigate('CreateSchedule', { vehicleId: car.id })} style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, backgroundColor:'#EDBF3122', borderRadius:8, paddingVertical:11, marginTop:2 }}>
                      <Icon name="add-circle-outline" size={16} color={BRAND_COLOR} />
                      <CustomText fontType='primary' weight='Bold' style={{ color:BRAND_COLOR, fontSize:10, textTransform:'uppercase', letterSpacing:.15 }}>Add schedule</CustomText>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            ) : (
              <View style={{ paddingHorizontal:12, paddingVertical:10, borderTopWidth:1, borderTopColor:'#232327' }}>
                <CustomText fontType='primary' weight='Regular' style={{ color:'#5a5a62', fontSize:11 }}>
                  {status === 'draft' ? 'Finish onboarding to enable scheduling.' : 'Scheduling unlocks once this car is approved.'}
                </CustomText>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
};


const FeaturedCars = () => {
  return (
    <View>
      <CustomText fontType='primary' weight='Bold' style={{color:'#fff', fontSize:14,textTransform:'uppercase',letterSpacing:.15,marginBottom:12}}>Cars</CustomText>
    </View>
  )
}


const OfferBannerBlock = () => {
  const width = Dimensions.get('window').width;
  const images = [{image:'https://cocarr.s3.ap-south-1.amazonaws.com/183ff1c2-1f85-43f8-9684-81401e41d86c'},{image:'https://cocarr.s3.ap-south-1.amazonaws.com/183ff1c2-1f85-43f8-9684-81401e41d86c'},{image:'https://cocarr.s3.ap-south-1.amazonaws.com/183ff1c2-1f85-43f8-9684-81401e41d86c'}]
  return (
    <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingVertical:40,paddingHorizontal:24}}>
      <CustomText fontType='primary' weight='Bold' style={{color:'#fff', fontSize:14,textTransform:'uppercase',letterSpacing:.15,marginBottom:12}}>Offers</CustomText>
      {/* {images.length > 0 ? ( */}
        <Carousel style={{width:width,height:320}} 
        loop
        width={280}
        height={320}
        autoPlay={true}
        data={images}
        scrollAnimationDuration={3000}
        // pagingEnabled={true}
        // mode='horizontal-stack'
        // snapEnabled={true}
        // dragEnabled={true}
        autoPlayInterval={4000}
        // key={index}
        
        renderItem={({ item:it ,index}) => {
          console.log('it',it)
          return (
            <View
            style={{
              flex: 1,
              borderWidth: 1,
              justifyContent: 'center',
              backgroundColor:'#1C1C1E',
              borderRadius:10,
              marginRight:12,
              // transform: [{translateX:in -100}],
              // animation: 'shimmer 1s infinite'
              overflow:'hidden'
            }}
            >
                <Image source={{ uri: it.image }} key={index} style={{width:'100%',height:320,borderRadius:10}}/>
            </View> 
            )
          }}
          />
        {/* ) : null} */}
      </View>
  )
}


const FaqBlock = () => {

  const [activeQuestion, setActiveQuestion] = useState(0)
  const faqData = [
    {question:'How to add my car?', answer:'You can add your car by clicking on the "Add Car" button on the home screen.'},
    {question:'How do i get the payment?', answer:'You will get the payment every week for all the cars you have serviced.'},
    {question:'Do you verify the cars?', answer:'Yes, we verify the cars before they are added to the platform.'},
  ]

  const renderItem = ({item}) => {
    return (
      <View style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#2c2c2e'}}>
        <CustomText fontType='primary' weight='Bold' style={{color:'#757575', fontSize:11, fontWeight:'500',marginBottom:4,textTransform:'uppercase',letterSpacing:.15,fontFamily:'Inter-Bold',marginBottom:2}}>{item.question}</CustomText>
        <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3', fontSize:12, fontWeight:'400',lineHeight:18}}>{item.answer}</CustomText>
      </View>
    )
  }
  return (
    <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingVertical:40,paddingHorizontal:24}}>
      <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingLeft:20,marginBottom:32}}> 
          <CustomText fontType='primary' weight='Medium' style={{color:'#e3e3e3', fontSize:16, fontWeight:'500',marginBottom:1}}>
            FAQ
          </CustomText>
      </View>
      <View>
        {faqData.map((item,index) => (
          <View key={index} style={{paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#2c2c2e'}}>
            <CustomText fontType='primary' weight='Bold' style={{color:'#757575', fontSize:11, fontWeight:'500',marginBottom:4,textTransform:'uppercase',letterSpacing:.15,fontFamily:'Inter-Bold',marginBottom:2}}>{item.question}</CustomText>
            <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3', fontSize:12, fontWeight:'400',lineHeight:18}}>{item.answer}</CustomText>
          </View>
        ))}
      </View>
    </View>
  )
}