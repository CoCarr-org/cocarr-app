import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import  HomeScreen from '../screens/homeScreens/HomeScreen';
import { CarsListingScreen } from '../screens/homeScreens/CarsListingScreen';
import { CarsInfoScreen } from '../screens/homeScreens/carinfo/CarInfoScreen';
import { DatePickerScreen } from '../screens/homeScreens/DatePickerScreen';
import { CityPickerScreen } from '../screens/homeScreens/CityPickerScreen';
import { PaymentSuccessScreen } from '../screens/homeScreens/PaymentSuccessScreen';
import BookingOfferScreen from '../screens/homeScreens/carinfo/BookingOfferScreen';
import PremiumMembershipScreen from '../screens/profileScreens/PremiumMembership';
import HostHomeScreen from '../screens/host/homeScreens/HostHomeScreen';
import AddCar from '../screens/host/homeScreens/AddCar';
import { HostBookingsScreen } from '../screens/host/bookingScreens/HostBookingsScreen';
import HostBookingInfoScreen from '../screens/host/bookingScreens/HostBookingInfoScreen';
import { HostReviewScreen } from '../screens/host/bookingScreens/HostReviewScreen';
import { C } from '../theme';

const Stack = createNativeStackNavigator();

export function HostBookingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false ,statusBarColor:C.background}}>
      <Stack.Screen name="HostBookings" component={HostBookingsScreen} />
      <Stack.Screen name="HostReview" component={HostReviewScreen} options={{presentation: 'fullScreenModal',statusBarColor:C.surface}}/>
      <Stack.Screen name="HostBookingInfo" component={HostBookingInfoScreen} />
    </Stack.Navigator>
  );
}
