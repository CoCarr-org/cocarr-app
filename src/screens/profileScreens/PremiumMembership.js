import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

export default function PremiumMembershipScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState([]);
  const [membership, setMembership] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isRenewable, setIsRenewable] = useState(false);
  const [showPaymentResult, setShowPaymentResult] = useState(null);
  const navigation = useNavigation();

  const getMyProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/user/profile?populate=true`);
      setProfile(response.data);
      setLoading(false);
      console.log(response.data);
    } catch (error) {
      setError(true);
      setLoading(false);
    }
  };

  const getMembership = async () => {
    try {
      const response = await axios.get(`${API_URL}/membership-type?populate=true`);
      console.log(response.data);
      setMembership(response.data.data[0]);
      // setLoading(false);
    } catch (error) {
      console.log(error);
      setError(true);
      setLoading(false);
    }
  };

  const initiateBooking = async () => {
    try {
      const response = await axios.post(`${API_URL}/membership/initiate`);
      await handlePayment(response.data.amount,response.data.orderId,response.data.prefills)
    } catch (err) {
      notify(err.message);
    }
  }


  const handlePayment = async (amount,orderId,prefills) => {
    try {
      
      const options = {
        name: 'Coccarr',
        description: 'Cocarr Premium Membership',
        // image: 'https://your-app-logo.png',
        currency: 'INR',
        order_id: orderId,
        "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information, especially their phone number
          "name": prefills.name, //your customer's name
          "email": prefills.email, 
          "contact": prefills.contactNumber  //Provide the customer's phone number for better conversion rates 
      },
        key: 'rzp_test_Z3US7Xs7SFtOHg', // Replace with your Razorpay key
        amount: amount * 100, 
        theme: { color: '#EDBF31' }
      };

      const paymentData = await RazorpayCheckout.open(options);
      
      // Handle successful payment
      if (paymentData.razorpay_payment_id) {
        setShowPaymentResult({message:'',status:'pending',loading:true});
        
        const response = await axios.post(`${API_URL}/membership/confirm`,{paymentId:paymentData.razorpay_payment_id,orderId:paymentData.razorpay_order_id,signature:paymentData.razorpay_signature})
        setShowPaymentResult({message:'Your payment has been processed and your membership is now activated',status:'success',loading:false});
        getMyProfile();
        setTimeout(() => {
          setShowPaymentResult(null);
        }, 2000);

      }
    } catch (error) {
      setShowPaymentResult({message:'Your payment failed. Please try again.',status:'failed',loading:false});
      setTimeout(() => {
        setShowPaymentResult(null);
      }, 2000);
      if (error.code === 'PAYMENT_CANCELLED') {
        notify('Payment Cancelled');
      } else {
        notify('Payment Failed');
        console.error('Payment Error:', error);
      }
    }
  };

  useEffect(() => {
      getMembership();
    getMyProfile();
  }, []);
;

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle={showPaymentResult ? 'light-content' : 'dark-content'} backgroundColor={showPaymentResult ? '#000' : BRAND_COLOR}/>
      <View style={styles.headerContainer}>
      <TouchableHighlight underlayColor={BRAND_COLOR} style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color="#000" />
        </TouchableHighlight>
          {/* <CustomText fontType='primary' weight='Medium' style={{fontSize:14,color:'#000',textAlign:'center',letterSpacing:-0.05}}>Premium Membership</CustomText> */}
    </View>
      <View style={{ backgroundColor:BRAND_COLOR,paddingVertical:24,paddingHorizontal:16,}}>

        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',marginBottom:16,width:48,height:48,borderRadius:56,borderWidth:2,borderColor:'#000',padding:4,justifyContent:'center',alignItems:'center',marginHorizontal:'auto'}}>
            {/* <PremiumIcon/> */}
            <Icon name="ticket-outline" size={28} color="#000" />
        </View>
        {!profile.isPremium && <CustomText fontType='primary' weight='Medium' style={{color:'#000',fontSize:14,fontWeight:'500',textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:-0.05}}>Get exclusive discounts with premium membership at</CustomText>}

        {profile.isPremium ? <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:16,textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:0.05,textTransform:'uppercase'}}>Membership Active</CustomText> : <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:32,fontWeight:'500',textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:-0.05}}>{'\u20B9'}{membership.membershipOfferAmount ? membership.membershipOfferAmount : membership.membershipAmount}</CustomText>}

        {!profile.isPremium && membership.membershipOfferAmount && <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:20,fontWeight:'500',textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:-0.05,textDecorationLine:'line-through',opacity:0.5,marginTop:-10}}>{'\u20B9'}{membership.membershipAmount}</CustomText>}
        
        {profile.isPremium && <CustomText fontType='primary' weight='Medium' style={{color:'#000',fontSize:13,textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:-0.05,lineHeight:20}}>Your Premium Membership is active and will expire on {formatDate(profile.membership.endingTime,'long')}</CustomText>}

        <TouchableHighlight onPress={onPress} underlayColor='#2c2c2e' style={{backgroundColor:'#000',paddingVertical:12,paddingHorizontal:24,borderRadius:24,marginTop:12,marginHorizontal:'auto'}}>
          <CustomText fontType='primary' weight='Bold' style={{color:BRAND_COLOR,fontSize:12,textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',letterSpacing:-0.05,textTransform:'uppercase'}}>{!profile.isPremium ? 'Get Premium Membership' : profile.membership.isRenewable ? 'Renew Membership' : 'Book Ride Now'}</CustomText>
        </TouchableHighlight>
      </View>


      <TabViewInfo benefitItems={benefits}/>
      {showPaymentResult && <PaymentResultPopup response={showPaymentResult}/>}
    </View>
  );
}



const PaymentResultPopup = ({response}) => {
  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000',position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:1000}}>
      {!response.loading ? <View style={{alignItems:'center',justifyContent:'center'}}>
        <View style={{borderRadius:24,padding:12}}>
          <Icon name={response.status === 'success' ? "checkmark-circle" : "close-circle-outline"} size={80} color={response.status === 'success' ? BRAND_COLOR : response.status === 'failed' ? '#ff0000' : '#a3a3a3'} />
        </View>
        <CustomText fontType='primary' weight='Medium' style={{color:response.status === 'success' ? BRAND_COLOR : response.status === 'failed' ? '#ff0000' : '#a3a3a3',fontSize:16,textAlign:'center',maxWidth:'70%',marginHorizontal:'auto',marginTop:20}}>{response ? response.status === 'success' ? 'Payment Successful' : 'Payment Failed' : 'Payment Result'}</CustomText>
        <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3',fontSize:13,textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',marginTop:8}}>{response.message}</CustomText>
      </View> : <ActivityIndicator size="large" color={BRAND_COLOR} />}
    </View>
  )
}



const TabViewInfo = ({benefitItems}) => {

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'benefits', title: 'Benefits' },
    { key: 'payment', title: 'Membership History' },
  ]);

  const renderScene = SceneMap({
    benefits: ()=><Benefits benefitItems={benefitItems}/>,
    payment: ()=><Payment/>
  });

  const renderTabBar = (props) => {
    return (
      <TabBar
      {...props}
      style={{backgroundColor:'#000',paddingVertical:16,paddingHorizontal:16}}
      indicatorStyle={{backgroundColor:BRAND_COLOR,height:0}}
      labelStyle={{color:'#fff',fontSize:8,fontWeight:'500',textTransform:'uppercase',letterSpacing:.15,textTransform:'uppercase'}}
      activeColor='#fff'
      renderTabBarItem={props => {
        const active = props.navigationState.routes[props.navigationState.index].key === props.route.key ? true : false;
          return (
            <TouchableHighlight activeOpacity={0.8} onPress={() => setIndex(routes.findIndex(r => r.key === props.route.key))} style={{paddingVertical:8,paddingHorizontal:18,backgroundColor:!active ? '#1c1c1e' : '#EDBF313A',marginRight:12,borderRadius:24,marginLeft:props.route.key === 'overview' ? 16 : 0}}>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                  <Text style={{color:active ? BRAND_COLOR : '#757575',fontSize:10,fontWeight:'600',textTransform:'uppercase',letterSpacing:.15}}>{props.route.title}</Text>
              </View>
            </TouchableHighlight>
          )
        }}
        inactiveColor='#757575'
      />
    )
  }
  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      overdrag={true}
      style={{backgroundColor:'#000',flex:1}}
      
      renderTabBar={(props)=>renderTabBar(props)}
      // initialLayout={{ width: Dimensions.get('window').width }}
    />
  ) 
}

const Benefits = ({benefitItems}) => {


  return (
    <ScrollView style={{paddingHorizontal:16,paddingVertical:0}}>
      <View style={{flexDirection:'column',alignItems:'center',justifyContent:'space-between'}}>

        {benefitItems.map((benefit,index)=>(
          <View style={{flexDirection:'row',width:'100%',borderBottomWidth:1,borderBottomColor:'#151515',paddingVertical:16,paddingHorizontal:12}} key={index}>
            <View style={{width:'55%'}}>
              <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3',fontSize:13,fontWeight:'500',textAlign:'left',maxWidth:'75%',letterSpacing:-0.05}}>{benefit.title}</CustomText>
            </View>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',width:'22.5%'}}>
                {benefit.premium.value ? <CustomText fontType='primary' weight='SemiBold' style={{color:BRAND_COLOR,fontSize:13,fontWeight:'500',textAlign:'center',maxWidth:'75%',letterSpacing:-0.05}}>{benefit.premium.value}</CustomText> :  <Icon name={benefit.premium.isTicked ? "checkmark-circle" : "close-circle-outline"} size={24} color={benefit.premium.isTicked ? BRAND_COLOR : '#959595'} />}
            </View>
            <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',width:'22.5%'}}>
                <Icon name={benefit.nonPremium.isTicked ? "checkmark-circle" : "close-circle-outline"} size={24} color={benefit.nonPremium.isTicked ? BRAND_COLOR : '#959595'} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const Payment = () => {

  const [membershipHistory, setMembershipHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const getMembershipHistory = async () => {
    const response = await axios.get(`${API_URL}/membership/history`);
    setMembershipHistory(response.data);
  }

  useEffect(() => {
    getMembershipHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await getMembershipHistory();
    setRefreshing(false);
  }

  const renderItem = ({ item }) => {
    return (
      <View style={{borderBottomWidth:1,borderBottomColor:'#151515',paddingVertical:16,overflow:'hidden'}}>
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}>
          <View style={{flexDirection:'column',alignItems:'flex-start',justifyContent:'flex-start'}}>
            <CustomText fontType='primary' weight='Medium' style={{color:BRAND_COLOR,fontSize:13}}>Premium Membership</CustomText>
            <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3',fontSize:11}}>Valid From: { formatDate(item.startingTime)}</CustomText>
            <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3',fontSize:11}}>Valid To: { formatDate(item.endingTime)}</CustomText>
          </View>
          <View style={{flexDirection:'column',alignItems:'flex-end',justifyContent:'flex-end'}}>
            {/* <CustomText fontType='primary' weight='Medium' style={{color:'#a3a3a3',fontSize:11,textAlign:'right'}}>Pai</CustomText> */}
            <CustomText fontType='primary' weight='Medium' style={{color:BRAND_COLOR,fontSize:16,textAlign:'right'}}>{'\u20B9'}{item.amount}</CustomText>
          </View>
        </View>
      </View>
    )
  }
  return (
    <View style={{paddingHorizontal:16}}>
      <FlatList refreshControl={<RefreshControl progressBackgroundColor={BRAND_COLOR} tintColor='#000' refreshing={refreshing} onRefresh={onRefresh} />} data={membershipHistory} renderItem={renderItem} keyExtractor={(item,index)=>index.toString()}/>
    </View>
  )
}


const PremiumIcon = () => {

    return <Svg width="48" height="48" viewBox="0 0 14 14" fill="none">
    <G clip-path="url(#clip0_66_1293)">
    <Path d="M11.953 5.482C11.953 6.79641 11.4309 8.05699 10.5014 8.98642C9.57201 9.91585 8.31143 10.438 6.99702 10.438C5.6826 10.438 4.42202 9.91585 3.49259 8.98642C2.56316 8.05699 2.04102 6.79641 2.04102 5.482C2.04102 4.16759 2.56316 2.90701 3.49259 1.97758C4.42202 1.04815 5.6826 0.526001 6.99702 0.526001C8.31143 0.526001 9.57201 1.04815 10.5014 1.97758C11.4309 2.90701 11.953 4.16759 11.953 5.482Z" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
    <Path d="M2.704 7.913L0.5 11.731L2.881 11.093L3.52 13.474L5.432 10.162M11.296 7.913L13.5 11.731L11.118 11.093L10.48 13.474L8.568 10.162M7.2 2.791L7.883 4.165C7.89783 4.19991 7.92184 4.23015 7.95248 4.25251C7.98311 4.27487 8.01923 4.28852 8.057 4.292L9.574 4.522C9.61741 4.52755 9.65834 4.54537 9.69198 4.57337C9.72561 4.60137 9.75056 4.63838 9.7639 4.68007C9.77723 4.72175 9.7784 4.76637 9.76726 4.8087C9.75612 4.85102 9.73313 4.88929 9.701 4.919L8.58 5.983C8.56319 6.01473 8.5544 6.05009 8.5544 6.086C8.5544 6.12191 8.56319 6.15727 8.58 6.189L8.795 7.697C8.80433 7.7407 8.80073 7.78617 8.78463 7.82786C8.76854 7.86955 8.74065 7.90565 8.70437 7.93174C8.6681 7.95783 8.625 7.97279 8.58036 7.97479C8.53572 7.97679 8.49146 7.96575 8.453 7.943L7.103 7.229C7.06811 7.21327 7.03027 7.20513 6.992 7.20513C6.95373 7.20513 6.91589 7.21327 6.881 7.229L5.531 7.943C5.49257 7.96513 5.44856 7.97568 5.40428 7.97338C5.35999 7.97108 5.31732 7.95603 5.28139 7.93003C5.24546 7.90404 5.21781 7.86821 5.20178 7.82687C5.18574 7.78552 5.182 7.74042 5.191 7.697L5.445 6.189C5.45602 6.15405 5.45813 6.1169 5.45114 6.08092C5.44416 6.04495 5.4283 6.01129 5.405 5.983L4.286 4.91C4.25593 4.87993 4.23478 4.8421 4.22492 4.80073C4.21505 4.75936 4.21685 4.71606 4.23011 4.67565C4.24338 4.63524 4.26758 4.5993 4.30005 4.57182C4.33251 4.54435 4.37195 4.52641 4.414 4.52L5.93 4.3C5.96777 4.29652 6.00389 4.28287 6.03452 4.26051C6.06516 4.23815 6.08917 4.20791 6.104 4.173L6.787 2.799C6.80518 2.76 6.83394 2.72689 6.87 2.70342C6.90606 2.67994 6.94799 2.66706 6.99101 2.66623C7.03403 2.66539 7.07642 2.67664 7.11336 2.6987C7.15031 2.72076 7.18032 2.75274 7.2 2.791Z" stroke="black" stroke-linecap="round" stroke-linejoin="round"/>
    </G>
    <Defs>
    <ClipPath id="clip0_66_1293">
    <Rect width="14" height="14" fill="white"/>
    </ClipPath>
    </Defs>
    </Svg>
    
}

const renderItem = ({ item }) => {
  return (
    <View>
      <TouchableOpacity style={{ borderBottomWidth:1,borderBottomColor:'#151515', paddingVertical:16, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', paddingVertical: 16, paddingHorizontal: 12 }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '400' }}>{item.description}</Text>
            <Text style={{ color: '#a3a3a3', fontSize: 12, fontWeight: '400' }}>Code: {item.code}</Text>
            <Text style={{ color: '#a3a3a3', fontSize: 12, fontWeight: '400', marginTop: 4 }}>Valid Upto: { formatDate(item.valid_to)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: BRAND_COLOR
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
