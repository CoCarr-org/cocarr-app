import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, StatusBar, TouchableHighlight, ActivityIndicator, ToastAndroid, ScrollView, RefreshControl } from 'react-native';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import { formatDate, notify } from '../../utils/utils';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '../../components/CustomText';
import { ClipPath, Defs, G, Path, Rect, Svg } from 'react-native-svg';
import { SceneMap, TabBar, TabBarItem, TabView } from 'react-native-tab-view';
import RazorpayCheckout from 'react-native-razorpay';

export default function WalletPage() {
  const [profile, setProfile] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const getMyProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/wallet/my-wallet`);
      console.log('profile',response.data);
      setProfile(response.data);
      setLoading(false);
    } catch (error) {
        console.log(error);
        setError(true);
        setLoading(false);
    }
};

const getTransactions = async () => {
    try {
        const response = await axios.get(`${API_URL}/wallet/my-transaction`);
        console.log('trasa',response.data);
      setTransactions(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      setError(true);
      notify('Something went wrong. Please try again later.');
      setLoading(false);
      setRefreshing(false);
    }
  };



  useEffect(() => {
    getMyProfile();
    getTransactions();
  }, []);

  const onPress = async () => {
    if(!profile.isPremium || profile.membership.isRenewable){
      await initiateBooking();
    }else{
      navigation.navigate('Home');
    }
  }

  if(loading){
    return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000'}}>
      <ActivityIndicator size="large" color={BRAND_COLOR} />
    </View>
  }

  if(error){
    return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000'}}>
      <CustomText fontType='primary' weight='Medium' style={{color:'#e3e3e3',fontSize:14,textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:0.05}}>Something went wrong. Please try again later.</CustomText>
    </View>
  }

  const benefits = [
    {title:'Free Usage',premium:{isTicked:true,value:'1 Day'},nonPremium:{isTicked:false,value:''}},
    {title:'Free Delivery',premium:{isTicked:true,value:'1'},nonPremium:{isTicked:false,value:''}},
    {title:'Unlimited Kms',premium:{isTicked:true,value:''},nonPremium:{isTicked:false,value:''}},
    {title:'Exclusive Discounts',premium:{isTicked:true,value:''},nonPremium:{isTicked:false,value:''}},
    {title:'Deposit Amount',premium:{isTicked:false,value:''},nonPremium:{isTicked:true,value:''}},
    {title:'Car Replacement',premium:{isTicked:true,value:''},nonPremium:{isTicked:false,value:''}},
    {title:'24/7 Support',premium:{isTicked:true,value:''},nonPremium:{isTicked:true,value:''}},
    {title:'Cocarr Club Access',premium:{isTicked:true,value:''},nonPremium:{isTicked:false,value:''}},
  ]

  return (
    <View style={styles.container}>
      {/* Header (back + "Wallet") is the shared stack header now. */}
      <View style={{ backgroundColor:'#1c1c1e',paddingVertical:24,paddingHorizontal:16,}}>

        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',marginBottom:16,width:48,height:48,borderRadius:56,backgroundColor:'#000',padding:4,justifyContent:'center',alignItems:'center',marginHorizontal:'auto'}}>
            <Icon name="wallet-outline" size={24} color={BRAND_COLOR} />
        </View>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#e3e3e3',fontSize:16,textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:0.05}}>Wallet Points</CustomText>

        <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3',fontSize:12,textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:-0.05}}>Earn points by referring your friends</CustomText>

{/* 
        <TouchableHighlight onPress={onPress} underlayColor='#2c2c2e' style={{backgroundColor:BRAND_COLOR,paddingVertical:12,paddingHorizontal:24,borderRadius:24,marginTop:12,marginHorizontal:'auto'}}>
          <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:12,textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:-0.05,textTransform:'uppercase'}}>Refer Now</CustomText>
        </TouchableHighlight> */}
      </View>

        <FlatList
        
        refreshControl={<RefreshControl titleColor={'#e3e3e3'} progressBackgroundColor={BRAND_COLOR} refreshing={refreshing} onRefresh={getTransactions} />}
        ListHeaderComponent={() => <View style={{backgroundColor:'#0f0f0f',paddingVertical:12,paddingHorizontal:16,}}>
        <CustomText fontType='primary' weight='Bold' style={{color:'#757575',fontSize:11,letterSpacing:0.05,textTransform:'uppercase'}}>Transactions</CustomText>
        </View>}
        data={transactions}
        renderItem={({item}) => <View style={{borderBottomWidth:1,borderBottomColor:'#1c1c1e',paddingVertical:20,paddingHorizontal:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',flex:1}}>
                <View style={{backgroundColor:item.isCredit ? '#29C08B35' : '#EF444435',borderRadius:32,padding:4,height:32,width:32,justifyContent:'center',alignItems:'center',marginRight:12}}>
                    <Icon name={item.isCredit ? 'arrow-up' : 'arrow-down'} size={20} color={item.isCredit ? '#29C08B' : '#EF4444'}  />
                </View>
                <CustomText fontType='primary' weight='Medium' style={{color:'#e3e3e3',fontSize:12,fontWeight:'500',letterSpacing:-0.05,flex:1,lineHeight:18,paddingRight:12}}>{item.description}</CustomText>
            </View>
                
          <CustomText fontType='primary' weight='Medium' style={{color:item.isCredit ? '#29C08B' : '#EF4444',fontSize:14,fontWeight:'500',textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:-0.05}}> {item.isCredit ? '+' : '-'} {item.points}</CustomText>
        </View>}
      />
    </View>
  );
}




const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#1c1c1e'
    },
    headerLeft: {
        flex:1,
        alignItems:'flex-start'
    },
    headerRight: {
        flex:1,
        alignItems:'flex-end',
        justifyContent:'center'
    },
    headerCenter: {
        flex:1,
        alignItems:'center',
        justifyContent:'center'
    },  
    headerTitle: {
        flex:1,
        alignItems:'center'
    },
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  listContainer: {
    padding: 16,
  },
  vehicleItem: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  vehicleImage: {
    borderRadius: 12,
    width: '100%',
    height: 180,
  },
  vehicleInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  vehicleYear: {
    fontSize: 16,
    color: '#EDBF31',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
  },
});
