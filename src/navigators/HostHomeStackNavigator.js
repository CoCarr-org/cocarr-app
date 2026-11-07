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
import { CreateScheduleScreen } from '../screens/host/hostCarsScreens/CreateScheduleScreen';

import { C } from '../theme';

const Stack = createNativeStackNavigator();

export function HostHomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false ,statusBarColor:C.background}}>
      <Stack.Screen name="HomeIndex" component={Hostome} />
      <Stack.Screen name="PremiumMembership" component={PremiumMembershipScreen}/>
      <Stack.Screen name="CarsListing" component={CarsListingScreen} />
      {/* <Stack.Screen name="CarInfo" component={CarsInfoScreen} /> */}
      <Stack.Screen name="BookingOffers" options={{presentation: 'fullScreenModal',title:'Offers',headerShown:false}} component={BookingOfferScreen} />
      <Stack.Screen name="CreateSchedule" component={CreateScheduleScreen} />
      <Stack.Screen name="CityPicker" component={CityPickerScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
    </Stack.Navigator>
  );
}
