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

        
        <MyCars navigation={navigator} refreshing={refreshing}/>

        <ActiveAvailability navigation={navigator} refreshing={refreshing}/>

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


const MyCars = ({navigation,refreshing}) => {

  const [cars, setCars] = useState([])

  const getMyCars = async () => {
    try {
      // if(refreshing){
        const response = await axios.get(`${API_URL}/host/vehicles?limit=6&sortBy=-createdAt`)
        console.log('response',response.data.vehicles)
        setCars(sortByApproval(response.data.vehicles))
      // }
    } catch (error) {
      console.log('error',error)
    }
    
  }

  useEffect(() => {
    getMyCars()
  }, [refreshing])

  return (
    <View style={{flexDirection:'column', justifyContent:'space-between', paddingVertical:24,paddingHorizontal:0}}>
      <View style={{flexDirection:'column', justifyContent:'space-between',  marginBottom:8,paddingHorizontal:16}}> 
      <CustomText fontType='primary' weight='Bold' style={{color:'#757575', fontSize:11,letterSpacing:.15,marginBottom:1,textTransform:'uppercase'}}>My Cars</CustomText>

      </View>
          <ScrollView alwaysBounceHorizontal={true} horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row'}}>
          <TouchableHighlight style={{marginRight: 16,marginLeft:0, backgroundColor:'#141414',borderRadius:10,paddingVertical:12,paddingHorizontal:16,height:180,width:160,flexDirection:'row',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#252525',borderStyle:'dashed',marginLeft:16}} onPress={()=>navigation.navigate('AddCar')}>
                  <View style={{flexDirection:'column', justifyContent:'center', alignItems:'center',paddingVertical:10,paddingHorizontal:12}}>
                    <Icon name="add-circle-outline" size={24} style={{marginBottom:4}} color="#959595" />
                    <CustomText fontType='primary' weight='SemiBold' style={{color:'#959595', fontSize:10,textTransform:'uppercase',letterSpacing:.15 }}>Add new car</CustomText>
                  </View>
                </TouchableHighlight>
              {cars.map((car,index) => (
                <TouchableOpacity key={index} style={{marginRight: 16,marginLeft:0, backgroundColor:'#1c1c1e',borderRadius:10,width:160, height:180,position:'relative'}} onPress={()=>{
                  if(car.isDraft === true){
                    navigation.navigate('AddCar', {vehicleId:car.id})
                  }else{
                    navigation.navigate('HostCarInfo', {vehicleId:car.id})
                    // navigation.navigate('HostCars', {params:{vehicleId:car.id},screen:'HostCarInfo'})
                  }
                }}>
                  {car.images && car.images.length > 0 ? <Image source={{uri:photoUrl(car.images[0].url)}} style={{width:160, height:100, borderRadius:10,borderBottomLeftRadius:0,borderBottomRightRadius:0,backgroundColor:'#2c2c2e',position:'relative',top:0,left:0,right:0,bottom:0}}/> : <View style={{width:160, height:100, borderRadius:10,borderBottomLeftRadius:0,borderBottomRightRadius:0,backgroundColor:'#2c2c2e',position:'relative',top:0,left:0,right:0,bottom:0}}>
                    </View>
                    }
                  <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'flex-start',paddingVertical:10,paddingHorizontal:12}}>
                    {/* Status sits below the photo, not over it, so it stays
                        readable against any image. */}
                    {car.isDraft === true ? (
                      <View style={{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#26262a',borderWidth:1,borderColor:'#3a3a40',borderRadius:100,paddingVertical:2,paddingHorizontal:8,marginBottom:5}}>
                        <View style={{width:5,height:5,borderRadius:5,backgroundColor:'#b9b9c2'}} />
                        <CustomText fontType='primary' weight='Bold' style={{color:'#b9b9c2', fontSize:9,letterSpacing:.15}}>Not Completed</CustomText>
                      </View>
                    ) : car.isAdminApproved === false ? (
                      <View style={{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#EDBF3122',borderWidth:1,borderColor:'#EDBF3166',borderRadius:100,paddingVertical:2,paddingHorizontal:8,marginBottom:5}}>
                        <View style={{width:5,height:5,borderRadius:5,backgroundColor:BRAND_COLOR}} />
                        <CustomText fontType='primary' weight='Bold' style={{color:BRAND_COLOR, fontSize:9,letterSpacing:.15}}>Pending Approval</CustomText>
                      </View>
                    ) : (
                      <View style={{flexDirection:'row',alignItems:'center',gap:5,backgroundColor:'#3fce8f22',borderWidth:1,borderColor:'#3fce8f59',borderRadius:100,paddingVertical:2,paddingHorizontal:8,marginBottom:5}}>
                        <View style={{width:5,height:5,borderRadius:5,backgroundColor:'#6ee6b0'}} />
                        <CustomText fontType='primary' weight='Bold' style={{color:'#6ee6b0', fontSize:9,letterSpacing:.15}}>Live</CustomText>
                      </View>
                    )}
                    <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3', fontSize:11}}>{car.brand?.name} {car.vehicleName}</CustomText>
                    <View style={{flexDirection:'row', alignItems:'flex-end', justifyContent:'flex-end',marginTop:4}}>
                      <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3', fontSize:11}}>{car.vehicleNumber}</CustomText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            }
          </ScrollView>
         
        </View>
  )
}



const ActiveAvailability = ({navigation,refreshing}) => {

  const [availabilities, setAvailabilities] = useState([])
  const [status, setStatus] = useState(`${BOOKING_ONGOING}`)

  const getMyAvailabilitySchedule = async () => {
    try {
        const response = await axios.get(`${API_URL}/host/schedule?limit=4&sortBy=-createdAt`)
        setAvailabilities(response.data.schedules)
    } catch (error) {
      console.log('error',error)
    }
    
  }

  useEffect(() => {
    getMyAvailabilitySchedule()
  }, [status,refreshing])


  return (
    <View style={{flexDirection:'column', justifyContent:'space-between', paddingVertical:24,paddingHorizontal:16}}>
      <View style={{flexDirection:'column', justifyContent:'space-between', marginBottom:16}}> 
          <CustomText fontType='primary' weight='Bold' style={{color:'#757575', fontSize:11,letterSpacing:.15,marginBottom:1,textTransform:'uppercase'}}>
            Car Availability Schedules
          </CustomText>

      </View>


      
          <View style={{flexDirection:'column',backgroundColor:'#1c1c1e',borderRadius:8,paddingVertical:0,paddingHorizontal:0,overflow:'hidden'}}>
              {availabilities.map((availability,index) => (
                <TouchableOpacity key={index} style={{marginLeft:0, overflow:'hidden',flex:1,borderBottomWidth:1,borderBottomColor:'#252525'}} onPress={()=>navigation.navigate('ScheduleInfo', {scheduleId:availability.id})}>
                  <View style={{flexDirection:'column', justifyContent:'space-between',paddingVertical:10,paddingHorizontal:12,borderBottomWidth:0,borderBottomColor:'#252525', backgroundColor:'#151519',width:'100%'}}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center',paddingVertical:6,paddingHorizontal:12}}>
                      <View style={{flexDirection:'column', alignItems:'flex-start', justifyContent:'flex-start',backgroundColor:'#151519',zIndex:1,paddingRight:4}}> 
                        <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3', fontSize:12}}>{formatDateOnly(availability.startTime)}</CustomText>
                        <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3', fontSize:10}}>{formatTime(availability.startTime)}</CustomText>
                      </View>
                      <View style={{flexDirection:'column', alignItems:'center', justifyContent:'center',backgroundColor:'#151519',zIndex:1,paddingHorizontal:12}}>
                      <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3', fontSize:12}}>{availability.vehicle?.vehicleNumber ? availability.vehicle?.vehicleNumber : 'N/A'}</CustomText>
                      <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3', fontSize:12}}>{availability.vehicle?.vehicleName ? availability.vehicle?.vehicleName : 'N/A'}</CustomText>
                      <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3', fontSize:11}}>{availability.scheduleBlocks && availability.scheduleBlocks.length > 0 ? `${availability.scheduleBlocks.length} Pause(s)` : ''}</CustomText>

                      </View>
                      <View style={{backgroundColor:'#2c2c2e',height:2,width:'90%',position:'absolute',left:'5%',top:'60%',zIndex:-1}}>
                        
                      </View>
                      <View style={{flexDirection:'column', alignItems:'flex-end', justifyContent:'flex-end',backgroundColor:'#151519',zIndex:1,paddingLeft:4}}> 
                        <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3', fontSize:12}}>{formatDateOnly(availability.endTime)}</CustomText>
                        <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3', fontSize:10}}>{formatTime(availability.endTime)}</CustomText>
                      </View>
                    </View>
                    {/* <View style={{flexDirection:'row', justifyContent:'space-between'}}> 
                      <FontAwesome name="dot-circle-o" size={12} style={{marginRight:4}} color={BRAND_COLOR}/>
                      <FontAwesome name="dot-circle-o" size={12} style={{marginRight:4}} color={BRAND_COLOR}/>
                    </View> */}
                  </View>
                    
                </TouchableOpacity>
              ))
            }
                <TouchableOpacity style={{marginLeft:0, overflow:'hidden',flex:1,backgroundColor:'#EDBF313A',paddingVertical:6,paddingHorizontal:8}} onPress={()=>navigation.navigate('CreateSchedule')}>
                  <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center',paddingVertical:10,paddingHorizontal:12}}>
                    <Icon name="add-circle-outline" size={16} style={{marginRight:4}} color={BRAND_COLOR}/>
                    <CustomText fontType='primary' weight='Bold' style={{color:BRAND_COLOR, fontSize:10,textTransform:'uppercase',letterSpacing:.15,textAlign:'center'}}>Add another schedule</CustomText>
                  </View>
                    
                </TouchableOpacity>
          </View>
         
        </View>
  )
}


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