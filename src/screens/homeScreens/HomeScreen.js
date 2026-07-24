import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StatusBar, TouchableOpacity, Image, ScrollView, FlatList, TouchableHighlight, Dimensions, ToastAndroid, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { convertToUnixTimestamp, formatDate, getCurrentLocation, notify } from '../../utils/utils';
import CustomText from '../../components/CustomText';
import { setSelectedCity, setShowCityLocation, setShowCityPicker } from '../../store/bookingSlice';
import LocationChangeNotificationScreen from './LocationChangeNotificationScreen';
import LocationInvalidScreen from './LocationInvalidScreen';
import LocationSearchScreen from './LocationSearchScreen';
import Carousel from 'react-native-reanimated-carousel';
// import Logo from '../../images/logo.png';
// import { BottomSheet, BottomSheetView } from '@gorhom/bottom-sheet';
export default function HomeScreen() {
  const navigator = useNavigation()
  const { startDateTime, endDateTime,selectedCity,selectedLocation } = useSelector((state) => state.booking);
  const dispatch = useDispatch();
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showLocationValid, setShowLocationValid] = useState(false);
  const [showCityChange, setShowCityChange] = useState(null);
  const [cars, setCars] = useState([])
  const [refreshing, setRefreshing] = useState(false);


  

  // const bottomSheetRef = useRef(null);

  // callbacks
  const handleSheetChanges = useCallback((index) => {
    // console.log('handleSheetChanges', index);
  }, []);

  // useEffect(()=>{
  //   console.log('selectedLocation', selectedLocation)
  //   console.log('selectedCity', selectedCity)
  // },[])



  const getCars = async () => {
    try {
      // The booking window is persisted, so on a later launch it is usually in
      // the past. `new Date(...)` is truthy even for an invalid or stale date,
      // so the old `!startTime` guard never fired and the API rejected the
      // request (MINIMUM_START_TIME / INVALID_RIDE_DURATION) — which is what
      // surfaced as the "Error fetching top cars" popup on every cold start.
      const MIN_LEAD_MS = 6 * 60 * 60 * 1000;      // API needs pickup >= 3h out
      const MIN_DURATION_MS = 12 * 60 * 60 * 1000; // API needs ride >= 12h
      const earliestStart = new Date(Date.now() + MIN_LEAD_MS);

      let startTime = new Date(startDateTime);
      if (isNaN(startTime.getTime()) || startTime < earliestStart) startTime = earliestStart;

      let endTime = new Date(endDateTime);
      if (isNaN(endTime.getTime()) || endTime.getTime() - startTime.getTime() < MIN_DURATION_MS) {
        endTime = new Date(startTime.getTime() + MIN_DURATION_MS);
      }

      const response = await axios.get(`${API_URL}/vehicle?startTime=${convertToUnixTimestamp(startTime)}&endTime=${convertToUnixTimestamp(endTime)}&offset=${0}&limit=${10}&city=${selectedCity.id}&sortBy=rating`)
      setCars(response.data.vehicles)
    } catch (error) {
      // Background fetch for the home carousel — a failure should leave the
      // list empty, not throw a modal over whatever screen the user is on.
      // (`error.response` is undefined when the request never reached the
      // server, so reading `.data` off it used to crash the handler.)
      console.log('Error fetching top cars:', error?.response?.data || error?.message);
    }
  }

  
  // When the location can't be read (e.g. permission denied), save only the
  // Hyderabad coordinates and show them as a fallback.
  const HYDERABAD = { name: 'Hyderabad', latitude: '17.3850', longitude: '78.4867' };
  const applyDefaultCity = async () => {
    try {
      const citiesRes = await axios.get(`${API_URL}/city`);
      const hyd = (citiesRes.data || []).find(c => c.name?.toLowerCase() === 'hyderabad');
      dispatch(setShowCityLocation({
        selectedCity: hyd ? { id: hyd.id, name: hyd.name } : undefined,
        selectedLocation: { ...HYDERABAD, latitude: hyd?.lat || HYDERABAD.latitude, longitude: hyd?.lng || HYDERABAD.longitude },
      }));
      dispatch(setShowCityPicker(false));
    } catch (e) {
      // Even if the cities call fails, still save the raw Hyderabad coordinates.
      dispatch(setShowCityLocation({ selectedLocation: { ...HYDERABAD } }));
    }
  };

  // Detects the device location, resolves it to a serviced city + a readable
  // address (Google geocoding via the backend), and stores both. Works even
  // before a city is picked (seeds validation with the first available city).
  // `fromUser` is true when the locate icon is tapped, which lets us re-prompt
  // (or open Settings) for a previously denied permission.
  const detectUserLocation = async(fromUser = false) => {
    try {
      setDetectingLocation(true)
      const location = await getCurrentLocation(fromUser);
      let cityId = selectedCity?.id;
      if (!cityId) {
        const citiesRes = await axios.get(`${API_URL}/city`);
        cityId = citiesRes.data?.[0]?.id;
      }
      const response = await axios.post(`${API_URL}/utility/validate-geo?lat=${location.latitude}&lng=${location.longitude}&cityId=${cityId}`)
      const { info, city, isPlaceValid } = response.data;
      // Use the device coordinates directly; fall back to the city name when
      // reverse-geocoding (info.formatted_address) is unavailable.
      const detectedLocation = {
        name: info?.formatted_address || city?.name || 'Current location',
        place_id: info?.place_id,
        latitude: info?.geometry?.location?.lat ?? location.latitude,
        longitude: info?.geometry?.location?.lng ?? location.longitude,
      };
      dispatch(setShowCityLocation({
        selectedCity: isPlaceValid && city ? city : undefined,
        selectedLocation: detectedLocation,
      }));
      dispatch(setShowCityPicker(false));
    } catch (error) {
      console.log('detecting location error',error)
      // Permission denied / location unavailable -> default to Hyderabad,
      // but only when nothing usable is selected yet so we don't clobber a
      // location the user already has.
      if (!selectedLocation) {
        await applyDefaultCity();
      } else {
        notify('Could not update your location');
      }
    } finally {
      setDetectingLocation(false)
    }
  }

  // Handles a place chosen from the Google Places search sheet: resolves it to
  // a serviced city + coordinates and stores it as the selected location.
  const handleLocationSelect = async (item) => {
    try {
      const response = await axios.post(`${API_URL}/utility/validate-place?placeId=${item.place_id}&cityId=${selectedCity?.id}`);
      const { info, city, isPlaceValid, isCityChanged } = response.data;
      const detectedLocation = {
        name: info?.formatted_address || item.description,
        place_id: item.place_id,
        latitude: info?.geometry?.location?.lat,
        longitude: info?.geometry?.location?.lng,
      };
      dispatch(setShowCityLocation({
        selectedCity: (isPlaceValid || isCityChanged) && city ? city : undefined,
        selectedLocation: detectedLocation,
      }));
    } catch (error) {
      console.log('validate place error', error);
      dispatch(setShowCityLocation({ selectedLocation: { name: item.description, place_id: item.place_id } }));
    } finally {
      setShowLocationSearch(false);
    }
  };

  // Auto-pick the current location every time the home screen opens, so the
  // city and location reflect where the user actually is (runs once per mount,
  // even if a previous selection is stored).
  const didAutoDetect = useRef(false);
  useEffect(() => {
    if (didAutoDetect.current) return;
    didAutoDetect.current = true;
    detectUserLocation(false);
  }, []);

  useEffect(()=>{
    if (selectedCity) getCars()
  },[selectedCity])
  
  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await getCars()
      setRefreshing(false);
    } catch (error) {
      console.log(error)
      notify('Failed to fetch cars');
      setRefreshing(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor:'#000'}} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* <HomeIcon width={22} height={22} currentColor={color} /> */}
      {/* Title and profile live in TopBar now. */}
      <View style={{height:8}} />

      <PremiumMemberships/>
        <View style={{paddingHorizontal:16}}>

          <View style={{flexDirection:'column', borderRadius:12,borderCurve:'continuous',backgroundColor:'#1C1C1E',overflow:'hidden'}}>

            {/* City is the first row of the search card, above Selected
                Location — it narrows the same search, so it belongs in the same
                box and uses the same row layout as the rows below it. */}
            <TouchableHighlight underlayColor='#2C2C2E' onPress={()=>dispatch(setShowCityPicker(true))} style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start',backgroundColor:'#1C1C1E',borderBottomWidth:1,borderBottomColor:'#25252A',paddingHorizontal:16,paddingVertical:12}}>

              <View style={{flexDirection:'row',justifyContent:'space-between',width:'100%',alignItems:'center'}}>

                <View style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start',flex:1,marginRight:24}}>
                    <Icon name="location-outline" size={24} color="#EDBF31"/>
                    <View style={{marginLeft:12,justifyContent:'center'}}>
                      <CustomText fontType='primary' weight='Bold' style={{color:'#959595', fontSize:10, fontWeight:'500',textAlign:'left',marginBottom:0,textTransform:'uppercase'}}>City</CustomText>
                      <CustomText numberOfLines={1} ellipsizeMode='tail' fontType='primary' weight='Medium' style={{color:'#fff', fontSize:12, fontWeight:'500'}}>{selectedCity ? selectedCity.name : 'Select City'}</CustomText>
                    </View>
                </View>
                <Icon name="chevron-forward" size={18} color="#5a5a62"/>
              </View>
            </TouchableHighlight>

            <TouchableHighlight underlayColor='#2C2C2E' onPress={()=>setShowLocationSearch(true)} style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start',backgroundColor:'#1C1C1E',borderBottomWidth:1,borderBottomColor:'#25252A',paddingHorizontal:16,paddingVertical:12}}>

              <View style={{flexDirection:'row',justifyContent:'space-between',width:'100%',alignItems:'center'}}>

                <View style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start',flex:1,marginRight:24}}>
                    <Icon name="navigate-circle-outline" size={24} color="#EDBF31"/>
                    <View style={{marginLeft:12,justifyContent:'center'}}>
                      <CustomText fontType='primary' weight='Bold' style={{color:'#959595', fontSize:10, fontWeight:'500',textAlign:'left',marginBottom:0,textTransform:'uppercase'}}>Selected Location</CustomText>
                      <CustomText numberOfLines={2} ellipsizeMode='tail' fontType='primary' weight='Medium' style={{color:'#fff', fontSize:12, fontWeight:'500'}}>{detectingLocation ? 'Detecting Location...' : selectedLocation ? selectedLocation.name : selectedCity ? selectedCity.name : 'Selected Location'}</CustomText>
                    </View>
                </View>
                <View>

              <TouchableHighlight onPress={()=>detectUserLocation(true)} underlayColor='#2f2f2f' style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start',backgroundColor:'#2d2d2d',borderRadius:8,padding:2,shadowOpacity:0.5,shadowRadius:1,shadowColor:'#454545',height:40,width:40,justifyContent:'center'}}>
                <Icon name="locate-outline" size={20} color={BRAND_COLOR}/>
              </TouchableHighlight>
                </View>
              </View>
            </TouchableHighlight> 


            <View style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start',backgroundColor:'#1C1C1E',borderBottomWidth:1,borderBottomColor:'#25252A',paddingHorizontal:0,paddingVertical:0}}>

            <TouchableHighlight underlayColor='#2C2C2E' onPress={()=>navigator.navigate('DatePicker',{from:'home'})} style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start',backgroundColor:'#1C1C1E',borderRightWidth:1,borderRightColor:'#2C2C2E',paddingLeft:16,paddingVertical:16,width:'50%'}}>
              <View style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start'}}>
            <Icon name="calendar-outline" size={20} color="#EDBF31"/>
              <View style={{marginLeft:12}}>
                <CustomText fontType='primary' weight='Bold' style={{color:'#959595', fontSize:10, fontWeight:'500',textAlign:'left',marginBottom:0,textTransform:'uppercase'}}>Start Time</CustomText>
                <CustomText fontType='primary' weight='Medium' style={{color:'#fff', fontSize:12, fontWeight:'500'}}>{formatDate(startDateTime,'short')}</CustomText>
              </View>
              </View>
            </TouchableHighlight>  

            <TouchableHighlight underlayColor='#2C2C2E' onPress={()=>navigator.navigate('DatePicker',{from:'home'})} style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',backgroundColor:'#1C1C1E',borderBottomColor:'#a3a3a3',paddingLeft:16,paddingVertical:16,width:'50%'}}>
              <View style={{flexDirection:'row',alignItems:'center', justifyContent:'flex-start'}}>
                  <Icon name="calendar-outline" size={20} color="#EDBF31"/>
                    <View style={{marginLeft:12}}>
                      <CustomText fontType='primary' weight='Medium' style={{color:'#959595', fontSize:10, fontWeight:'500',textAlign:'left',marginBottom:0,textTransform:'uppercase',letterSpacing:.15,fontFamily:'Inter-Bold'}}>End Time</CustomText>
                      <CustomText fontType='primary' weight='Medium' style={{color:'#fff', fontSize:12, fontWeight:'500'}}>{formatDate(endDateTime,'short')}</CustomText>
                    </View>
              </View>
            </TouchableHighlight>  

            </View>


            <TouchableHighlight underlayColor={'#af8a1a'} onPress={()=>navigator.navigate('CarsListing')} style={{backgroundColor:BRAND_COLOR,paddingHorizontal:0,paddingVertical:20}}>
                <CustomText fontType='primary' weight='Bold' style={{color:'#000', fontSize:12, fontWeight:'600',textAlign:'center',textTransform:'uppercase'}}>Search Cars</CustomText>
            </TouchableHighlight> 
        </View>
        </View>
        
        {/* <FeatureCars cars={cars} navigation={navigator}/> */}
        
        {/* <OfferBannerBlock/> */}
            
          <WhyChooseCocarr/>

          <OfferSlider/>

          <FaqBlock/>

          <LocationSearchScreen show={showLocationSearch} setShow={setShowLocationSearch} onPress={handleLocationSelect}/>

          {showCityChange && <LocationChangeNotificationScreen show={showCityChange} setShow={setShowCityChange} onPress={(data,city)=>{
          console.log('on click data',data)
          console.log('on click city',city)
          dispatch(setShowCityLocation({
            selectedCity: city,
            selectedLocation: {name:data.formatted_address,place_id:data.place_id}
          }))
          setShowCityChange(false)
        }}/>}
        {showLocationValid && <LocationInvalidScreen show={showLocationValid} setShow={setShowLocationValid} onPress={()=>{
          setShowLocationValid(false)
        }}/>}
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

const WhyChooseCocarr = () => {

  const feaures = [{icon:'time-outline',title:'24/7',description:'Customer Support'},{icon:'home-outline',title:'Delivery',description:'Anywhere, Anytime'},{icon:'pricetags-outline',title:'Offers',description:'Exclusive Deals'}]
  return (
    <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingVertical:40,alignContent:"center"}}>
          <CustomText fontType='primary' weight='Bold' style={{color:'#e3e3e3', fontSize:13, fontWeight:'600',textAlign:'center',textTransform:'uppercase',letterSpacing:.15}}>Why Choose Cocarr?</CustomText>
    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:24,paddingVertical:20,alignContent:"center"}}>
      {
        feaures.map((item,index) => (
          <View key={index} style={{flexDirection:'column', justifyContent:'center', alignItems:'center', paddingHorizontal:4,alignContent:"center",flex:1,paddingVertical:12}}>
          <View style={{flexDirection:'column', justifyContent:'center', alignItems:'center', paddingHorizontal:4,alignContent:"center",flex:1,backgroundColor:'#1C1C1E',borderRadius:40,paddingHorizontal:16,paddingVertical:16,marginBottom:4}}>
            <Icon name={item.icon} size={20} color="#EDBF31"/>
          </View>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#fff', fontSize:11, fontWeight:'600',textAlign:'center',letterSpacing:.15}}>{item.title}</CustomText>
          <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3', fontSize:10, fontWeight:'400',textAlign:'center',letterSpacing:.15}}>{item.description}</CustomText>
        </View>
        ))
      }
    </View>
    </View>
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


const FeatureCars = ({navigation,cars}) => {


  return (
    <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingVertical:40}}>
      <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingLeft:20,marginBottom:32}}> 
          <CustomText fontType='primary' weight='Bold' style={{color:'#efefef', fontSize:14,textTransform:'uppercase',letterSpacing:.15,marginBottom:1}}>
            Top Cars
          </CustomText>
          <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3', fontSize:12}}>
            Cars Rated 4.5+ by customers
          </CustomText>

      </View>
          <ScrollView alwaysBounceHorizontal={true} horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row'}}>
            {cars.length === 0 ? (
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center',paddingHorizontal:24,alignContent:"center"}}>
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
              </View>
            ) : (
              cars.map((car,index) => (
                <TouchableOpacity key={index} style={{marginRight: 16,marginLeft:index === 0 ? 24 : 0, backgroundColor:'#1c1c1e',borderRadius:10}} onPress={()=>navigation.navigate('CarInfo', {vehicleId:car.vehicleId})}>
                  {car.images && car.images.length > 0 && <Image source={{uri:car.images[0].url}} style={{width:180, height:120, borderRadius:10,borderBottomLeftRadius:0,borderBottomRightRadius:0,backgroundColor:'#2c2c2e'}}/>}
                  <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'flex-start',paddingVertical:10,paddingHorizontal:12}}>
                    <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3', fontSize:12}}>{car.brand.name} {car.vehicleName}</CustomText>
                    <CustomText fontType='primary' weight='SemiBold' style={{color:'#959595', fontSize:10,textTransform:'uppercase',letterSpacing:.15 }}>{car.vehicleFuelType} · {car.vehicleSeats} Seater · {car.vehicleYear}</CustomText>
                    <View style={{flexDirection:'row', alignItems:'flex-end', justifyContent:'flex-end',marginTop:4}}>
                      <FontAwesome name="rupee" size={13} color="#fff" style={{marginBottom:3}} />
                      <CustomText fontType='primary' weight='Medium' style={{color:'#fff', fontSize:14,marginLeft:2}}>{car.vehiclePlan[0].perHourFee}</CustomText>
                      <CustomText fontType='primary' weight='Medium' style={{color:'#efefef', fontSize:12,marginLeft:2,marginBottom:1}}>/ Hr</CustomText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
         
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
    {question:'What is Cocarr?', answer:'Cocarr is a car rental service that allows you to rent cars for short periods of time.'},
    {question:'How does Cocarr work?', answer:'Cocarr works by allowing you to rent cars for short periods of time.'},
    {question:'What are the benefits of using Cocarr?', answer:'The benefits of using Cocarr are that you can rent cars for short periods of time.'},
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