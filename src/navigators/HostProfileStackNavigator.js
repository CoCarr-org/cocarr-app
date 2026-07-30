import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profileScreens/ProfileScreen';
import { OffersScreen } from '../screens/profileScreens/Offers';
import ReferralPage from '../screens/profileScreens/ReferralPage';
import WalletPage from '../screens/profileScreens/WalletPage';
import PanVerificationScreen from '../screens/profileScreens/PanVerificationScreen';
import OnboardingWizardScreen from '../screens/profileScreens/OnboardingWizardScreen';
import { HostInboxScreen } from '../screens/host/hostInboxScreens/HostInboxScreen.js';
import { HostProfile } from '../screens/host/hostProfileScreens/HostProfile';

const Stack = createNativeStackNavigator();

export function HostProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false ,statusBarColor:'#000'}}>
      <Stack.Screen name="HostProfile" component={HostProfile} />
      <Stack.Screen name="HostInbox" component={HostInboxScreen} />
      <Stack.Screen name="Referral" component={ReferralPage}/>
      <Stack.Screen name="Offers" component={OffersScreen} />
      <Stack.Screen name="Wallet" component={WalletPage}/>
      <Stack.Screen name="PanVerification" component={PanVerificationScreen}/>
      <Stack.Screen name="OnboardingWizard" component={OnboardingWizardScreen}/>
    </Stack.Navigator>
  );
}
