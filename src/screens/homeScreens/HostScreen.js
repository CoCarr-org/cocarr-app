import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StatusBar, TouchableOpacity, Image, ScrollView, FlatList, ToastAndroid, RefreshControl, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate, notify } from '../../utils/utils';
import { styles } from '../../style';
import { updateUserRole, setHostStatus } from '../../store/authSlice';

// import Logo from '../../images/logo.png';
// import { BottomSheet, BottomSheetView } from '@gorhom/bottom-sheet';
export default function HostScreen() {
  const insets = useSafeAreaInsets();
  const navigator = useNavigation();
  const { startDateTime, endDateTime, selectedCity } = useSelector((state) => state.booking);
  const userRole = useSelector((state) => state.auth.userRole);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true); // Always start with loading shown
  const [signingUp, setSigningUp] = useState(false);

  const bottomSheetRef = useRef(null);

  // callbacks
  const handleSheetChanges = useCallback((index) => {
    console.log('handleSheetChanges', index);
  }, []);

  // This screen is the host SIGN-UP pitch, reached from the mode switcher when
  // the account isn't a host yet. It used to be a tab that ran /host/check on
  // every focus and replaced itself with the host shell — so an existing host
  // could never actually read it, and a tab press swapped the whole navigator.
  // Now it only reports status; entering the host shell is a state change.
  const checkHostRegistered = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/host/check`);
      dispatch(setHostStatus({ isHost: !!response.data.isHost }));
      // Already registered (e.g. signed up on the web): go straight in.
      if (response.data.isHost) {
        dispatch(updateUserRole({ userRole: 'host' }));
        navigator.goBack();
      }
    } catch (error) {
      console.log('Host check failed:', error?.response?.data ?? error?.message);
      notify('Something went wrong');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [dispatch, navigator]);

  // Check once on mount. Deliberately NOT useFocusEffect: re-running on every
  // focus is what made this screen impossible to stay on.
  useEffect(() => {
    checkHostRegistered();
    // eslint-disable-next-line
  }, []);

  async function handleHostSignup() {
    if (signingUp) return;
    setSigningUp(true);
    try {
      const checkResponse = await axios.get(`${API_URL}/host/check`);
      if (!checkResponse.data.isHost) await axios.post(`${API_URL}/host/`);
      dispatch(setHostStatus({ isHost: true }));
      dispatch(updateUserRole({ userRole: 'host' }));
      // No navigate/replace: MainNavigator swaps the shell off userRole, and
      // this screen unmounts with it.
    } catch (error) {
      console.log('Host signup failed:', error?.response?.data ?? error?.message);
      notify('Something went wrong');
    } finally {
      setSigningUp(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={BRAND_COLOR} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#000' }}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={checkHostRegistered} />}
    >
      {/* This is a pushed route now (headerShown is false app-wide), so it needs
          its own way back to the renting shell. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}>
        <TouchableOpacity onPress={() => navigator.goBack()} style={{ padding: 6 }}>
          <Icon name="chevron-back" size={22} color="#e3e3e3" />
        </TouchableOpacity>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          marginBottom: 40,
          paddingVertical: 20,
          alignContent: "center",
        }}
      >
        <Text style={[styles.text2xl, styles.brandColor, styles.fontSemibold, styles.textCenter, styles.mxAuto]}>
          Share your car with us and earn extra income
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, marginBottom: 40, paddingVertical: 20, alignContent: "center" }}>
        </View>
      </View>
      <View style={{ paddingHorizontal: 24 }}>
        <View style={[styles.bgPrimaryGrey, styles.rounded2xl]}>
          <View style={[styles.flexCol, styles.p4]}>
            <Text style={[styles.textBase, styles.fontSemibold, styles.textCenter]}>Start Renting Out your Car Now</Text>
            <Text style={[styles.textXs, styles.textGray, styles.textCenter]}>Upload your car RC number, car images and get verified to earn</Text>
            <TouchableOpacity
              onPress={handleHostSignup}
              disabled={signingUp}
              style={[styles.flexRow, styles.justifyCenter, styles.itemsCenter, styles.p2, styles.mt2, styles.brandColor, styles.roundedFull, signingUp && { opacity: 0.6 }]}
            >
              <Text style={[styles.buttonPrimaryMd, styles.mt2]}>{signingUp ? 'Setting up…' : 'Start Now'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, marginBottom: 40, paddingVertical: 20, alignContent: "center" }}>
        <Text style={{ color: '#efefef', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
          Why Choose Cocarr?
        </Text>
      </View>

      {/* <OfferSlider/> */}

      <FaqBlock />

    </ScrollView>
  );
}

// const FeatureCars = ({navigation}) => {

//   const [topCars, setTopCars] = useState([])

//   const getTopCars = async () => {
//     const response = await axios.get(`${API_URL}/vehicle?limit=6`)
//     setTopCars(response.data)
//   }

//   useEffect(() => {
//     getTopCars()
//   }, [])

//   return (
//     <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingVertical:40}}>
//       <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'center', paddingLeft:20,marginBottom:32}}> 
//           <Text style={{color:'#e3e3e3', fontSize:16, fontWeight:'500',marginBottom:1}}>
//             Top Cars
//           </Text>
//           <Text style={{color:'#a3a3a3', fontSize:12, fontWeight:'400'}}>
//             Cars Rated 4.5+ by customers
//           </Text>

//       </View>
//           <ScrollView alwaysBounceHorizontal={true} horizontal showsHorizontalScrollIndicator={false} style={{flexDirection:'row'}}>
//             {topCars.length === 0 ? (
//               <>
//                 {[1,2,3].map((item) => (
//                   <View key={item} style={{marginRight: 16}}>
//                     <View style={{
//                       width: 180,
//                       height: 120,
//                       borderRadius: 10,
//                       backgroundColor: '#1C1C1E',
//                       opacity: 0.7
//                     }}>
//                       <View style={{
//                         position: 'absolute',
//                         top: 0,
//                         left: 0,
//                         right: 0,
//                         bottom: 0,
//                         backgroundColor: '#1C1C1E',
//                         opacity: 0.3,
//                         transform: [{translateX: -100}],
//                         animation: 'shimmer 1s infinite'
//                       }} />
//                     </View>
//                     <View style={{marginTop: 8}}>
//                       <View style={{
//                         width: 80,
//                         height: 16,
//                         borderRadius: 4,
//                         backgroundColor: '#1C1C1E',
//                         marginBottom: 4,
//                         opacity: 0.7
//                       }} />
//                       <View style={{
//                         width: 60,
//                         height: 16,
//                         borderRadius: 4,
//                         backgroundColor: '#1C1C1E',
//                         opacity: 0.7
//                       }} />
//                     </View>
//                   </View>
//                 ))}
//               </>
//             ) : (
//               topCars.map((car,index) => (
//                 <TouchableOpacity key={index} style={{marginRight: 16,marginLeft:index === 0 ? 24 : 0, backgroundColor:'#1C1C1E',borderRadius:10}} onPress={()=>navigation.navigate('CarInfo', {vehicleId:car.vehicleId})}>
//                   {car.images && car.images.length > 0 && <Image source={{uri:car.images[0].url}} style={{width:180, height:120, borderRadius:10,borderBottomLeftRadius:0,borderBottomRightRadius:0,backgroundColor:'#757575'}}/>}
//                   <View style={{flexDirection:'column', justifyContent:'space-between', alignItems:'flex-start',paddingVertical:8,paddingHorizontal:12}}>
//                     <Text style={{color:'#fff', fontSize:13, fontWeight:'400'}}>{car.brand.name} {car.vehicleName}</Text>
//                     <Text style={{color:'#a3a3a3', fontSize:12, fontWeight:'400'}}>{car.vehicleFuelType} · {car.vehicleSeats} Seater · {car.vehicleYear}</Text>
//                     <Text style={{color:'#fff', fontSize:14, fontWeight:'500',marginTop:2}}>Rs.{car.vehiclePlan[0].perHourFee} /Hr</Text>
//                   </View>
//                 </TouchableOpacity>
//               ))
//             )}
//           </ScrollView>
         
//         </View>
//   )
// }

const FaqBlock = () => {
  const [activeQuestion, setActiveQuestion] = useState(0)
  const faqData = [
    { question: 'What is Cocarr?', answer: 'Cocarr is a car rental service that allows you to rent cars for short periods of time.' },
    { question: 'How does Cocarr work?', answer: 'Cocarr works by allowing you to rent cars for short periods of time.' },
    { question: 'What are the benefits of using Cocarr?', answer: 'The benefits of using Cocarr are that you can rent cars for short periods of time.' },
  ]

  const renderItem = ({ item }) => {
    return (
      <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1c1c1e' }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500', marginBottom: 4 }}>{item.question}</Text>
        <Text style={{ color: '#a3a3a3', fontSize: 12, fontWeight: '400' }}>{item.answer}</Text>
      </View>
    )
  }
  return (
    <View style={{ flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
      <View style={{ flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 20, marginBottom: 32 }}>
        <Text style={{ color: '#e3e3e3', fontSize: 16, fontWeight: '500', marginBottom: 1 }}>
          FAQ
        </Text>
      </View>
      <FlatList
        data={faqData}
        renderItem={renderItem}
      />
    </View>
  )
}