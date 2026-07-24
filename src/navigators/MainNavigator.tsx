import React, { useEffect } from 'react';
import { Alert, SafeAreaView } from 'react-native';
import HostScreen from '../screens/homeScreens/HostScreen';
import { HostProfile } from '../screens/host/hostProfileScreens/HostProfile.js';
import { useDispatch, useSelector } from 'react-redux';
import { CityPickerScreen } from '../screens/homeScreens/CityPickerScreen.js';
import { API_URL } from '../utils/constants.js';
import axios from 'axios';
import { setShowLastBooking } from '../store/bookingSlice.js';
import { ReviewScreen } from '../screens/rideScreens/ReviewScreen.jsx';
import { setHostStatus } from '../store/authSlice.js';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator.js';
import { HostBookingsScreen } from '../screens/host/bookingScreens/HostBookingsScreen.js';
import { HostReviewScreen } from '../screens/host/bookingScreens/HostReviewScreen.js';
import HostBookingInfoScreen from '../screens/host/bookingScreens/HostBookingInfoScreen.js';
import { HostCarsScreen } from '../screens/host/hostCarsScreens/HostCarsScreen.js';
import { HostCarInfoScreen } from '../screens/host/hostCarsScreens/HostCarInfoScreen.js';
import ScheduleInfoScreen from '../screens/host/hostCarsScreens/ScheduleInfoScreen.js';
import { CreateScheduleScreen } from '../screens/host/hostCarsScreens/CreateScheduleScreen.js';
import { CreateScheduleBlockScreen } from '../screens/host/hostCarsScreens/CreateScheduleBlock.js';
import { PaymentSuccessScreen } from '../screens/homeScreens/PaymentSuccessScreen.js';
import BookingOfferScreen from '../screens/homeScreens/carinfo/BookingOfferScreen.js';
import { CarsListingScreen } from '../screens/homeScreens/CarsListingScreen.js';
import PremiumMembershipScreen from '../screens/profileScreens/PremiumMembership.js';
import HostHomeScreen from '../screens/host/homeScreens/HostHomeScreen.js';
import { HostNavigator } from './HostNavigator.js';
import { ProfileScreen } from '../screens/profileScreens/ProfileScreen.js';
import { EditProfileScreen } from '../screens/profileScreens/EditProfileScreen.js';
import ReferralPage from '../screens/profileScreens/ReferralPage.js';
import OffersScreen  from '../screens/profileScreens/Offers.js';
import WalletPage from '../screens/profileScreens/WalletPage.js';
import { RidesScreen } from '../screens/rideScreens/RidesScreen.jsx';
import RideInfoScreen from '../screens/rideScreens/RideInfoScreen.jsx';
import { KycVerificationScreen } from '../screens/verificationScreens/KycVerificationScreen.js';
import { LicenseVerificationScreen } from '../screens/verificationScreens/LicenseVerificationScreen.js';
import { HostEndBookingScreen } from '../screens/host/bookingScreens/HostEndBookingScreen.js';
import AddCar from '../screens/host/homeScreens/AddCar.js';
import { CarsInfoScreen } from '../screens/homeScreens/carinfo/CarInfoScreen.js';
import { HostStartBookingScreen } from '../screens/host/bookingScreens/HostStartBookingScreen.js';
import { DatePickerScreen } from '../screens/homeScreens/DatePickerScreen.js';
import { HostBankPage } from '../screens/host/hostProfileScreens/HostBankPage.js';
import { setupNotificationListeners } from '../components/NotificationSetup.js';
import { CarsPaymentScreen } from '../screens/homeScreens/carinfo/CarPaymentScreen.js';
import { StartBookingScreen } from '../screens/rideScreens/StartBookingScreen.js';
import { EndBookingScreen } from '../screens/rideScreens/EndBookingScreen.js';
import { RescheduleScreen } from '../screens/rideScreens/RescheduleScreen.js';
import { HostDamageScreen } from '../screens/host/bookingScreens/HostDamageScreen.js';
import TermsAndConditionsScreen from '../screens/host/bookingScreens/TermsAndConditionsScreen.js';

const Stack = createNativeStackNavigator();


export function MainNavigator() {
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();


 
  async function fetchLastBooking() {
    try {
      const response = await axios.get(`${API_URL}/booking/last-booking`);
      console.log('last booking response',response.data);
      if(!response.data.review) dispatch(setShowLastBooking(response.data.booking));
    } catch (error) {
      console.log('token',error);
      Alert.alert('Error fetching last booking');
    }
  }
  
  useEffect(() => {
    fetchLastBooking();
  }, []);



  // Mode is NOT navigated to — the shell below is rendered from `userRole`, and
  // React Navigation unmounts the other one. The old effect called
  // navigation.navigate() here while HostScreen simultaneously called
  // navigation.replace(), so every switch ran two transitions at once.

  // `isHost` is a server fact, so re-check it once per authenticated session.
  // This is also what stops a stale persisted userRole:'host' from rendering the
  // host shell for an account that never registered as one.
  useEffect(() => {
    if (!auth.isAuthenticated) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/host/check`);
        if (!cancelled) dispatch(setHostStatus({ isHost: !!res.data?.isHost }));
      } catch (error) {
        // Offline or transient failure: leave the last known value alone rather
        // than dropping a host back to customer mode on a flaky network.
        console.log('Host status check skipped:', error?.message);
      }
    })();
    return () => { cancelled = true; };
  }, [auth.isAuthenticated, dispatch]);

  useEffect(() => {
    if(auth.isAuthenticated) setupNotificationListeners()
  },[auth.isAuthenticated])

  const isHostMode = auth.userRole === 'host';





  return (
    <SafeAreaView style={{flex:1, backgroundColor:'#151515'}}>
      
      <CityPickerScreen/>
      <ReviewScreen/>
      <Stack.Navigator screenOptions={{headerShown:false}}>

        {/* Exactly one shell exists at a time. Switching modes changes which
            Stack.Screen is declared, and React Navigation resets to it — no
            navigate/replace call is involved anywhere. */}
        {isHostMode ? (
          <Stack.Screen name="HostTab" component={HostNavigator} />
        ) : (
          <Stack.Screen name="HomeTab" component={TabNavigator} />
        )}

        {/* Host sign-up. A pushed route, not a tab and not a shell: it is only
            relevant until the account becomes a host. */}
        <Stack.Screen name="BecomeHost" component={HostScreen} />

        <Stack.Group>
          <Stack.Screen name="HostBookings" component={HostBookingsScreen} />
          <Stack.Screen name="HostReview" component={HostReviewScreen} options={{presentation: 'fullScreenModal',statusBarColor:'#1c1c1c'}}/>
          <Stack.Screen name="HostBookingInfo" component={HostBookingInfoScreen} />
          <Stack.Screen name="HostEndBooking" component={HostEndBookingScreen}/>
          <Stack.Screen name="HostStartBooking" component={HostStartBookingScreen}/>
          <Stack.Screen name="HostBankPage" component={HostBankPage}/>
          <Stack.Screen name="HostDamageScreen" component={HostDamageScreen}/>
          <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen}/>
        </Stack.Group>
        
        <Stack.Group>
          <Stack.Screen name="AddCar" component={AddCar}/>
          <Stack.Screen name="HostCars" component={HostCarsScreen} />
          <Stack.Screen name="HostCarInfo" component={HostCarInfoScreen}/>
          <Stack.Screen name="ScheduleInfo" component={ScheduleInfoScreen}/>
          <Stack.Screen name="CreateSchedule" component={CreateScheduleScreen}/>
          <Stack.Screen name="CreateScheduleBlock" component={CreateScheduleBlockScreen}/>
        </Stack.Group>

        <Stack.Group>
          <Stack.Screen name="HomeIndex" component={HostHomeScreen} />
          <Stack.Screen name="DatePicker" component={DatePickerScreen} />
          <Stack.Screen name="PremiumMembership" component={PremiumMembershipScreen}/>
          <Stack.Screen name="CarsListing" component={CarsListingScreen} />
          <Stack.Screen name="BookingOffers" options={{presentation: 'fullScreenModal',title:'Offers',headerShown:false}} component={BookingOfferScreen} />
          <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} /> 
          <Stack.Screen name="RescheduleScreen" component={RescheduleScreen}/>
        </Stack.Group>
        

        <Stack.Group>
          <Stack.Screen name="ProfileIndex" component={ProfileScreen} />
          {/* Pushed by TopBar's avatar when in the host shell. */}
          <Stack.Screen name="HostProfileScreen" component={HostProfile} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Referral" component={ReferralPage}/>
          <Stack.Screen name="Offers" component={OffersScreen} />
          <Stack.Screen name="Wallet" component={WalletPage}/>
        </Stack.Group>
        <Stack.Group>
          <Stack.Screen name="CarInfo" component={CarsInfoScreen} />
          <Stack.Screen name="StartBooking" component={StartBookingScreen}/>
          <Stack.Screen name="EndBooking" component={EndBookingScreen}/>
          <Stack.Screen name="CarPayment" component={CarsPaymentScreen} />
        </Stack.Group>
        <Stack.Group>
          <Stack.Screen name="RidesIndex" component={RidesScreen} />
          <Stack.Screen name="RideInfo" component={RideInfoScreen} />
        </Stack.Group>
        <Stack.Group>
          <Stack.Screen name="KycVerification" component={KycVerificationScreen}/>
          <Stack.Screen name="LicenseVerification" component={LicenseVerificationScreen}/>
          {/* <Stack.Screen name="ProfileVerification" component={ProfileVerificationScreen}/> */}
        </Stack.Group>
      </Stack.Navigator>
    </SafeAreaView>
  );
}
