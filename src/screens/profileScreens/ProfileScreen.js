import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, Image, TouchableHighlight, ToastAndroid, Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import auth from '@react-native-firebase/auth';
import Ionicons  from 'react-native-vector-icons/Ionicons'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import { useNavigation } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
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
      onPress: 'PremiumMembership',
      icon: <Ionicons name="ticket-outline" size={16} color="#fff" />,
      title: 'Premium Membership',
      description: 'Get access to premium features',
    },
    {
      onPress: 'Offers',
      icon: <Ionicons name="pricetags-outline" size={16} color="#fff" />,
      title: 'Offers & Discounts',
      description: 'View available offers for your next ride',
    },
    {
      onPress: 'Referral',
      icon: <Ionicons name="people-outline" size={16} color="#fff" />,
      title: 'Refer & Earn',
      description: 'Refer your friends to earn rewards',
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
      <View style={{paddingVertical:12,paddingHorizontal:20,flexDirection:'row',justifyContent:'flex-end',alignItems:'center'}}>
      {/* Edit profile is a compact icon button now, not a text pill. */}
      <TouchableHighlight underlayColor='#2c2c2e' onPress={()=>navigation.navigate('EditProfile')} style={{backgroundColor:'#1c1c1e',borderRadius:20,width:38,height:38,justifyContent:'center',alignItems:'center'}}>
                <Ionicons name="create-outline" size={18} color="#c3c3c3" />
              </TouchableHighlight>
      </View>
      <View style={{flex:1}}>
        <ScrollView style={{paddingHorizontal:20}} showsVerticalScrollIndicator={false}>


        <View style={{flexDirection:'column', gap:12,justifyContent:'center',alignItems:'center'}}>

          <View style={{flexDirection:'column', alignItems:'center',paddingVertical:16, gap:12,marginBottom:12}}>
            <View style={{flexDirection:'column', alignItems:'flex-start',backgroundColor:'#2c2c2e',borderRadius:120,width:120,height:120,justifyContent:'center',alignItems:'center'}}>
              {user?.profilePhoto && <Image source={{uri:photoUrl(user?.profilePhoto)}} style={{width:120, height:120, borderRadius:120}}/>}
            </View>
              <View style={{flexDirection:'column', alignItems:'center'}}>
                <Text style={{color:'#efefef', fontSize:15, fontWeight:'500',textAlign:'center'}}>{user?.userName}</Text>
                <Text style={{color:'#a3a3a3', fontSize:12, fontWeight:'400',textAlign:'center'}}>{user?.contactNumber}</Text>
              </View>
          </View>

        </View>
        

        <TouchableHighlight underlayColor='#2c2c2e' onPress={()=>navigation.navigate('Wallet')} style={{backgroundColor:'#EDBF3129',borderRadius:10,paddingVertical:10,paddingHorizontal:16,marginBottom:24}}>
               <View style={{flexDirection:'row',alignItems:'center',gap:12,justifyContent:'space-between'}}>
                <View style={{flexDirection:'row',alignItems:'center',gap:12}}>

                <View style={{backgroundColor:'#090909',borderRadius:48,width:48,height:48,justifyContent:'center',alignItems:'center'}}>
                  <Ionicons name="wallet-outline" size={24} color={BRAND_COLOR} />
                </View>
                    <View style={{flexDirection:'column',alignItems:'flex-start'}}>
                    <CustomText fontType='primary' weight='SemiBold' style={{color:'#c3c3c3', fontSize:11,textAlign:'center',letterSpacing:-.05}}>Wallet Points</CustomText>
                    <CustomText fontType='primary' weight='SemiBold' style={{color:'#c3c3c3', fontSize:16,textAlign:'center',letterSpacing:-.05}}>{!isNaN(walletInfo?.walletPoints) ? walletInfo?.walletPoints : '-'}</CustomText>
                    </View>
                </View>
                <Ionicons name="chevron-forward-outline" size={16} color={'#c3c3c3'} />
               </View>
              </TouchableHighlight>

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
