import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HostInboxScreen } from '../screens/host/hostInboxScreens/HostInboxScreen';

import { C } from '../theme';

const Stack = createNativeStackNavigator();

export function HostInboxStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false ,statusBarColor:C.background}}>
      <Stack.Screen name="HostInbox" component={HostInboxScreen} />
    </Stack.Navigator>
  );
}
