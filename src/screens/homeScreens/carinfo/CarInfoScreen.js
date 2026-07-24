import React, { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator, Platform, TouchableOpacity, ScrollView, Linking, ToastAndroid, Alert, Dimensions } from 'react-native';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../../utils/constants';
import { Link, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSelector } from 'react-redux';
import { convertToUnixTimestamp, formatDate, notify } from '../../../utils/utils';
import ActionSheet from 'react-native-actions-sheet';
import RazorpayCheckout from 'react-native-razorpay';
import CustomText from '../../../components/CustomText';

export function CarsInfoScreen({route}) {
  const insets = useSafeAreaInsets();
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
  const [termsAndConditions,setTermsAndConditions] = useState(null);

  useEffect(() => {
    fetchVehicle();
  }, []);
  
  useEffect(() => {
    getVehicleSummary();
    getExclusiveOffers()
  }, [startDateTime,endDateTime]);


  const getExclusiveOffers = async () => {
    const response = await axios.get(`${API_URL}/offers?vehicleId=${vehicleId}`);
    console.log('offers',response.data)
    setExclusiveOffers(response.data);
  }

  const getWalletPoints = async () => {
    try {
      const response = await axios.get(`${API_URL}/wallet/my-wallet`);
      console.log('wallet points',response.data)
      setWalletPoints(response.data);
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
    let amount = parseFloat(vehicleSummary?.rideAmount?.amount) + parseFloat(vehicleSummary?.convenienceFee?.amount) + (deliveryType === 'driver' ? parseFloat(vehicleSummary?.driverFee?.amount) : 0);
    if(useWalletPoints) {
      amount = amount - 200;
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
      const response = await axios.post(`${API_URL}/booking/initiate`,{deliveryType:deliveryType,startTime:convertToUnixTimestamp(startTime),endTime:convertToUnixTimestamp(endTime),userId:authInfo.uid,vehicleId:vehicle.id},{headers:{Authorization: `${authInfo.token}`}});
      await handlePayment(response.data.amount,response.data.orderId,response.data.prefills)
    } catch (err) {
      notify(err.message);
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
        key: 'rzp_test_Z3US7Xs7SFtOHg', // Replace with your Razorpay key
        amount: amount * 100, 
        theme: { color: '#EDBF31' }
      };

      const paymentData = await RazorpayCheckout.open(options);
      setShowPaymentResult({message:'',status:'pending',loading:true});
      
      // Handle successful payment
      if (paymentData.razorpay_payment_id) {
        // Make API call to your backend to verify payment
        const response = await axios.post(`${API_URL}/booking/confirm`,{paymentId:paymentData.razorpay_payment_id,orderId:paymentData.razorpay_order_id,signature:paymentData.razorpay_signature},{headers:{Authorization: `${authInfo.token}`}})

        
        setShowPaymentResult({message:'Your payment has been processed and your ride is confirmed',status:'success',loading:false});

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

  const isDeliveryAvailable = vehicle?.isDeliveryAvailable ?? vehicle?.vehiclePreference?.deliverAvailable ?? false;

  const pickupLat = vehicle?.pickupPoint?.lat ? parseFloat(vehicle.pickupPoint.lat) : null;
  const pickupLng = vehicle?.pickupPoint?.long ? parseFloat(vehicle.pickupPoint.long) : null;
  const openPickupInMaps = () => {
    if (pickupLat == null || pickupLng == null) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${pickupLat},${pickupLng}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <HeaderBlock vehicle={vehicle} navigation={navigation} startDateTime={startDateTime} endDateTime={endDateTime} />

      <ScrollView style={{flex:1,paddingTop:24}}>
      <View style={styles.vehicleInfo}>

        <Text style={styles.vehicleName}>{vehicle.brand.name} {vehicle.vehicleName}</Text>
        <Text style={styles.vehicleYear}>{vehicle.vehicleFuelType} · {vehicle.vehicleSeats} Seater · {vehicle.vehicleYear}</Text>
      </View>


      <CarImageBlock vehicle={vehicle} />


      <View style={styles.vehicleInfoBlock}>
        <Text style={styles.vehicleInfoBlockTitle}>Delivery Option</Text>
        <View style={{flexDirection:'row',gap:12,marginTop:10}}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDeliveryType('self')}
            style={{flex:1,paddingVertical:14,borderRadius:8,borderWidth:1,alignItems:'center',borderColor: deliveryType==='self' ? BRAND_COLOR : '#252525', backgroundColor: deliveryType==='self' ? '#EDBF3113' : '#1c1c1e'}}
          >
            <Text style={{color: deliveryType==='self' ? BRAND_COLOR : '#fff', fontWeight:'600', fontSize:13}}>Self Pickup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!isDeliveryAvailable}
            onPress={() => isDeliveryAvailable && setDeliveryType('driver')}
            style={{flex:1,paddingVertical:14,borderRadius:8,borderWidth:1,alignItems:'center',opacity: isDeliveryAvailable ? 1 : 0.45, borderColor: deliveryType==='driver' ? BRAND_COLOR : '#252525', backgroundColor: deliveryType==='driver' ? '#EDBF3113' : '#1c1c1e'}}
          >
            <Text style={{color: deliveryType==='driver' ? BRAND_COLOR : '#fff', fontWeight:'600', fontSize:13}}>
              {isDeliveryAvailable ? 'Doorstep Delivery' : 'Delivery Unavailable'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.vehicleInfoBlock}>
        <Text style={styles.vehicleInfoBlockTitle}>About the Car</Text>
        <Text style={styles.vehicleInfoBlockText}>{stripHtml(vehicle.description)}</Text>
      </View>
      
      <View style={{...styles.vehicleInfoBlock,borderTopWidth:1,borderColor:'#252525'}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
          <Text style={styles.vehicleInfoBlockTitle}>Pickup and Dropoff</Text>
          <TouchableOpacity onPress={openPickupInMaps}>
            <Text style={{...styles.vehicleInfoBlockText,color:BRAND_COLOR,textDecorationLine:'underline'}}>Open in maps</Text>
          </TouchableOpacity>
        </View>
        {pickupLat != null && pickupLng != null ? (
          <TouchableOpacity activeOpacity={0.9} onPress={openPickupInMaps} style={{marginTop:12,borderRadius:10,overflow:'hidden',height:160}}>
            <MapView
              style={{flex:1}}
              pointerEvents="none"
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={{ latitude: pickupLat, longitude: pickupLng, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
            >
              <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }} />
            </MapView>
          </TouchableOpacity>
        ) : (
          <Image source={require('../../../images/map-bg.jpg')} style={{width:'100%',height:120,borderRadius:10,marginTop:12,opacity:0.4}}/>
        )}
      </View>
      
      
      <View style={styles.vehicleSecBlock}>
        <Text style={styles.vehicleInfoBlockTitle}>Cancellation Policy</Text>
        <Text style={styles.blockSecText}>Cancellation charges will be deducted from the security deposit as per the cancellation policy of the owner.</Text>
      </View>

      <View style={styles.vehicleSecBlock}>
        <Text style={styles.vehicleInfoBlockTitle}>Terms and Conditions</Text>
        <View>
          <TouchableOpacity 
            style={{
              flexDirection: 'row',
              alignItems: 'center', 
              marginBottom: 8,
            }}
            activeOpacity={0.7}
            onPress={() => setTermsAndConditions(!termsAndConditions)}
          >
            <View style={{
              width: 18,
              height: 18,
              borderRadius: 2,
              borderWidth: 1,
              borderColor: termsAndConditions ? BRAND_COLOR : '#757575',
              backgroundColor: termsAndConditions ? BRAND_COLOR : 'transparent',
              marginRight: 8,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              {termsAndConditions && (
                <Icon name="checkmark" size={14} color="#000" />
              )}
            </View>
            <CustomText fontType='primary' weight='Medium' numberOfLines={2} style={[
              styles.blockSecText
            ]}>I hereby agree to the terms and conditions of the Lease Agreement with Host</CustomText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{
              flexDirection: 'row',
              alignItems: 'center', 
              marginBottom: 8,
            }}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('TermsAndConditions')}
          >
          <CustomText fontType='primary' weight='Medium' style={[styles.blockSecText,{color:'#EDBF31',textDecorationLine:'underline',marginLeft:24}]}>Read Terms and Conditions</CustomText>

          </TouchableOpacity>
        </View>

{/* </Text> */}
      </View>
      </ScrollView>
      <View style={{backgroundColor:'#000',borderTopWidth:1,borderColor:'#1c1c1e',flexDirection:'column',justifyContent:'space-between',alignItems:'center'}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingTop:12,width:'100%',paddingHorizontal:16}}>
        {vehicleSummary ? <View style={{flexDirection:'column',justifyContent:'center'}}>
       
        <Text style={{color:'#efefef',fontSize:15,fontWeight:'500'}}>{vehicle.isAvailable ? `Rs.${selectedOffer ? getTotalAmount() - parseFloat(selectedOffer.offerAmount) : getTotalAmount()}` : 'Sold Out'}</Text>
        {vehicle.isAvailable ? <TouchableOpacity activeOpacity={0.7} onPress={() => actionRef.current && actionRef.current.show()}>
        <Text style={{...styles.priceButtonText, color:'#EDBF31', textDecorationLine:'underline'}}>View price breakup</Text>
        </TouchableOpacity> : null}
        </View> : <ActivityIndicator color="#EDBF31" size="small"/>}
        
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>

          <TouchableOpacity 
            style={{...styles.paymentButton,backgroundColor:vehicle.isAvailable && termsAndConditions ? '#EDBF31' : '#252525'}} 
            onPress={()=>navigation.navigate('CarPayment',{vehicleId:vehicleId,startDateTime:startDateTime,endDateTime:endDateTime})}
            disabled={!vehicle.isAvailable || !termsAndConditions}
          >
            <Text style={{...styles.paymentButtonText,color:vehicle.isAvailable ? '#000' : '#757575'}}>
              {vehicle.isAvailable ? 'Proceed to Booking' : 'Sold Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
          <FilterModal actionRef={actionRef} vehicleSummary={vehicleSummary} selectedOffer={selectedOffer} deliveryType={deliveryType} vehicle={vehicle} />
          {showPaymentResult ? <PaymentResultPopup response={showPaymentResult} /> : null}
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



const FilterModal = ({actionRef,vehicleSummary,selectedOffer,deliveryType,vehicle}) => {
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
                  <Text style={styles.summaryText}>Convenience Fee</Text>
                  <Text style={styles.summaryText}>Rs.{vehicleSummary?.convenienceFee?.amount}</Text>
                </View>
                { deliveryType === 'driver' ? <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={styles.summaryText}>Delivery Fee</Text>
                  <Text style={styles.summaryText}>Rs.{vehicleSummary?.driverFee?.amount}</Text>
                </View> : null}
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                  <Text style={styles.summaryText}>Refundable Deposit</Text>
                  <Text style={styles.summaryText}>Rs.{vehicle?.deposit ?? vehicleSummary?.deposit?.amount ?? '-'}</Text>
                </View>
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
        <TouchableOpacity onPress={() => navigation.navigate('DatePicker')} style={styles.headerBlockContent}>
          <Text style={styles.blockSecText}>{vehicle.brand?.name} {vehicle.vehicleName}</Text>
          <Text style={styles.headerPrimaryText}>{formatDate(startDateTime,'long')} - {formatDate(endDateTime,'long')}</Text>
        </TouchableOpacity>
      </View>
        <TouchableOpacity style={{padding:4}}>
          <Icon name="share-outline" size={20} color="#a3a3a3" />
        </TouchableOpacity>
    </View>
  )
}

const CarImageBlock = ({vehicle}) => {
  return (
    <View style={styles.listContainer}>
        
    <View style={{flexDirection: 'row', gap: 8, height: 140}}>
      {/* Left large image */}
      <View style={{flex: 1}}>
        {vehicle.images && vehicle.images[0] && (
          <Image 
            source={{uri: vehicle.images[0].url}}
            style={{
              flex: 1,
              borderRadius: 12,
              backgroundColor: '#1C1C1E'
            }}
            resizeMode="cover"
          />
        )}
      </View>

      {/* Right 2x2 grid */}
      <View style={{flex: 1, gap: 8}}>
        <View style={{flex: 1, flexDirection: 'row', gap: 8}}>
          {/* Top row */}
          <View style={{flex: 1}}>
            {vehicle.images && vehicle.images[1] && (
              <View style={{flex:1,borderRadius:6,backgroundColor:'#1C1C1E'}}>
              <Image
                source={{uri: vehicle.images[1].url}}
                style={{
                  flex: 1,
                  borderRadius: 6,
                  backgroundColor: '#1C1C1E'
                }}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>
          <View style={{flex: 1}}>
            {vehicle.images && vehicle.images[2] && (
              <Image
                source={{uri: vehicle.images[2].url}}
                style={{
                  flex: 1,
                  borderRadius: 6,
                  backgroundColor: '#1C1C1E'
                }}
                resizeMode="cover"
              />
            )}
          </View>
        </View>
        
        <View style={{flex: 1, flexDirection: 'row', gap: 8}}>
          {/* Bottom row */}
          <View style={{flex: 1}}>
            {vehicle.images && vehicle.images[3] && (
              <Image
                source={{uri: vehicle.images[3].url}}
                style={{
                  flex: 1,
                  borderRadius: 6,
                  backgroundColor: '#1C1C1E'
                }}
                resizeMode="cover"
              />
            )}
          </View>
          <View style={{flex: 1}}>
            {vehicle.images && vehicle.images[4] && (
              <TouchableOpacity 
                style={{
                  flex: 1,
                  borderRadius: 6,
                  backgroundColor: '#1C1C1E',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{color: '#a3a3a3', fontSize: 12, fontWeight: '500'}}>
                  +{vehicle.images.length - 4} more
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
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
  },
  headerBlockLeft: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  headerPrimaryText: {
    fontSize: 12,
    fontWeight: '500',
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
    borderRadius:12,
    width: 320,
    height: 180,
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
    paddingBottom:32,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#efefef',
    marginBottom: 2,
  },
  vehicleYear: {
    fontSize: 13,
    color: '#a3a3a3',
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
    color: '#a3a3a3',
    fontSize: 11,
    fontWeight: '400',
  },
  sortTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#656565',
    textTransform:'uppercase',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    paddingVertical:12,
    color: '#efefef',
  },
  paymentButton: {
    backgroundColor: '#EDBF31',
    padding: 20,
    paddingVertical:16,
    borderRadius: 24,
    alignItems: 'center',
    // marginTop: 20,
  },
  paymentButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
  },
});
