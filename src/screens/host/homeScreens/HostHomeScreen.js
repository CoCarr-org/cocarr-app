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

const greetingFor = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function HostHomeScreen() {
  const navigator = useNavigation();
  const authInfo = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  // Shared fetch — the dashboard tiles and the scheduling assistant read from
  // the same vehicles/schedules/bookings/wallet, so pull them once here.
  const [vehicles, setVehicles] = useState([]);
  const [schedulesByCar, setSchedulesByCar] = useState({});
  const [bookings, setBookings] = useState([]);
  const [wallet, setWallet] = useState(null);

  const load = useCallback(async () => {
    try {
      const [carsRes, schedRes, bookingsRes, walletRes] = await Promise.all([
        axios.get(`${API_URL}/host/vehicles?limit=30&sortBy=-createdAt`),
        axios.get(`${API_URL}/host/schedule?limit=100&sortBy=startTime`),
        axios.get(`${API_URL}/host/bookings?populate=true&sortBy=-createdAt&offset=0&limit=25`).catch(() => ({ data: {} })),
        axios.get(`${API_URL}/wallet/my-wallet`).catch(() => ({ data: null })),
      ]);
      setVehicles(sortByApproval(carsRes.data.vehicles || []));
      const grouped = {};
      for (const s of (schedRes.data.schedules || [])) {
        const vid = s.vehicleId || s.vehicle?.id;
        if (vid) (grouped[vid] = grouped[vid] || []).push(s);
      }
      setSchedulesByCar(grouped);
      setBookings(bookingsRes.data?.bookings || bookingsRes.data?.data || []);
      setWallet(walletRes.data?.wallet || walletRes.data?.data || walletRes.data || null);
    } catch (error) {
      console.log('Host home load error:', error?.response?.data || error?.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor:'#000'}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Title and profile live in TopBar; a greeting sets the dashboard tone. */}
      <View style={{paddingHorizontal:16,paddingTop:4,paddingBottom:12}}>
        <CustomText fontType='primary' weight='Medium' style={{color:'#757575', fontSize:12}}>{greetingFor()},</CustomText>
        <CustomText fontType='primary' weight='Bold' style={{color:'#f0f0f2', fontSize:18, letterSpacing:-.3}}>{authInfo?.userName || 'Host'}</CustomText>
      </View>

      {/* Dashboard at a glance — mirrors the web host dashboard KPI tiles. */}
      <HostDashboard vehicles={vehicles} bookings={bookings} wallet={wallet} navigation={navigator} />

      {/* Scheduling assistant — pick a car, manage its availability. Distinct
          from the Cars tab, which is the full management list. */}
      <SchedulingAssistant vehicles={vehicles} schedulesByCar={schedulesByCar} navigation={navigator} />

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

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// ── Dashboard tiles ───────────────────────────────────────────────────────────
// Mirrors the web host dashboard KPI row: live cars, active bookings, wallet,
// average rating.
const HostDashboard = ({ vehicles, bookings, wallet, navigation }) => {
  const liveCars = vehicles.filter((v) => !v.isDraft);
  const draftCount = vehicles.length - liveCars.length;
  const activeBookings = bookings.filter((b) => b.status === 'booked' || b.status === 'ongoing').length;
  const ratedCars = liveCars.filter((v) => v.rating > 0);
  const avgRating = ratedCars.length
    ? (ratedCars.reduce((a, v) => a + Number(v.rating || 0), 0) / ratedCars.length).toFixed(1)
    : null;
  const totalRides = vehicles.reduce((a, v) => a + (Number(v.totalRides) || 0), 0);
  const balance = wallet?.balance ?? wallet?.points ?? wallet?.walletPoints;

  const tiles = [
    { icon: 'car-sport', label: 'Live cars', value: String(liveCars.length), sub: draftCount ? `${draftCount} in draft` : 'All published' },
    { icon: 'calendar', label: 'Active bookings', value: String(activeBookings), sub: `${bookings.length} shown` },
    { icon: 'wallet', label: 'Wallet', value: balance != null ? inr(balance) : '—', sub: 'View earnings', onPress: () => navigation.navigate('HostEarnings') },
    { icon: 'star', label: 'Avg rating', value: avgRating || 'New', sub: `${totalRides} rides` },
  ];

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {tiles.map((t) => {
          const Wrapper = t.onPress ? TouchableOpacity : View;
          return (
            <Wrapper key={t.label} onPress={t.onPress} activeOpacity={0.85}
              style={{ width: '47.8%', backgroundColor: '#141416', borderRadius: 14, borderWidth: 1, borderColor: '#232327', padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: '#EDBF3115', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={t.icon} size={15} color={BRAND_COLOR} />
                </View>
                {t.onPress && <Icon name="chevron-forward" size={14} color="#5a5a62" />}
              </View>
              <CustomText fontType='primary' weight='Bold' style={{ color: '#f0f0f2', fontSize: 20, letterSpacing: -.4 }}>{t.value}</CustomText>
              <CustomText fontType='primary' weight='SemiBold' style={{ color: '#b3b3b8', fontSize: 11, marginTop: 2 }}>{t.label}</CustomText>
              <CustomText fontType='primary' weight='Regular' style={{ color: '#6f6f76', fontSize: 10, marginTop: 1 }}>{t.sub}</CustomText>
            </Wrapper>
          );
        })}
      </View>
    </View>
  );
};

// ── Scheduling assistant ──────────────────────────────────────────────────────
// Pick a car from a horizontal strip, then see and manage that one car's
// availability below. Deliberately different from the Cars tab (a full vertical
// management list) so home reads as "scheduling", not "manage cars".
const SchedulingAssistant = ({ vehicles, schedulesByCar, navigation }) => {
  const [selectedId, setSelectedId] = useState(null);

  // Default the selection to the first car once loaded.
  useEffect(() => {
    if (!selectedId && vehicles.length) setSelectedId(vehicles[0].id);
  }, [vehicles, selectedId]);

  if (vehicles.length === 0) {
    return (
      <View style={{ paddingHorizontal: 16, marginTop: 12, marginBottom: 16 }}>
        <TouchableOpacity onPress={() => navigation.navigate('AddCar')}
          style={{ backgroundColor: '#141414', borderRadius: 12, borderWidth: 1, borderColor: '#252525', borderStyle: 'dashed', paddingVertical: 26, alignItems: 'center' }}>
          <Icon name="add-circle-outline" size={26} color="#959595" style={{ marginBottom: 6 }} />
          <CustomText fontType='primary' weight='SemiBold' style={{ color: '#959595', fontSize: 11, textTransform: 'uppercase', letterSpacing: .15 }}>List your first car</CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  const selected = vehicles.find((v) => v.id === selectedId) || vehicles[0];
  const status = STATUS(selected);
  const canSchedule = status === 'live';
  const upcoming = schedulesByCar[selected.id] || [];

  return (
    <View style={{ marginTop: 8, marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 }}>
        <CustomText fontType='primary' weight='Bold' style={{ color: '#757575', fontSize: 11, letterSpacing: .15, textTransform: 'uppercase' }}>Schedule a car</CustomText>
        <TouchableOpacity onPress={() => navigation.navigate('AddCar')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="add-circle-outline" size={15} color={BRAND_COLOR} />
          <CustomText fontType='primary' weight='Bold' style={{ color: BRAND_COLOR, fontSize: 10, textTransform: 'uppercase', letterSpacing: .15 }}>Add car</CustomText>
        </TouchableOpacity>
      </View>

      {/* Car selector strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {vehicles.map((v) => {
          const active = v.id === selected.id;
          const st = STATUS(v);
          const dot = st === 'live' ? '#6ee6b0' : st === 'pending' ? BRAND_COLOR : '#b9b9c2';
          return (
            <TouchableOpacity key={v.id} onPress={() => setSelectedId(v.id)} activeOpacity={0.85}
              style={{ width: 132, borderRadius: 12, overflow: 'hidden', backgroundColor: '#151517', borderWidth: 1.5, borderColor: active ? BRAND_COLOR : '#232327' }}>
              <View style={{ width: '100%', height: 74, backgroundColor: '#2c2c2e' }}>
                {v.images && v.images[0] && (
                  <Image source={{ uri: photoUrl(v.images[0].url) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                )}
              </View>
              <View style={{ padding: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 5, backgroundColor: dot }} />
                  <CustomText fontType='primary' weight='Medium' style={{ color: '#8a8a8a', fontSize: 9, textTransform: 'uppercase', letterSpacing: .3 }}>{st}</CustomText>
                </View>
                <CustomText fontType='primary' weight='SemiBold' numberOfLines={1} style={{ color: '#e3e3e3', fontSize: 12 }}>{v.vehicleName}</CustomText>
                <CustomText fontType='primary' weight='Regular' style={{ color: '#6f6f76', fontSize: 10 }}>{v.vehicleNumber}</CustomText>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected car's availability */}
      <View style={{ marginHorizontal: 16, marginTop: 12, backgroundColor: '#141416', borderRadius: 14, borderWidth: 1, borderColor: '#232327', overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: upcoming.length || canSchedule ? 1 : 0, borderBottomColor: '#1f1f23' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="calendar-outline" size={16} color={BRAND_COLOR} />
            <CustomText fontType='primary' weight='Bold' style={{ color: '#e8e8ea', fontSize: 13 }}>{selected.vehicleName} availability</CustomText>
          </View>
          <CustomText fontType='primary' weight='Medium' style={{ color: '#8a8a8a', fontSize: 11 }}>{upcoming.length ? `${upcoming.length} upcoming` : 'None set'}</CustomText>
        </View>

        {!canSchedule ? (
          <View style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
            <CustomText fontType='primary' weight='Regular' style={{ color: '#8a8a8a', fontSize: 12 }}>
              {status === 'draft' ? 'Finish onboarding this car to schedule its availability.' : 'Scheduling unlocks once this car is approved.'}
            </CustomText>
          </View>
        ) : (
          <View style={{ padding: 14 }}>
            {upcoming.length === 0 ? (
              <CustomText fontType='primary' weight='Regular' style={{ color: '#757575', fontSize: 12, marginBottom: 12 }}>No upcoming availability windows yet.</CustomText>
            ) : (
              upcoming.slice(0, 6).map((s) => (
                <TouchableOpacity key={s.id} onPress={() => navigation.navigate('ScheduleInfo', { scheduleId: s.id })}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#151519', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 7, backgroundColor: BRAND_COLOR }} />
                    <View>
                      <CustomText fontType='primary' weight='Medium' style={{ color: '#e3e3e3', fontSize: 12 }}>{formatDateOnly(s.startTime)} → {formatDateOnly(s.endTime)}</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={{ color: '#8a8a8a', fontSize: 10 }}>{formatTime(s.startTime)} – {formatTime(s.endTime)}{s.scheduleBlocks && s.scheduleBlocks.length > 0 ? `  ·  ${s.scheduleBlocks.length} pause(s)` : ''}</CustomText>
                    </View>
                  </View>
                  <Icon name="chevron-forward" size={14} color="#5a5a62" />
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity onPress={() => navigation.navigate('CreateSchedule', { vehicleId: selected.id })}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: BRAND_COLOR, borderRadius: 8, paddingVertical: 13, marginTop: 2 }}>
              <Icon name="add-circle" size={16} color="#000" />
              <CustomText fontType='primary' weight='Bold' style={{ color: '#000', fontSize: 11, textTransform: 'uppercase', letterSpacing: .15 }}>Add availability</CustomText>
            </TouchableOpacity>
          </View>
        )}
      </View>
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