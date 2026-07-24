import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, RefreshControl, ScrollView, Dimensions } from 'react-native';
import { API_URL, BOOKING_BOOKED, BOOKING_ONGOING, BOOKING_FINISHED, BOOKING_CANCELLED, BRAND_COLOR } from '../../utils/constants';
import { useSelector } from 'react-redux';
import { formatDate } from '../../utils/utils';
import HeaderBlock from '../../components/CenterHeader';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
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

const renderItem = (item,navigation) => {
  return (
    <View>
      <TouchableOpacity onPress={()=>navigation.navigate('RideInfo',{bookingId:item.bookingId})} style={{backgroundColor:'#1C1C1E', borderRadius:6,marginBottom:16,overflow:'hidden'}}>
        <View style={{flexDirection:'row'}}>
          <View style={{position:'relative'}}>
            <Image source={{uri:item.vehicle.images[0].url}} style={{width:120, height:120}}/>
          </View>
          <View style={{flexDirection:'column', justifyContent:'flex-start', alignItems:'flex-start',paddingVertical:16,paddingHorizontal:16}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start'}}>
              <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3', fontSize:10,marginBottom:0,textTransform:'uppercase',marginRight:4}}>#{item.bookingId}</CustomText>
              {/* <CustomText fontType='primary' weight='SemiBold' style={[
                { fontSize: 10,textTransform: 'uppercase' },
                item.status === BOOKING_BOOKED && { color: '#EDBF31' },
                item.status === BOOKING_ONGOING && { color: '#EDBF31' },
                item.status === BOOKING_FINISHED && { color: '#a3a3a3' },
                item.status === BOOKING_CANCELLED && { color: '#FF6347' }
              ]}>{`\u2022 ${item.status}`}</CustomText> */}
            </View>
            <CustomText fontType='primary' weight='Medium' style={{color:'#fff', fontSize:12,marginBottom:8,marginTop:2}} numberOfLines={1} ellipsizeMode='tail'>{item.vehicle.brand.name} {item.vehicle.vehicleName}</CustomText>

            <View style={{flexDirection:'row',justifyContent:'center',borderRadius:4,marginBottom:4,alignItems:'center'}}>
              <View style={{backgroundColor:'#5ACC5A75',borderRadius:12,width:14,height:14,marginRight:4,justifyContent:'center',alignItems:'center'}}>
                <View style={{backgroundColor:'#5ACC5AAA',borderRadius:8,width:8,height:8}}></View>
              </View>
              <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3', fontSize:12, fontWeight:'400'}}>{formatDate(item.startTime,'long')}</CustomText>
            </View>
            <View style={{flexDirection:'row',justifyContent:'center',borderRadius:4,marginVertical:4,alignItems:'center'}}>
              <View style={{backgroundColor:'#CC5A5A75',borderRadius:12,width:14,height:14,marginRight:4,justifyContent:'center',alignItems:'center'}}>
                <View style={{backgroundColor:'#CC5A5AAA',borderRadius:8,width:8,height:8}}></View>
              </View>
              <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3', fontSize:12, fontWeight:'400'}}>{formatDate(item.dropTime ? item.dropTime : item.endTime,'long')}</CustomText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
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
