import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, Image, TouchableHighlight, ToastAndroid, Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import auth from '@react-native-firebase/auth';
import Ionicons  from 'react-native-vector-icons/Ionicons'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import { useNavigation } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
import ProfileStatusPrompt from '../../components/ProfileStatusPrompt';
import VerificationBadge from '../../components/VerificationBadge';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import { photoUrl, notify } from '../../utils/utils';
import axios from 'axios';

export function ProfileScreen() {
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
      onPress: 'Referral',
      icon: <Ionicons name="people-outline" size={16} color="#fff" />,
      title: 'Refer & Earn',
      description: 'Refer your friends to earn rewards',
    },
    {
      onPress: 'Verification',
      icon: <Ionicons name="shield-checkmark-outline" size={16} color="#fff" />,
      title: 'Profile Verification',
      description: 'Complete your details and submit for review',
    },
    {
      onPress: 'PanVerification',
      icon: <Ionicons name="card-outline" size={16} color="#fff" />,
      title: 'PAN Verification',
      description: 'Required to receive payouts',
    },
    {
      onPress: () => Linking.openURL('https://cocarr.com/terms-and-conditions'),
      icon: <Ionicons name="document-text-outline" size={16} color="#fff" />,
      title: 'Terms & Conditions',
      description: 'Read our user agreement for more information.',
    },
    {
      onPress: () => Linking.openURL(Platform.OS === 'ios' ? 'https://apps.apple.com' : 'https://play.google.com/store'),
      icon: <Ionicons name="document-text-outline" size={16} color="#fff" />,
      title: 'Rate Us',
      description: `Rate us on the ${Platform.OS === 'ios' ? 'App Store' : 'Play Store'} and help us improve`,
    },
    {
      onPress: 'logout',
      icon: <SimpleLineIcons name="login" size={16} color="#fff" />,
      title: 'Logout',
    },
  ];


  return (
    <View style={styles.container}>
      {/* Edit profile moved to the header action; wallet points to the app header. */}
      <View style={{flex:1}}>
        <ScrollView style={{paddingHorizontal:20}} showsVerticalScrollIndicator={false}>

        {/* Verification is enforced on booking, so this is the first thing a
            user with an unfinished profile should see. */}
        <ProfileStatusPrompt />

        <View style={{flexDirection:'column', gap:12,justifyContent:'center',alignItems:'center'}}>

          <View style={{flexDirection:'column', alignItems:'center',paddingVertical:16, gap:12,marginBottom:12}}>
            <View style={{position:'relative'}}>
              <View style={{flexDirection:'column', alignItems:'flex-start',backgroundColor:'#2c2c2e',borderRadius:120,width:120,height:120,justifyContent:'center',alignItems:'center'}}>
              {user?.profilePhoto && <Image source={{uri:photoUrl(user?.profilePhoto)}} style={{width:120, height:120, borderRadius:120}}/>}
            </View>
              <VerificationBadge size='lg' ringColor='#000' />
            </View>
              <View style={{flexDirection:'column', alignItems:'center'}}>
                <Text style={{color:'#efefef', fontSize:15, fontWeight:'500',textAlign:'center'}}>{user?.userName}</Text>
                <Text style={{color:'#a3a3a3', fontSize:12, fontWeight:'400',textAlign:'center'}}>{user?.contactNumber}</Text>
              </View>
          </View>

        </View>
        

        {/* Wallet points moved to the app header. */}
        {options.map((option, index) => (
            <TouchableHighlight
              key={index}
              onPress={typeof option.onPress === 'function' ? option.onPress : option.onPress === 'logout' ? handleLogout : ()=>navigation.navigate(option.onPress)}
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
          ))}


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
