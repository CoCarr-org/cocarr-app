import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator, Platform, TouchableOpacity, ScrollView, Linking, ToastAndroid, Alert, Dimensions, Switch } from 'react-native';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../../utils/constants';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { convertToUnixTimestamp, formatDate, notify } from '../../../utils/utils';
import ActionSheet from 'react-native-actions-sheet';
import RazorpayCheckout from 'react-native-razorpay';
import CustomText from '../../../components/CustomText';

export function CarsPaymentScreen({route}) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vehicleSummary, setVehicleSummary] = useState(null);
  const navigation = useNavigation();
  const {startDateTime,endDateTime} = useSelector(state => state.booking);
  const actionRef = useRef(null);
  const authInfo = useSelector(state => state.auth);
  const [deliveryType,setDeliveryType] = useState('self');
  const [exclusiveOffers,setExclusiveOffers] = useState([]);
  const [selectedOffer,setSelectedOffer] = useState(null);
  const [selectedOfferItem,setSelectedOfferItem] = useState(null);
  const [showPaymentResult,setShowPaymentResult] = useState(null);
  const [useWalletPoints,setUseWalletPoints] = useState(false);
  const [walletPoints,setWalletPoints] = useState(null);
  const [damageProtectionPlan,setDamageProtectionPlan] = useState('basicPlan');
  const cityInfo = useSelector(state => state.booking);

  useEffect(() => {
    fetchVehicle();
    getVehicleSummary();
    getExclusiveOffers()
    getWalletPoints()
  }, []);



  // const getExclusiveOffers = async () => {
  //   const response = await axios.get(`${API_URL}/offers?vehicleId=${vehicleId}`);
  //   console.log('offers',response.data)
  //   setExclusiveOffers(response.data);
  // }
  const getExclusiveOffers = async () => {
    try {
      const startTimeUnix = Math.floor(new Date(startDateTime).getTime() / 1000) 
        const endTimeUnix = Math.floor(new Date(endDateTime).getTime() / 1000);
        const response = await axios.get(`${API_URL}/offers/booking/${vehicleId}?startTime=${startTimeUnix}&endTime=${endTimeUnix}&viewAll=true`);
        // setLoading(false);
      setExclusiveOffers(response.data.appliedOffers);
    } catch (error) {
      notify(error.message);
    }
  }

  const getWalletPoints = async () => {
    try {
      const response = await axios.get(`${API_URL}/wallet/my-wallet`);
      console.log('wallet points',response.data)
      setWalletPoints(response.data);
      if(response.data.walletPoints > 0) {
        setUseWalletPoints(true);
      }
      else {
        setUseWalletPoints(false);
      }
    } catch (err) {
      console.log('error',err.message)
    }
  }


  const fetchVehicle = async () => {
    try {
      const startTime = Math.floor(new Date(startDateTime).getTime() / 1000) 
      const endTime = Math.floor(new Date(endDateTime).getTime() / 1000);
      const response = await axios.get(`${API_URL}/vehicle/${vehicleId}?startTime=${startTime}&endTime=${endTime}`);
      setVehicle(response.data);
      console.log('vehicle',response.data)
      setLoading(false);
    } catch (err) {
        console.log('error',err.message)
      setError('Error fetching vehicles');
      setLoading(false);
    }
  };

  const validateOffer = async (offerId) => {
    try {
      
      const startTime = Math.floor(new Date(startDateTime).getTime() / 1000) 
      const endTime = Math.floor(new Date(endDateTime).getTime() / 1000);
      const response = await axios.get(`${API_URL}/offers/validate/${offerId}?startTime=${startTime}&endTime=${endTime}&vehicleId=${vehicleId}`);
      setSelectedOffer(response.data);
      setSelectedOfferItem(exclusiveOffers.find(offer => offer.id === offerId));
      console.log('selectedOffer',response.data)
      return response.data;
    } catch (error) {
      console.log('axios token', error.response.config.headers.Authorization);
      console.log('error',error.message)
      setSelectedOffer(null);
    }
  }

  const getTotalAmount = () => {
    let amount = parseFloat(vehicleSummary?.rideAmount?.amount) + parseFloat(vehicleSummary?.convenienceFee?.amount) + parseFloat(vehicleSummary?.protectionPlans?.find(plan => plan.type === damageProtectionPlan)?.amount || 0) + (deliveryType === 'driver' ? parseFloat(vehicleSummary?.driverFee?.amount) : 0);
    if(useWalletPoints) {
      amount = amount - (walletPoints?.walletPoints > vehicleSummary?.maxWalletPoints ? vehicleSummary?.maxWalletPoints : walletPoints?.walletPoints);
    }
    return amount;
  }

  const getVehicleSummary = async () => {
    try {
      const startTime = Math.floor(new Date(startDateTime).getTime() / 1000) 
      const endTime = Math.floor(new Date(endDateTime).getTime() / 1000);
      const response = await axios.get(`${API_URL}/booking/summary?vehicleId=${vehicleId}&startTime=${startTime}&endTime=${endTime}`);
      setVehicleSummary(response.data);
    } catch (err) {
      console.log('error',err.message)
    }
  }


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#EDBF31" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const stripHtml = (html) => {
    return html.replace(/<[^>]*>?/g, '');
  }

  const initiateBooking = async () => {
    try {
      const startTime = new Date(startDateTime)
      const endTime = new Date(endDateTime);
      console.log('cityInfo',cityInfo)
      const response = await axios.post(`${API_URL}/booking/initiate`,{deliveryType:deliveryType,startTime:convertToUnixTimestamp(startTime),endTime:convertToUnixTimestamp(endTime),userId:authInfo.uid,vehicleId:vehicle.id,lng:cityInfo?.longitude,lat:cityInfo?.latitude,cityId:cityInfo?.selectedCity?.id,address:cityInfo?.selectedLocation?.name,protectionPlan:damageProtectionPlan},{headers:{Authorization: `${authInfo.token}`}});
      await handlePayment(response.data.amount,response.data.orderId,response.data.prefills)
    } catch (err) {
      console.log('error',err)
      notify(err.response?.data?.error?.message);
    }
  }


  const handlePayment = async (amount,orderId,prefills) => {
    try {
      
      const options = {
        name: 'Coccarr',
        description: 'Car Rental Payment',
        image: 'https://your-app-logo.png',
        currency: 'INR',
        order_id: orderId,
        "prefill": { //We recommend using the prefill parameter to auto-fill customer's contact information, especially their phone number
          "name": prefills.name, //your customer's name
          "email": prefills.email, 
          "contact": prefills.contactNumber  //Provide the customer's phone number for better conversion rates 
      },
        key: 'rzp_test_RSCYZcy6136B7q', // Replace with your Razorpay key
        amount: amount * 100, 
        theme: { color: '#EDBF31' }
      };

      const paymentData = await RazorpayCheckout.open(options);
      setShowPaymentResult({message:'',status:'pending',loading:true});
      
      // Handle successful payment
      if (paymentData.razorpay_payment_id) {
        // Make API call to your backend to verify payment
        const response = await axios.post(`${API_URL}/booking/confirm`,{paymentId:paymentData.razorpay_payment_id,orderId:paymentData.razorpay_order_id,signature:paymentData.razorpay_signature},{headers:{Authorization: `${authInfo.token}`}})

        
        setShowPaymentResult({message:'Your payment has been processed successfully.',status:'success',loading:false});

          setTimeout(() => {
            setShowPaymentResult(null);
            navigation.navigate('Rides');
          }, 2000);
        // }
      }
    } catch (error) {
      if (error.code === 'PAYMENT_CANCELLED') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment');
      } else {
        Alert.alert('Payment Failed', 'There was an error processing your payment');
        console.error('Payment Error:', error);
      }
    }
  };

  return (
    <View style={styles.container}>

      {/* Header (back + title) is the shared stack header now. */}

      <ScrollView style={{flex:1,}}>
        <View style={{flexDirection:'column',gap:12,paddingHorizontal:16,backgroundColor:'#101012',borderRadius:10,paddingVertical:12,marginVertical:8,marginHorizontal:16}}>
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false}>
          {
            vehicle.images.map((image,index)=>index < 4 ? <Image key={index} source={{uri:image.url}} style={{width:120,height:72,borderRadius:8,marginRight:8}}/> : null)
          }
        </ScrollView>
            <View style={{flexDirection:'column',borderTopWidth:1,borderColor:'#252525',paddingTop:12,marginTop:8}}>
                <Text style={{...styles.vehicleName,fontSize:14}}>{vehicle.brand.name} {vehicle.vehicleName}</Text>
                <Text style={{...styles.vehicleYear,fontSize:12}}>{vehicle.vehicleFuelType} · {vehicle.vehicleSeats} Seater · {vehicle.vehicleYear}</Text>
                <Text style={styles.headerPrimaryText}>{formatDate(startDateTime,'long')} - {formatDate(endDateTime,'long')}</Text>
            </View>
        </View>


      {/* <CarImageBlock vehicle={vehicle} /> */}



      <View style={{marginVertical:8,marginHorizontal:16,borderRadius:12,paddingVertical:16,paddingHorizontal:16,backgroundColor:'#101012'}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
        <Text style={styles.vehicleInfoBlockTitle}>Exclusive Offers</Text>
        <TouchableOpacity onPress={() => navigation.navigate('BookingOffers',{vehicleId:vehicle.id,startTime:startDateTime,endTime:endDateTime})}>
          <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
          <Text style={{color:'#a3a3a3',fontSize:11,fontWeight:'500'}}>View All</Text>
          <Icon name="chevron-forward-outline" size={13} color="#a3a3a3" />
          </View>
        </TouchableOpacity>
        </View>

      <View style={{flexDirection: 'row', borderRadius: 6, overflow: 'hidden'}}>

          <View >
            <ExclusiveOffers exclusiveOffers={exclusiveOffers} selectedOfferItem={selectedOfferItem} validateOffer={validateOffer} setSelectedOfferItem={setSelectedOfferItem} setSelectedOffer={setSelectedOffer} selectedOffer={selectedOffer} />
          </View>
      </View>


      </View>


      <View style={{marginVertical:8,marginHorizontal:16,borderRadius:12,paddingVertical:16,paddingHorizontal:16,backgroundColor:'#101012'}}>
                {/* <Text style={styles.sortTitle}>Wallet Points</Text> */}
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <View>
                  <Text style={{color:'#efefef', fontSize: 12, fontWeight: '500',paddingVertical:4}}>
                    {walletPoints?.walletPoints >= vehicleSummary?.maxWalletPoints 
                      ? `Use ${vehicleSummary?.maxWalletPoints || 0} Points from Wallet`
                      : `Use ${walletPoints?.walletPoints || 0} Points from Wallet`}
                  </Text>
                  <Text style={{color:'#959595',fontSize:12}}>
                    Remaining Points: {!useWalletPoints 
                      ? walletPoints?.walletPoints 
                      : walletPoints?.walletPoints - (walletPoints?.walletPoints >= vehicleSummary?.maxWalletPoints ? vehicleSummary?.maxWalletPoints : walletPoints?.walletPoints)}
                  </Text>
                  </View>
                  <Switch value={useWalletPoints} onValueChange={setUseWalletPoints} thumbColor={useWalletPoints ? '#EDBF31' : '#252525'} trackColor={{true:'#EDBF3135',false:'#252525'}}/>
                </View>
              </View>
    
    
             <View style={{marginVertical:8,marginHorizontal:16,borderRadius:12,paddingVertical:16,paddingHorizontal:16,backgroundColor:'#101012',opacity:vehicle.vehiclePreference?.deliverAvailable ? 1 : 0.35}}>
                {/* <Text style={styles.sortTitle}>Wallet Points</Text> */}
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <View>
                  <Text style={{color:'#efefef', fontSize: 12, fontWeight: '500',paddingVertical:4}}>Doorstep Delivery {vehicle.vehiclePreference?.deliverAvailable ? '' : '(Not Available)'}</Text>
                  <Text style={{color:'#959595',fontSize:12}}>Car will be delivered to your doorstep.</Text>
                  </View>
                  <Switch disabled={!vehicle.vehiclePreference?.deliverAvailable} value={deliveryType === 'driver'} onValueChange={(value)=>setDeliveryType(value === true ? 'driver' : 'self')} thumbColor={deliveryType === 'driver' ? '#EDBF31' : '#252525'} trackColor={{true:'#EDBF3135',false:'#252525'}}/>
                </View>
              </View>
            
            
             <View style={{marginVertical:8,marginHorizontal:16,borderRadius:12,backgroundColor:'#101012',paddingVertical:16,paddingHorizontal:16}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:'#10101200',paddingVertical:4}}>
                <Text style={styles.sortTitle}>Damage Protection Plan</Text>
              </View>
                {
                  vehicleSummary?.protectionPlans && vehicleSummary?.protectionPlans.map((plan,index)=>plan ? <TouchableOpacity 
                  onPress={() => setDamageProtectionPlan(plan.type)}
                  style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:index === vehicleSummary?.protectionPlans?.length - 1 ? 0 : 1,borderColor:'#252525',flex:1}}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                    <View style={{flexDirection:'row',justifyContent:'center',backgroundColor:'#101012',padding:4,borderRadius:12,marginRight:8}}>
                      <Icon name={`${plan.type === 'basicPlan' ? 'star-outline' : plan.type === 'silverPlan' ? 'star' : 'star'}`} size={24} color={plan.type === 'basicPlan' ? '#C0C0C0' : plan.type === 'silverPlan' ? '#C0C0C0' : '#FFD700'} />
                    </View>
                    <View style={{flexDirection:'column',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <Text style={{color:'#efefef', fontSize: 13, fontWeight: '500',paddingVertical:2}}>{plan.name}</Text>
                      <Text style={{color:'#959595',fontSize:11}}>Pay Max of Rs.{plan.accidentAmount} for any damage.</Text>
                    </View>
                    
                  </View>
                  <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                    <Text style={{color:'#efefef', fontSize: 13, fontWeight: '500',paddingVertical:4,marginRight:8,textAlign:'left'}}>Rs.{plan.amount}</Text>
                  <View style={{height: 18, width: 18, borderRadius: 10, borderWidth: 2, borderColor: damageProtectionPlan === plan.type ? '#EDBF31' : '#252525', justifyContent: 'center', alignItems: 'center'}}>
                    {damageProtectionPlan === plan.type && <View style={{height: 10, width: 10, borderRadius: 5, backgroundColor: '#EDBF31'}} />}
                  </View>
                  </View>
                </TouchableOpacity> : null)
                }
              </View>



      <View style={{marginVertical:8,marginHorizontal:16,borderRadius:12,paddingVertical:16,paddingHorizontal:16,backgroundColor:'#101012'}}>
                <Text style={styles.sortTitle}>Price Breakup</Text>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={styles.summaryText}>Base Amount</Text>
                  <Text style={styles.summaryText}>Rs.{vehicleSummary?.rideAmount?.amount}</Text>
                </View>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={styles.summaryText}>Protection Plan</Text>
                  <Text style={styles.summaryText}>Rs.{vehicleSummary?.protectionPlans?.find(plan => plan.type === damageProtectionPlan)?.amount || 0}</Text>
                </View>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={styles.summaryText}>Convenience Fee</Text>
                  <Text style={styles.summaryText}>Rs.{vehicleSummary?.convenienceFee?.amount}</Text>
                </View>
                { deliveryType !== 'self' ? <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={styles.summaryText}>Delivery Fee</Text>
                  <Text style={styles.summaryText}>Rs.{vehicleSummary?.driverFee?.amount}</Text>
                </View> : null}
                {selectedOffer ? <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={styles.summaryText}>Offer Discount</Text>
                  <Text style={{...styles.summaryText,color:BRAND_COLOR}}>-Rs.{selectedOffer?.offerAmount}</Text>
                </View> : null}
              </View>
      
      
      

      

      </ScrollView>
              <View style={{flexDirection:'row',alignItems:'center',paddingTop:8,paddingBottom:8,width:'100%',paddingHorizontal:16}}>
                <TouchableOpacity 
                  style={{...styles.paymentButton,backgroundColor:vehicle.isAvailable ? '#EDBF31' : '#252525'}} 
                  onPress={initiateBooking}
                  disabled={!vehicle.isAvailable}
                >
                  <Text style={{...styles.paymentButtonText,color:vehicle.isAvailable ? '#000' : '#757575'}}>
                    {vehicle.isAvailable ? useWalletPoints ? `Pay Rs.${selectedOffer ? getTotalAmount() - parseFloat(selectedOffer.offerAmount) : getTotalAmount()}` : `Pay Rs.${selectedOffer ? getTotalAmount() - parseFloat(selectedOffer.offerAmount) : getTotalAmount()}` : 'Sold Out'}
                  </Text>
                </TouchableOpacity>
                </View>
      {/* <View style={{backgroundColor:'#000',borderTopWidth:1,borderColor:'#1c1c1e',flexDirection:'column',justifyContent:'space-between',alignItems:'center'}}> */}
        {/* {
          vehicleSummary ?  <View style={{flexDirection:'row',backgroundColor:'#EDBF3155',paddingVertical:6,paddingHorizontal:16,borderTopLeftRadius:4,borderTopRightRadius:4,width:'100%'}}>
          <TouchableOpacity onPress={() => setUseWalletPoints(!useWalletPoints)} style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:'100%'}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',height:24,width:24,backgroundColor:'#252525',borderRadius:12,padding:2}}>
              <View style={{height:14,width:14,backgroundColor:useWalletPoints ? '#EDBF31' : '#252525',borderRadius:12}}>
                
              </View>
            </View>
          <Text style={{color:'#e3e3e3',fontSize:12,fontWeight:'500',marginLeft:8}}>Use Wallet (320 Points)</Text>
            </View>
          <Text style={{color:'#efefef',fontSize:12,fontWeight:'500'}}>(-200 Points)</Text>
          </TouchableOpacity>
        </View> : null
        } */}
        {/* <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingTop:12,width:'100%',paddingHorizontal:16}}>
        {vehicleSummary ? <View style={{flexDirection:'column',justifyContent:'center'}}>
       
        <Text style={{color:'#efefef',fontSize:15,fontWeight:'500'}}>{vehicle.isAvailable ? `Rs.${selectedOffer ? getTotalAmount() - parseFloat(selectedOffer.offerAmount) : getTotalAmount()}` : 'Sold Out'}</Text>
        {vehicle.isAvailable ? <TouchableOpacity onPress={() => actionRef.current.show()}>
        <Text style={styles.priceButtonText}>Price Breakup</Text>
        </TouchableOpacity> : null}
        </View> : <ActivityIndicator color="#EDBF31" size="small"/>}
        
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>

          <TouchableOpacity 
            style={{...styles.paymentButton,backgroundColor:vehicle.isAvailable ? '#EDBF31' : '#252525'}} 
            onPress={initiateBooking}
            disabled={!vehicle.isAvailable}
          >
            <Text style={{...styles.paymentButtonText,color:vehicle.isAvailable ? '#000' : '#757575'}}>
              {vehicle.isAvailable ? 'Proceed to Payment' : 'Sold Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </View> */}
      {/* </View> */}
          {showPaymentResult ? <PaymentResultPopup response={showPaymentResult} /> : null}
    </View>
  );
}

const ExclusiveOffers = ({ exclusiveOffers, selectedOfferItem, validateOffer,setSelectedOfferItem,setSelectedOffer,selectedOffer }) => {
  let offersToRender = exclusiveOffers.slice(0, 3);

  if (selectedOfferItem) {
    const selectedIndex = exclusiveOffers.findIndex(offer => offer.id === selectedOfferItem.id);
    if (selectedIndex >= 3) {
      offersToRender = [exclusiveOffers[selectedIndex], ...exclusiveOffers.slice(selectedIndex + 1, selectedIndex + 3)];
    }
  }

  return offersToRender.map((offer, index) => (
    <View key={index} style={{flexDirection:'row',width:'100%', paddingVertical: 12, justifyContent:'space-between',alignItems:'center',borderBottomWidth:offer.index === offersToRender.length - 1 ? 1 : 0,borderColor:'#252525',paddingBottom:offer.index === offersToRender.length - 1 ? 12 : 0}}>
      <View style={{flexDirection:'column',justifyContent:'space-between',alignItems:'flex-start'}}>
        <Text style={{color:'#fff', fontSize: 13, fontWeight: '600',textTransform:'uppercase'}}>{offer.code}</Text>
        <Text style={{color:'#a3a3a3', fontSize: 11, fontWeight: '400', marginBottom: 4}}>{offer.description}</Text>
      </View>
      {!selectedOfferItem || selectedOfferItem.id !== offer.id ? <TouchableOpacity onPress={() => validateOffer(offer.id)}>
        <View style={{backgroundColor:'#EDBF3125',padding:8,paddingHorizontal:10,borderRadius:4,flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
          <Text style={{color:'#EDBF31A5', fontSize: 10, fontWeight: '600',textTransform:'uppercase'}}>Apply</Text>
          <Icon name="chevron-forward-outline" size={13} color={BRAND_COLOR} />
        </View>
      </TouchableOpacity> : <TouchableOpacity onPress={() => {setSelectedOffer(null);setSelectedOfferItem(null);}}>
        <View style={{backgroundColor:'#EDBF3125',padding:8,paddingHorizontal:10,borderRadius:4,flexDirection:'row',justifyContent:'center',alignItems:'center'}}>
          <Text style={{color:'#EDBF31A5', fontSize: 10, fontWeight: '600',textTransform:'uppercase'}}>Saved Rs.{selectedOffer?.offerAmount}</Text>
          <Icon name="close-outline" size={13} color={BRAND_COLOR} />
        </View>
      </TouchableOpacity> }
    </View>
  ));
};


const PaymentResultPopup = ({response}) => {
  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000',position:'absolute',top:0,left:0,right:0,bottom:0,zIndex:1000}}>
      {!response.loading ? <View style={{alignItems:'center',justifyContent:'center'}}>
        <View style={{borderRadius:24,padding:12}}>
          <Icon name={response.status === 'success' ? "checkmark-circle" : "close-circle-outline"} size={80} color={response.status === 'success' ? BRAND_COLOR : response.status === 'failed' ? '#ff0000' : '#a3a3a3'} />
        </View>
        <CustomText fontType='primary' weight='Medium' style={{color:response.status === 'success' ? BRAND_COLOR : response.status === 'failed' ? '#ff0000' : '#a3a3a3',fontSize:16,textAlign:'center',maxWidth:'70%',marginHorizontal:'auto',marginTop:20}}>{response ? response.status === 'success' ? 'Payment Successful' : 'Payment Failed' : 'Payment Result'}</CustomText>
        <CustomText fontType='primary' numberOfLines={2} weight='Medium' style={{color:'#a3a3a3',fontSize:13,textAlign:'center',maxWidth:'75%',marginHorizontal:'auto',marginTop:8}}>{response.message}</CustomText>
      </View> : <ActivityIndicator size="large" color={BRAND_COLOR} />}
    </View>
  )
}



const FilterModal = ({actionRef,vehicleSummary,selectedOffer,deliveryType}) => {
  return (
    <View>
      <ActionSheet ref={actionRef} containerStyle={{backgroundColor:'#1C1C1E'}} overlayColor='#000' defaultOverlayOpacity={0.85}>
              <View style={{paddingVertical:24,paddingHorizontal:24}}>
                <Text style={styles.sortTitle}>Price Breakup</Text>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={styles.summaryText}>Base Amount</Text>
                  <Text style={styles.summaryText}>Rs.{vehicleSummary?.rideAmount?.amount}</Text>
                </View>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={styles.summaryText}>Refundable Deposit</Text>
                  <Text style={styles.summaryText}>Rs.{vehicleSummary?.deposit?.amount}</Text>
                </View>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={styles.summaryText}>Convenience Fee</Text>
                  <Text style={styles.summaryText}>Rs.{vehicleSummary?.convenienceFee?.amount}</Text>
                </View>
                { deliveryType === 'self' ? <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={styles.summaryText}>Delivery Fee</Text>
                  <Text style={styles.summaryText}>Rs.{vehicleSummary?.driverFee?.amount}</Text>
                </View> : null}
                {selectedOffer ? <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={styles.summaryText}>Offer Discount</Text>
                  <Text style={{...styles.summaryText,color:'#00ff00'}}>-Rs.{selectedOffer?.offerAmount}</Text>
                </View> : null}
              </View>
            </ActionSheet>
    </View>
  )
}


const HeaderBlock = ({vehicle,navigation,startDateTime,endDateTime}) => {
  return (
    <View style={styles.headerBlock}>
      <View style={styles.headerBlockLeft}>
          <TouchableOpacity style={{padding:4,paddingLeft:0}} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color="#a3a3a3" />
        </TouchableOpacity>
        <View style={styles.headerBlockContent}>
          <Text style={styles.vehicleName}>Booking Summary</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent:'flex-start',
    backgroundColor: '#050505',
    paddingTop: 24,
    
  },
  headerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom:8,
  },
  headerBlockLeft: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  headerPrimaryText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#a3a3a3',
  },
  listContainer: {
    // backgroundColor:'#1C1C1E',
    paddingHorizontal:16,
    paddingVertical:8,
  },
  vehicleItem: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingVertical:8,
    paddingHorizontal:8,
    overflow: 'hidden',
  },
  vehicleImage: {
    borderRadius:6,
    width: 72,
    height:54,
  },
  vehicleInfo: {
    // flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    // justifyContent: 'center',
  },
  vehicleInfoBlock: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  vehicleInfoBlockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#454545',
    textTransform:'uppercase',
    marginBottom: 6,
  },
  vehicleInfoBlockText: {
    fontSize: 13,
    color: '#c3c3c3',
  },
  vehicleSecBlock: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: '#252525',
  },
  blockSecText: {
    fontSize: 12,
    color: '#a3a3a3',
    lineHeight: 18,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a3a3a3',
    // marginBottom: 2,
  },
  vehicleYear: {
    fontSize: 13,
    color: '#a3a3a3',
    textTransform:'capitalize',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
  },
  priceButtonText: {
    color: '#EDBF31',
    fontSize: 12,
    fontWeight: '500',
  },
  sortTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#656565',
    textTransform:'uppercase',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 13,
    paddingVertical:6,
    color: '#e3e3e3',
  },
  paymentButton: {
    backgroundColor: '#EDBF31',
    padding: 20,
    paddingVertical:12,
    borderRadius: 5,
    alignItems: 'center',
    width:'100%',
    // marginTop: 20,
  },
  paymentButtonText: {
    color: '#000',
    fontSize: 14,
    textTransform:'uppercase',
    fontWeight: '700',
  },
});
