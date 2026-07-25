import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, RefreshControl, ScrollView, Dimensions } from 'react-native';
import { API_URL, BOOKING_BOOKED, BOOKING_ONGOING, BOOKING_FINISHED, BOOKING_CANCELLED, BRAND_COLOR } from '../../utils/constants';
import { useSelector } from 'react-redux';
import { formatDate, photoUrl } from '../../utils/utils';
import HeaderBlock from '../../components/CenterHeader';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const OngoingRides = ({rides, navigation, refreshing, onRefresh}) => (
  <View style={{flex:1}}>
    <FlatList 
      style={{paddingHorizontal:16}}
      refreshControl={
        <RefreshControl 
          colors={['#EDBF31']} 
          progressBackgroundColor={'#000'} 
          refreshing={refreshing} 
          onRefresh={onRefresh}
        />
      }
      data={rides.filter(ride => ride.status === BOOKING_ONGOING)}
      renderItem={({item})=>renderItem(item,navigation)}
    />
  </View>
);

const BookedRides = ({rides, navigation, refreshing, onRefresh}) => (
  <View style={{flex:1}}>
    <FlatList 
      style={{paddingHorizontal:16}}
      refreshControl={
        <RefreshControl 
          colors={['#EDBF31']}
          progressBackgroundColor={'#000'}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
      data={rides.filter(ride => ride.status === BOOKING_BOOKED)}
      renderItem={({item})=>renderItem(item,navigation)}
    />
  </View>
);

const CompletedRides = ({rides, navigation, refreshing, onRefresh}) => (
  <View style={{flex:1}}>
    <FlatList 
      style={{paddingHorizontal:16}}
      refreshControl={
        <RefreshControl 
          colors={['#EDBF31']} 
          progressBackgroundColor={'#000'} 
          refreshing={refreshing} 
          onRefresh={onRefresh}
        />
      }
      data={rides.filter(ride => ride.status === BOOKING_FINISHED)}
      renderItem={({item})=>renderItem(item,navigation)}
    />
  </View>
);

const CancelledRides = ({rides, navigation, refreshing, onRefresh}) => (
  <View style={{flex:1}}>
    <FlatList 
      style={{paddingHorizontal:16}}
      refreshControl={
        <RefreshControl 
          colors={['#EDBF31']} 
          progressBackgroundColor={'#000'} 
          refreshing={refreshing} 
          onRefresh={onRefresh}
        />
      }
      data={rides.filter(ride => ride.status === BOOKING_CANCELLED)}
      renderItem={({item})=>renderItem(item,navigation)}
    />
  </View>
);

export function RidesScreen({navigation}) {
  const [rides, setRides] = useState([]);
  const authInfo = useSelector((state)=>state.auth)
  const [refreshing, setRefreshing] = useState(false);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: BOOKING_ONGOING, title: 'Ongoing' },
    { key: BOOKING_BOOKED, title: 'Booked' },
    { key: BOOKING_FINISHED, title: 'Completed' },
    { key: BOOKING_CANCELLED, title: 'Cancelled' },
  ]);

  const getMyRides = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API_URL}/user/rides?populate=true&status=${routes[index].key}`,{
        headers:{
          'Authorization': `${authInfo.token}`
        }
      });
      setRides(response.data)
      setRefreshing(false);
    } catch (error) {
      console.log('error',error)
      setRefreshing(false);
      Alert.alert('Error',error.message)
    }
  }

  useEffect(()=>{
    getMyRides()
  },[])

  const renderScene = SceneMap({
    ongoing: () => <OngoingRides rides={rides} navigation={navigation} refreshing={refreshing} onRefresh={getMyRides} />,
    booked: () => <BookedRides rides={rides} navigation={navigation} refreshing={refreshing} onRefresh={getMyRides} />,
    finished: () => <CompletedRides rides={rides} navigation={navigation} refreshing={refreshing} onRefresh={getMyRides} />,
    cancelled: () => <CancelledRides rides={rides} navigation={navigation} refreshing={refreshing} onRefresh={getMyRides} />
  });

  const renderTabBar = props => (
    <View style={{flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 28, backgroundColor: '#000',justifyContent:'center'}}>
      {props.navigationState.routes.map((route, index) => (
        <TouchableOpacity 
          key={index} 
          activeOpacity={0.8} 
          onPress={() => props.jumpTo(route.key)} 
          style={{
            paddingVertical: 8,
            paddingHorizontal: 18,
            backgroundColor: props.navigationState.index === index ? '#EDBF313A' : '#1c1c1e',
            marginRight: 6,
            borderRadius: 24
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{
              color: props.navigationState.index === index ? BRAND_COLOR : '#757575',
              fontSize: 10,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: .15
            }}>{route.title}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Title is the shared header now (TopBar / stack header). */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: Dimensions.get('window').width }}
        renderTabBar={renderTabBar}
      />
    </View>
  );
}

const STATUS_STYLE = {
  [BOOKING_ONGOING]:   { label: 'Ongoing',   fg: '#6ee6b0', bg: '#3fce8f22', bd: '#3fce8f59' },
  [BOOKING_BOOKED]:    { label: 'Upcoming',  fg: BRAND_COLOR, bg: '#EDBF3122', bd: '#EDBF3166' },
  [BOOKING_FINISHED]:  { label: 'Completed', fg: '#a3a3a3', bg: '#26262a', bd: '#3a3a40' },
  [BOOKING_CANCELLED]: { label: 'Cancelled', fg: '#ef8f8f', bg: '#ef444422', bd: '#ef444455' },
};

const renderItem = (item,navigation) => {
  const st = STATUS_STYLE[item.status] || STATUS_STYLE[BOOKING_FINISHED];
  const cover = (item.vehicle?.images || []).filter((i) => !i.isDeleted)[0]?.url;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={()=>navigation.navigate('RideInfo',{bookingId:item.bookingId})}
      style={{ backgroundColor:'#141416', borderRadius:14, borderWidth:1, borderColor:'#232327', marginBottom:14, overflow:'hidden' }}>
      {/* Top: image + status */}
      <View style={{ flexDirection:'row', padding:12, gap:12 }}>
        <View style={{ width:76, height:76, borderRadius:12, backgroundColor:'#1c1c1e', overflow:'hidden' }}>
          {cover
            ? <Image source={{ uri: photoUrl(cover) }} style={{ width:'100%', height:'100%' }} resizeMode='cover' />
            : <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}><Ionicons name='car-outline' size={22} color='#5a5a62' /></View>}
        </View>
        {/* Content aligned to the top of the row (status + name sit higher),
            with a specs/plate line filling the space in between. */}
        <View style={{ flex:1, justifyContent:'flex-start' }}>
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor:st.bg, borderWidth:1, borderColor:st.bd, borderRadius:100, paddingVertical:3, paddingHorizontal:9 }}>
              <View style={{ width:5, height:5, borderRadius:5, backgroundColor:st.fg }} />
              <CustomText fontType='primary' weight='Bold' style={{ color:st.fg, fontSize:9, letterSpacing:.15, textTransform:'uppercase' }}>{st.label}</CustomText>
            </View>
            <CustomText fontType='primary' weight='Medium' style={{ color:'#6f6f76', fontSize:10, textTransform:'uppercase' }}>#{item.bookingId}</CustomText>
          </View>
          <CustomText fontType='primary' weight='SemiBold' numberOfLines={1} ellipsizeMode='tail' style={{ color:'#f0f0f2', fontSize:14, marginBottom:3 }}>{item.vehicle?.brand?.name} {item.vehicle?.vehicleName}</CustomText>
          {/* Extra details between the name and the trip window. */}
          <CustomText fontType='primary' weight='Regular' numberOfLines={1} style={{ color:'#8a8a8a', fontSize:11 }}>
            {[item.vehicle?.vehicleFuelType, item.vehicle?.vehicleSeats && `${item.vehicle.vehicleSeats} seats`, item.vehicle?.vehicleNumber].filter(Boolean).join('  ·  ')}
          </CustomText>
        </View>
      </View>

      {/* Bottom: trip window */}
      <View style={{ flexDirection:'row', alignItems:'center', borderTopWidth:1, borderTopColor:'#1f1f23', paddingVertical:11, paddingHorizontal:14 }}>
        <View style={{ flex:1 }}>
          <CustomText fontType='primary' weight='SemiBold' style={{ color:'#6f6f76', fontSize:9, textTransform:'uppercase', letterSpacing:.3 }}>From</CustomText>
          <CustomText fontType='primary' weight='Medium' numberOfLines={1} style={{ color:'#e3e3e3', fontSize:12, marginTop:1 }}>{formatDate(item.startTime,'long')}</CustomText>
        </View>
        <Ionicons name='arrow-forward' size={16} color='#5a5a62' style={{ marginHorizontal:8 }} />
        <View style={{ flex:1 }}>
          <CustomText fontType='primary' weight='SemiBold' style={{ color:'#6f6f76', fontSize:9, textTransform:'uppercase', letterSpacing:.3 }}>To</CustomText>
          <CustomText fontType='primary' weight='Medium' numberOfLines={1} style={{ color:'#e3e3e3', fontSize:12, marginTop:1 }}>{formatDate(item.dropTime ? item.dropTime : item.endTime,'long')}</CustomText>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
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
