import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  API_URL,
  BOOKING_INITIATED,
  BOOKING_BOOKED,
  BOOKING_ONGOING,
  BOOKING_FINISHED,
  BOOKING_CANCELLED,
} from '../../utils/constants';
import { useSelector } from 'react-redux';
import { formatDate, photoUrl } from '../../utils/utils';
import HeaderBlock from '../../components/CenterHeader';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

import { C, themedStyleSheet } from '../../theme';
import { bookingStatusStyle } from '../../theme/status';

const OngoingRides = ({rides, navigation, refreshing, onRefresh}) => (
  <View style={{flex:1}}>
    <FlatList 
      style={{paddingHorizontal:16}}
      refreshControl={
        <RefreshControl 
          colors={[C.primary]} 
          progressBackgroundColor={C.background} 
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
          colors={[C.primary]}
          progressBackgroundColor={C.background}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
      // "initiated" is a real stuck state (confirm-booking can fail after
      // payment capture) — it's still an upcoming ride to the rider, so it
      // belongs here, not invisible under no tab at all.
      data={rides.filter(ride => ride.status === BOOKING_BOOKED || ride.status === BOOKING_INITIATED)}
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
          colors={[C.primary]} 
          progressBackgroundColor={C.background} 
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
          colors={[C.primary]} 
          progressBackgroundColor={C.background} 
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
    <View style={{flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 28, backgroundColor: C.background,justifyContent:'center'}}>
      {props.navigationState.routes.map((route, index) => (
        <TouchableOpacity 
          key={index} 
          activeOpacity={0.8} 
          onPress={() => props.jumpTo(route.key)} 
          style={{
            paddingVertical: 8,
            paddingHorizontal: 18,
            backgroundColor: props.navigationState.index === index ? '#EDBF313A' : C.surface,
            marginRight: 6,
            borderRadius: 24
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{
              color: props.navigationState.index === index ? C.primaryText : C.textTertiary,
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


const renderItem = (item,navigation) => {
  const st = bookingStatusStyle(item.status);
  const cover = (item.vehicle?.images || []).filter((i) => !i.isDeleted)[0]?.url;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={()=>navigation.navigate('RideInfo',{bookingId:item.bookingId})}
      style={{ backgroundColor:C.surfaceLow, borderRadius:14, borderWidth:1, borderColor:C.border, marginBottom:14, overflow:'hidden' }}>
      {/* Top: image + status */}
      <View style={{ flexDirection:'row', padding:12, gap:12 }}>
        <View style={{ width:76, height:76, borderRadius:12, backgroundColor:C.surface, overflow:'hidden' }}>
          {cover
            ? <Image source={{ uri: photoUrl(cover) }} style={{ width:'100%', height:'100%' }} resizeMode='cover' />
            : <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}><Ionicons name='car-outline' size={22} color={C.textMuted} /></View>}
        </View>
        {/* Content aligned to the top of the row (status + name sit higher),
            with a specs/plate line filling the space in between. */}
        <View style={{ flex:1, justifyContent:'flex-start' }}>
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor:st.bg, borderWidth:1, borderColor:st.bd, borderRadius:100, paddingVertical:3, paddingHorizontal:9 }}>
              <View style={{ width:5, height:5, borderRadius:5, backgroundColor:st.fg }} />
              <CustomText fontType='primary' weight='Bold' style={{ color:st.fg, fontSize: 11, letterSpacing:.15, textTransform:'uppercase' }}>{st.label}</CustomText>
            </View>
            <CustomText fontType='primary' weight='Medium' style={{ color:C.textMuted, fontSize:10, textTransform:'uppercase' }}>#{item.bookingId}</CustomText>
          </View>
          <CustomText fontType='primary' weight='SemiBold' numberOfLines={1} ellipsizeMode='tail' style={{ color:C.text, fontSize:14, marginBottom:3 }}>{item.vehicle?.brand?.name} {item.vehicle?.vehicleName}</CustomText>
          {/* Extra details between the name and the trip window. */}
          <CustomText fontType='primary' weight='Regular' numberOfLines={1} style={{ color:C.textTertiary, fontSize:11 }}>
            {[item.vehicle?.vehicleFuelType, item.vehicle?.vehicleSeats && `${item.vehicle.vehicleSeats} seats`, item.vehicle?.vehicleNumber].filter(Boolean).join('  ·  ')}
          </CustomText>
        </View>
      </View>

      {/* Bottom: trip window */}
      <View style={{ flexDirection:'row', alignItems:'center', borderTopWidth:1, borderTopColor:C.border, paddingVertical:11, paddingHorizontal:14 }}>
        <View style={{ flex:1 }}>
          <CustomText fontType='primary' weight='SemiBold' style={{ color:C.textMuted, fontSize: 11, textTransform:'uppercase', letterSpacing:.3 }}>From</CustomText>
          <CustomText fontType='primary' weight='Medium' numberOfLines={1} style={{ color:C.text, fontSize:12, marginTop:1 }}>{formatDate(item.startTime,'long')}</CustomText>
        </View>
        <Ionicons name='arrow-forward' size={16} color={C.textMuted} style={{ marginHorizontal:8 }} />
        <View style={{ flex:1 }}>
          <CustomText fontType='primary' weight='SemiBold' style={{ color:C.textMuted, fontSize: 11, textTransform:'uppercase', letterSpacing:.3 }}>To</CustomText>
          <CustomText fontType='primary' weight='Medium' numberOfLines={1} style={{ color:C.text, fontSize:12, marginTop:1 }}>{formatDate(item.dropTime ? item.dropTime : item.endTime,'long')}</CustomText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = themedStyleSheet(C => ({
  container: {
    flex: 1,
    backgroundColor: C.background
  },

  listContainer: {
    padding: 16,
    paddingHorizontal:0,
  },

  vehicleItem: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: C.surface,
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
    color: C.text,
    marginBottom: 4,
  },

  vehicleYear: {
    fontSize: 16,
    color: C.primaryText,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.background,
  },

  errorText: {
    color: C.danger,
    fontSize: 18,
  }
}));
