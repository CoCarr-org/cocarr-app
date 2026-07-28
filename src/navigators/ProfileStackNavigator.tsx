import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profileScreens/ProfileScreen';
import { OffersScreen } from '../screens/profileScreens/Offers';
import { EditProfileScreen } from '../screens/profileScreens/EditProfileScreen';
import PremiumMembershipScreen from '../screens/profileScreens/PremiumMembership';
import ReferralPage from '../screens/profileScreens/ReferralPage';
import WalletPage from '../screens/profileScreens/WalletPage';
import PanVerificationScreen from '../screens/profileScreens/PanVerificationScreen';
import VerificationScreen from '../screens/profileScreens/VerificationScreen';
import OnboardingWizardScreen from '../screens/profileScreens/OnboardingWizardScreen';
import LicenceVerificationScreen from '../screens/profileScreens/LicenceVerificationScreen';
import AadhaarVerificationScreen from '../screens/profileScreens/AadhaarVerificationScreen';

const Stack = createNativeStackNavigator();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false ,statusBarColor:'#000'}}>
      <Stack.Screen name="ProfileIndex" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      
      <Stack.Screen name="Referral" component={ReferralPage}/>
      <Stack.Screen name="Offers" component={OffersScreen} />
      <Stack.Screen name="Wallet" component={WalletPage}/>
      <Stack.Screen name="PanVerification" component={PanVerificationScreen}/>
      <Stack.Screen name="OnboardingWizard" component={OnboardingWizardScreen}/>
      <Stack.Screen name="Verification" component={VerificationScreen}/>
      <Stack.Screen name="LicenceVerification" component={LicenceVerificationScreen}/>
      <Stack.Screen name="AadhaarVerification" component={AadhaarVerificationScreen}/>
    </Stack.Navigator>
  );
}
