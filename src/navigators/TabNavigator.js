import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { HomeStackNavigator } from './HomeStackNavigator';
import { RidesStackNavigator } from './RidesStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { SettingsScreen } from '../screens/SettingsScreen';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import HomeIcon from '../images/home.js';
import { Image, Path, Svg } from 'react-native-svg';
import { useDispatch, useSelector } from 'react-redux';
import { CityPickerScreen } from '../screens/homeScreens/CityPickerScreen.js';
import { API_URL } from '../utils/constants.js';
import axios from 'axios';
import { setShowLastBooking } from '../store/bookingSlice.js';
import { ReviewScreen } from '../screens/rideScreens/ReviewScreen.jsx';
import { store } from '../store/store.js';
import { updateToken } from '../store/authSlice.js';
import { getAuth } from '@react-native-firebase/auth';
import AppTabBar from '../components/navigation/AppTabBar';
import TopBar from '../components/navigation/TopBar';
import HomeScreen from '../screens/homeScreens/HomeScreen.js';
import { RidesScreen } from '../screens/rideScreens/RidesScreen.jsx';
import OffersScreen  from '../screens/profileScreens/Offers.js';
import MembershipScreen from '../screens/profileScreens/MembershipScreen.js';

const Tab = createBottomTabNavigator();


export function TabNavigator() {


  return (
        <Tab.Navigator
        // Both chrome pieces are custom: AppTabBar draws the pill plus the mode
        // toggle, TopBar draws the page title and the always-present profile
        // avatar. Titles come from each screen's `options.title` below.
        tabBar={(props) => <AppTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          header: ({ options, route }) => <TopBar title={options.title || route.name} />,
        }}
      >
        <Tab.Screen 
          name="Home"
          component={HomeScreen} 
          options={{
            title: 'Home',
            tabBarIcon: ({focused,color, size}) => <Svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <Path d="M2.35198 13.214C1.99798 10.916 1.82198 9.768 2.25598 8.749C2.68998 7.73 3.65398 7.034 5.58098 5.641L7.02098 4.6C9.41798 2.867 10.617 2 12.001 2C13.383 2 14.581 2.867 16.979 4.6L18.419 5.641C20.346 7.034 21.309 7.731 21.744 8.749C22.178 9.768 22.002 10.916 21.649 13.213L21.348 15.173C20.848 18.429 20.597 20.057 19.429 21.029C18.261 22.001 16.554 22 13.14 22H10.86C7.44498 22 5.73798 22 4.56998 21.029C3.40198 20.057 3.15198 18.429 2.65198 15.172L2.35198 13.214Z" stroke={focused ? color : `#808080`} fill={focused ? color : 'transparent'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
          }}
        />
        <Tab.Screen 
          name="Rides"
          component={RidesScreen} 
          options={{
            title: 'My Trips',
            tabBarIcon: ({focused,color, size}) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path d="M16.755 2H7.245C6.086 2 5.507 2 5.039 2.163C4.59793 2.31972 4.19885 2.57586 3.87267 2.91158C3.54649 3.24731 3.30195 3.6536 3.158 4.099C3 4.581 3 5.177 3 6.37V20.374C3 21.232 3.985 21.688 4.608 21.118C4.78279 20.9565 5.01202 20.8668 5.25 20.8668C5.48798 20.8668 5.71721 20.9565 5.892 21.118L6.375 21.56C6.68121 21.8432 7.08293 22.0004 7.5 22.0004C7.91707 22.0004 8.31879 21.8432 8.625 21.56C8.93121 21.2768 9.33293 21.1196 9.75 21.1196C10.1671 21.1196 10.5688 21.2768 10.875 21.56C11.1812 21.8432 11.5829 22.0004 12 22.0004C12.4171 22.0004 12.8188 21.8432 13.125 21.56C13.4312 21.2768 13.8329 21.1196 14.25 21.1196C14.6671 21.1196 15.0688 21.2768 15.375 21.56C15.6812 21.8432 16.0829 22.0004 16.5 22.0004C16.9171 22.0004 17.3188 21.8432 17.625 21.56L18.108 21.118C18.2828 20.9565 18.512 20.8668 18.75 20.8668C18.988 20.8668 19.2172 20.9565 19.392 21.118C20.015 21.688 21 21.232 21 20.374V6.37C21 5.177 21 4.58 20.842 4.1C20.6982 3.65441 20.4537 3.24792 20.1275 2.91202C19.8013 2.57612 19.4022 2.31982 18.961 2.163C18.493 2 17.914 2 16.755 2Z" stroke={color} stroke-width="5" fill={focused ? color : 'transparent'}/>
            <Path d="M10.5 11H17M7 11H7.5M7 7.5H7.5M7 14.5H7.5M10.5 7.5H17M10.5 14.5H17" stroke={focused ? '#000' : color} stroke-width="5" stroke-linecap="round"/>
            </Svg>
            
          }}
        />
        <Tab.Screen 
          name="Offers"
          component={OffersScreen} 
          options={{
            title: 'Offers',
            tabBarIcon: ({focused,color, size}) => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <Path d="M16.755 2H7.245C6.086 2 5.507 2 5.039 2.163C4.59793 2.31972 4.19885 2.57586 3.87267 2.91158C3.54649 3.24731 3.30195 3.6536 3.158 4.099C3 4.581 3 5.177 3 6.37V20.374C3 21.232 3.985 21.688 4.608 21.118C4.78279 20.9565 5.01202 20.8668 5.25 20.8668C5.48798 20.8668 5.71721 20.9565 5.892 21.118L6.375 21.56C6.68121 21.8432 7.08293 22.0004 7.5 22.0004C7.91707 22.0004 8.31879 21.8432 8.625 21.56C8.93121 21.2768 9.33293 21.1196 9.75 21.1196C10.1671 21.1196 10.5688 21.2768 10.875 21.56C11.1812 21.8432 11.5829 22.0004 12 22.0004C12.4171 22.0004 12.8188 21.8432 13.125 21.56C13.4312 21.2768 13.8329 21.1196 14.25 21.1196C14.6671 21.1196 15.0688 21.2768 15.375 21.56C15.6812 21.8432 16.0829 22.0004 16.5 22.0004C16.9171 22.0004 17.3188 21.8432 17.625 21.56L18.108 21.118C18.2828 20.9565 18.512 20.8668 18.75 20.8668C18.988 20.8668 19.2172 20.9565 19.392 21.118C20.015 21.688 21 21.232 21 20.374V6.37C21 5.177 21 4.58 20.842 4.1C20.6982 3.65441 20.4537 3.24792 20.1275 2.91202C19.8013 2.57612 19.4022 2.31982 18.961 2.163C18.493 2 17.914 2 16.755 2Z" stroke={color} stroke-width="5" fill={focused ? color : 'transparent'}/>
            <Path d="M10.5 11H17M7 11H7.5M7 7.5H7.5M7 14.5H7.5M10.5 7.5H17M10.5 14.5H17" stroke={focused ? '#000' : color} stroke-width="5" stroke-linecap="round"/>
            </Svg>

          }}
        />
        <Tab.Screen
          name="Membership"
          component={MembershipScreen}
          options={{
            title: 'Member',
            tabBarIcon: ({ focused, color }) => (
              <Icon name={focused ? 'star' : 'star-outline'} size={20} color={color} />
            ),
          }}
        />
        {/* No Host tab (it swapped the whole navigator, which a tab press must
            never do) and no Profile tab — hosting is the round toggle in
            AppTabBar, profile is the avatar in TopBar. */}
      </Tab.Navigator>
  );
}
