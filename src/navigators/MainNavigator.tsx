import React, { useEffect } from 'react';
import { View } from 'react-native';
import HostScreen from '../screens/homeScreens/HostScreen';
import { HostProfile } from '../screens/host/hostProfileScreens/HostProfile.js';
import { useDispatch, useSelector } from 'react-redux';
import { CityPickerScreen } from '../screens/homeScreens/CityPickerScreen.js';
import { API_URL } from '../utils/constants.js';
import axios from 'axios';
import { setShowLastBooking } from '../store/bookingSlice.js';
import { ReviewScreen } from '../screens/rideScreens/ReviewScreen.jsx';
import { setHostStatus } from '../store/authSlice.js';
import TopBar from '../components/navigation/TopBar';
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
import HostEarningsPage from '../screens/host/hostProfileScreens/HostEarningsPage.js';
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
      // A brand-new account with no finished bookings gets `null` back here,
      // not `{booking, review}` — reading `.review` off that threw, which
      // this catch then reported as a misleading "Error fetching last
      // booking" alert on every first login.
      if (response.data && !response.data.review) dispatch(setShowLastBooking(response.data.booking));
    } catch (error) {
      console.log('token',error);
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





  // Plain View here on purpose: TopBar already pads for the top inset and
  // AppTabBar for the bottom one. Applying insets at this level too
  // double-counted them — that was the gap under the tab bar.
  return (
    <View style={{flex:1, backgroundColor:'#000'}}>
      
      <CityPickerScreen/>
      <ReviewScreen/>
      {/* One header for every pushed sub-page: safe-area aware, back chevron,
          screen title. `back` is only defined once there's somewhere to return
          to, so the shell (first screen) and any reset-to root render no header.
          Screens that draw their own chrome (wizards, modals, tabbed detail
          pages) opt out with headerShown:false in their own options. Titles
          come from each screen's `title`. */}
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          header: ({ options, route, back }) =>
            back ? <TopBar title={options.title || route.name} showBack /> : null,
        }}
      >

        {/* Exactly one shell exists at a time. Switching modes changes which
            Stack.Screen is declared, and React Navigation resets to it — no
            navigate/replace call is involved anywhere. The shell manages its own
            insets (TopBar + AppTabBar), so it opts out of the shared header. */}
        {isHostMode ? (
          <Stack.Screen name="HostTab" component={HostNavigator} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="HomeTab" component={TabNavigator} options={{ headerShown: false }} />
        )}

        {/* Host sign-up. Draws its own back control. */}
        <Stack.Screen name="BecomeHost" component={HostScreen} options={{ headerShown: false }} />

        <Stack.Group>
          <Stack.Screen name="HostBookings" component={HostBookingsScreen} options={{ title: 'Bookings' }} />
          <Stack.Screen name="HostReview" component={HostReviewScreen} options={{presentation: 'fullScreenModal', headerShown: false}}/>
          <Stack.Screen name="HostBookingInfo" component={HostBookingInfoScreen} options={{ headerShown: false }} />
          <Stack.Screen name="HostEndBooking" component={HostEndBookingScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="HostStartBooking" component={HostStartBookingScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="HostBankPage" component={HostBankPage} options={{ headerShown: false }}/>
          <Stack.Screen name="HostEarnings" component={HostEarningsPage} options={{ title: 'Earnings' }}/>
          <Stack.Screen name="HostDamageScreen" component={HostDamageScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} options={{ title: 'Terms & Conditions' }}/>
        </Stack.Group>

        <Stack.Group>
          {/* Wizard and tabbed detail draw their own chrome. */}
          <Stack.Screen name="AddCar" component={AddCar} options={{ headerShown: false }}/>
          <Stack.Screen name="HostCars" component={HostCarsScreen} options={{ title: 'Your Cars' }} />
          <Stack.Screen name="HostCarInfo" component={HostCarInfoScreen} options={{ title: 'Car details' }}/>
          <Stack.Screen name="ScheduleInfo" component={ScheduleInfoScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="CreateSchedule" component={CreateScheduleScreen} options={{ title: 'New Schedule' }}/>
          <Stack.Screen name="CreateScheduleBlock" component={CreateScheduleBlockScreen} options={{ title: 'Block Dates' }}/>
        </Stack.Group>

        <Stack.Group>
          <Stack.Screen name="HomeIndex" component={HostHomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DatePicker" component={DatePickerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PremiumMembership" component={PremiumMembershipScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="CarsListing" component={CarsListingScreen} options={{ title: 'Cars' }} />
          <Stack.Screen name="BookingOffers" options={{presentation: 'fullScreenModal', headerShown:false}} component={BookingOfferScreen} />
          <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RescheduleScreen" component={RescheduleScreen} options={{ title: 'Reschedule' }}/>
        </Stack.Group>

        <Stack.Group>
          {/* Profile screens are pushed from TopBar's avatar; the shared header
              gives them a back control and a title. */}
          {/* Profile screens carry an edit-profile action in the header. */}
          <Stack.Screen name="ProfileIndex" component={ProfileScreen} options={{ headerShown: true, header: () => <TopBar title="Profile" showBack rightIcon="create-outline" rightRoute="EditProfile" /> }} />
          <Stack.Screen name="HostProfileScreen" component={HostProfile} options={{ headerShown: true, header: () => <TopBar title="Profile" showBack rightIcon="create-outline" rightRoute="EditProfile" /> }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Referral" component={ReferralPage} options={{ title: 'Refer & Earn' }}/>
          <Stack.Screen name="Offers" component={OffersScreen} options={{ title: 'Offers' }} />
          <Stack.Screen name="Wallet" component={WalletPage} options={{ title: 'Wallet' }} />
        </Stack.Group>
        <Stack.Group>
          {/* Car detail carries a hero image behind its own header. */}
          <Stack.Screen name="CarInfo" component={CarsInfoScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StartBooking" component={StartBookingScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="EndBooking" component={EndBookingScreen} options={{ headerShown: false }}/>
          <Stack.Screen name="CarPayment" component={CarsPaymentScreen} options={{ title: 'Booking Summary' }} />
        </Stack.Group>
        <Stack.Group>
          <Stack.Screen name="RidesIndex" component={RidesScreen} options={{ title: 'My Trips' }} />
          <Stack.Screen name="RideInfo" component={RideInfoScreen} options={{ headerShown: false }} />
        </Stack.Group>
        <Stack.Group>
          <Stack.Screen name="KycVerification" component={KycVerificationScreen} options={{ title: 'Verify KYC' }}/>
          <Stack.Screen name="LicenseVerification" component={LicenseVerificationScreen} options={{ title: 'Verify Licence' }}/>
        </Stack.Group>
      </Stack.Navigator>
    </View>
  );
}
