import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, RefreshControl, ScrollView, TouchableHighlight } from 'react-native';
import { API_URL, BOOKING_BOOKED, BRAND_COLOR } from '../../../utils/constants';
import { useSelector } from 'react-redux';
import { formatDate, photoUrl } from '../../../utils/utils';
import HeaderBlock from '../../../components/CenterHeader';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomText from '../../../components/CustomText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { BOOKING_ONGOING, BOOKING_FINISHED, BOOKING_CANCELLED } from '../../../utils/constants';
import ActionSheet from 'react-native-actions-sheet';
import FiveStar from '../../../components/host/FiveStar';
export function HostBookingsScreen() {

  const [rides, setRides] = useState([]);
  const authInfo = useSelector((state)=>state.auth)
  const navigation = useNavigation();
  const route = useRoute();
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [offset, setOffset] = useState(0);
  const [count, setCount] = useState(0);
  // Status can be seeded from the "Active bookings" KPI on the host home.
  const [filter, setFilter] = useState({vehicleId:null,status:route.params?.status || ''})
  useEffect(() => {
    if (route.params?.status !== undefined) setFilter((f) => ({ ...f, status: route.params.status }));
  }, [route.params?.status]);
  const [cars, setCars] = useState([])
  const [showCarsPicker, setShowCarsPicker] = useState(false);
  const carsPickerRef = useRef(null);

  const getMyRides = async () => {
    try {
      setRefreshing(true);
      let response;
      response = await axios.get(`${API_URL}/host/bookings?populate=true&sortBy=${sortBy}&offset=${offset}&limit=${15}${filter.vehicleId ? `&vehicleId=${filter.vehicleId}` : ''}${filter.status ? `&status=${filter.status}` : ''}`);
      //   console.log('response',response.data)
      console.log('response',filter.status)
      setRides(response.data.bookings)
      setCount(response.data.count)
      setRefreshing(false);
    } catch (error) {
      console.log('error',error)
      setRefreshing(false);
      Alert.alert('Error',error.message)
    }
  }

  const getMyCars = async () => {
    try {
      setRefreshing(true);
      console.log('response',authInfo)
      const response = await axios.get(`${API_URL}/host/vehicles?limit=${50}`);
      console.log('vehcilkes',response.data.vehicles)
      setCars(response.data.vehicles ? response.data.vehicles : [])
      setRefreshing(false);
    } catch (error) {
      console.log('error',error)
      setRefreshing(false);
      Alert.alert('Error',error.message)
    }
  }

  useEffect(()=>{
    getMyCars()
  },[])
  useEffect(()=>{
    getMyRides()
  },[filter.vehicleId,filter.status])

  const handleCarFilterSelect = (option) => {
    setFilter(prev => ({...prev,vehicleId:option.id}));
    carsPickerRef.current?.hide();
  };

  return (
    <View style={styles.container}>
      {/* Title is the shared header now (TopBar / stack header). */}
      <TouchableOpacity onPress={() => carsPickerRef.current?.show()} style={{flexDirection:'row',  alignContent:"center",paddingHorizontal:16,paddingVertical:12}}>
        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center',alignContent:"center",backgroundColor:'#000',borderRadius:10,padding:12,width:'100%'}}>
            <View>
                <CustomText fontType='primary' weight='Bold' style={{color:'#757575', fontSize:9,marginBottom:2,textTransform:'uppercase'}}>Selected Car</CustomText>
                <CustomText fontType='primary' weight='Bold' style={{color:'#e3e3e3', fontSize:11,textTransform:'uppercase'}}>{filter.vehicleId ? cars.find(car => car.id === filter.vehicleId).vehicleName : 'All Cars'}</CustomText>
            </View>
            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center'}}>
                <Ionicons name="chevron-down" size={16} color="#757575" />
            </View>
        </View>
      </TouchableOpacity>

      <View style={{flexDirection:'column'}}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', alignContent:"center",paddingHorizontal:16}}>
      {
          [{label:'All',value:''},{label:'Ongoing',value:BOOKING_ONGOING},{label:'Upcoming',value:BOOKING_BOOKED},{label:'Completed',value:BOOKING_FINISHED},{label:'User Cancelled',value:BOOKING_CANCELLED},{label:'Host Cancelled',value:BOOKING_CANCELLED}].map((item,index) => (
              <TouchableOpacity key={index} activeOpacity={0.8} onPress={() => setFilter(prev => ({...prev,status:item.value}))} style={{paddingVertical:8,paddingHorizontal:18,backgroundColor:filter.status === item.value ? '#EDBF313A' : '#1c1c1e',marginRight:6,borderRadius:24}}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <Text style={{color:filter.status === item.value ? BRAND_COLOR : '#757575',fontSize:10,fontWeight:'600',textTransform:'uppercase',letterSpacing:.15}}>{item.label}</Text>
                </View>
              </TouchableOpacity>
        ))
    }
      </ScrollView>
    </View>
      <View style={{flex:1,paddingTop:24}}>
        <FlatList style={{paddingHorizontal:16}}
        refreshControl={<RefreshControl colors={['#EDBF31']} progressBackgroundColor={'#000'} refreshing={refreshing} onRefresh={async()=>await getMyRides()}/>}
        data={rides}
        renderItem={({item})=>renderItem(item,navigation)}
        />
      </View>
      <ActionSheet ref={carsPickerRef} containerStyle={{backgroundColor:'#1c1c1e',height:'50%'}} height={'50%'} safeAreaInsets={{bottom:0}}>
    <ScrollView style={{paddingVertical:24}}>
    {
    cars.length > 0 && cars.map((car, index) => (
      <TouchableHighlight underlayColor='#090909' style={{borderRadius:8,paddingHorizontal:12,paddingVertical:4}} key={index} onPress={() => handleCarFilterSelect(car)}>
        <View style={{flexDirection:'row', justifyContent:'flex-start', alignItems:'center',alignContent:"center",width:'100%',marginVertical:8}}>
            <View>
                <Image source={{uri:photoUrl(car.images[0].url)}} style={{width:48, height:48, borderRadius:4,backgroundColor:'#2c2c2e',position:'relative'}}/>
            </View>
            <View style={{flexDirection:'column', justifyContent:'center', alignItems:'center',paddingLeft:12}}>
                <CustomText fontType='primary' weight='SemiBold' style={{color:'#959595', fontSize:11,letterSpacing:-.15}}>{car.vehicleNumber}</CustomText>
                <CustomText fontType='primary' weight='SemiBold' style={{color:'#fff', fontSize:11,letterSpacing:-.15}}>{car.vehicleName}</CustomText>
            </View>
        </View>
      </TouchableHighlight>
    ))
    }
    </ScrollView>
  </ActionSheet>
    </View>
  );
}




const renderItem = (booking,navigation) => {
  return (
    <View>
      <TouchableOpacity key={booking.id} style={{marginLeft:0, backgroundColor:'#1c1c1e',borderRadius:10,overflow:'hidden',marginBottom:12}} onPress={()=>navigation.navigate('HostBookingInfo', {bookingId:booking.id})}>
                  <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-start',paddingVertical:10,paddingHorizontal:12,borderBottomWidth:0,borderBottomColor:'#252525', backgroundColor:'#151519'}}>

                  {booking.vehicle.images && booking.vehicle.images.length > 0 && <Image source={{uri:booking.vehicle.images[0].url}} style={{width:72, height:48, borderRadius:4,backgroundColor:'#2c2c2e',position:'relative'}}/>}
                  <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'flex-start',paddingLeft:12}}>
                    <CustomText fontType='primary' weight='Regular' style={{color:'#a3a3a3', fontSize:10}}>{booking.vehicle?.vehicleNumber}</CustomText>
                    <CustomText  fontType='primary' weight='Regular' style={{color:'#e3e3e3', fontSize:11,textTransform:'uppercase'}}>#{booking.bookingId}</CustomText>
                  </View>
                  </View>
                  <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'flex-start',paddingVertical:10,paddingHorizontal:12}}>
                    <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3', fontSize:11,marginBottom:4}}>From: {formatDate(booking.startTime)}</CustomText>
                    <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3', fontSize:11}}>To: {formatDate(booking.endTime)}</CustomText>
                  </View>
                  <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between',paddingVertical:4,paddingHorizontal:12,borderTopWidth:1,borderTopColor:'#252525'}}>
                    <View style={{flexDirection:'row', alignItems:'center', gap:6, flexShrink:1, flexWrap:'wrap'}}>
                      <CustomText fontType='primary' weight='Regular' style={{color:BRAND_COLOR, fontSize:10,backgroundColor:'#EDBF313A',paddingHorizontal:12,paddingVertical:4,borderRadius:4}}>{booking.deliveryType === 'self' ? 'Rider Pickup' : 'Doorstep Delivery'}</CustomText>
                      {booking.damages && booking.damages.length > 0 && (
                        <View style={{flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#ff3b3020', borderWidth:1, borderColor:'#ff3b3040', paddingHorizontal:10, paddingVertical:4, borderRadius:4}}>
                          <Ionicons name='alert-circle' size={12} color='#ff6b60'/>
                          <CustomText fontType='primary' weight='SemiBold' style={{color:'#ff6b60', fontSize:9, textTransform:'uppercase', letterSpacing:.2}}>Damage Reported</CustomText>
                        </View>
                      )}
                    </View>
                    <FiveStar onPress={booking.hostReview ? ()=>{} : ()=>navigation.navigate('HostBookingInfo',{bookingId:booking.id})} size={16} rating={booking.hostReview?.totalRating ? booking.hostReview.totalRating : 0}/>
                  </View>
                    
                </TouchableOpacity>
    </View>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0b'
  },
  listContainer: {
    padding: 16,
    paddingHorizontal:0,
  },
  vehicleItem: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingVertical:8,
    paddingHorizontal:8,
    overflow: 'hidden',
  },
  vehicleImage: {
    borderRadius:12,
    width: '100%',
    height: 180,
  },
  vehicleInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 16,
    color: '#EDBF31',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
  },
});
