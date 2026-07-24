import React, { useEffect, useState } from 'react';
import { notify } from '../../../utils/utils';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, Image, TouchableHighlight, ToastAndroid } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateUserRole } from '../../../store/authSlice';
import auth from '@react-native-firebase/auth';
import Ionicons  from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import { useNavigation } from '@react-navigation/native';
import CustomText from '../../../components/CustomText';
import { API_URL, BRAND_COLOR } from '../../../utils/constants';
import axios from 'axios';

export function HostInboxScreen() {
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth);
  const navigation = useNavigation();
  const [walletInfo, setWalletInfo] = useState(0);
  const handleLogout = async () => {
    try {
      if (auth().currentUser) {
        await auth().signOut();
      } else {
        console.log('No current user to sign out');
      }
      dispatch(logout());
    } catch (error) {
      console.error('Error signing out: ', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };


  useEffect(()=>{
    const getWalletPoints = async () => {
      try {
        let walletInfo = await axios.get(`${API_URL}/wallet/my-wallet`);
        setWalletInfo(walletInfo.data);
      } catch (error) {
        console.log('error',error);
        notify(`Error fetching wallet points: ${error.message}`);
      }
    }
    getWalletPoints();
  },[navigation]);

  const options = [
    {
      onPress: 'HostEarnings',
      icon: <Ionicons name="chatbubble-outline" size={16} color="#fff" />,
      title: '#M5L42QAE',
      description: 'Your customer is waiting for you',
    }
  ];


  return (
    <View style={styles.container}>
      {/* Title is the shared header now (TopBar / stack header). */}
      <View style={{flex:1}}>
        <ScrollView style={{paddingHorizontal:20,paddingTop:8}} showsVerticalScrollIndicator={false}>

{/* 
        {options.map((option, index) => (
            <TouchableHighlight
              key={index}
              onPress={option.onPress === 'logout'  ? handleLogout : ()=>navigation.navigate(option.onPress)}
              underlayColor='#090909'
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderBottomColor: '#0c0c0e',
                paddingVertical: 16,
              }}
            >
              <View style={{flexDirection:'row',alignItems:'center',gap:12}}>

              <View
                style={{
                  backgroundColor: '#1C1C1E',
                  borderRadius: 40,
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                >
                {option.icon}
              </View>
              <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <CustomText fontType='primary' weight='Medium' style={{ color: '#fff', fontSize: 12 }}>
                  {option.title}
                </CustomText>
                {option.description && (
                  <CustomText fontType='primary' weight='Regular' style={{ color: '#959595', fontSize: 11 }}>
                    {option.description}
                  </CustomText>
                )}
              </View>
                </View>
            </TouchableHighlight>
          ))} */}


        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#EDBF31',
    marginBottom: 20,
  },
  userInfo: {
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#EDBF31',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
