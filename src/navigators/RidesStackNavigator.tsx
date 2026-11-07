import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RidesScreen } from '../screens/rideScreens/RidesScreen';
import RideInfoScreen from '../screens/rideScreens/RideInfoScreen';

import { C } from '../theme';

const Stack = createNativeStackNavigator();

export function RidesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false,statusBarColor:C.background}}>
      <Stack.Screen name="RidesIndex" component={RidesScreen} />
      <Stack.Screen name="RideInfo" component={RideInfoScreen} />
    </Stack.Navigator>
  );
}
