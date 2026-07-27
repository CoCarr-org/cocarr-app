import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, FlatList, Image, TextInput, Alert, ActivityIndicator, ToastAndroid, PermissionsAndroid } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';
import CustomText from '../../components/CustomText';
import { useNavigation } from '@react-navigation/native';
import CenterHeader from '../../components/CenterHeader';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { formatDate, formatDateOnly, formatTime, UnauthAxios, notify } from '../../utils/utils';
import { DateTimePickerModal } from '../../components/host/DateTimePickerModal';
import OtpInput from '../../components/OtpInput';

export function StartBookingScreen({route}) {
  const navigation = useNavigation();
  const {bookingId} = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [booking, setBooking] = useState({});
  const inputRef = useRef(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [data, setData] = useState({
    startDateTime: new Date().toISOString(),
    startKms: '',
    startOtp: '',
    // startFuel: '',
    images: {
      front: null,
      back: null,
      driverSide: null,
      passengerSide: null,
      userWithCar: null,
      fuelOdometer: null
    }
  });
  const dispatch = useDispatch();
  const actionSheetRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
        try {
            const response = await axios.get(`${API_URL}/booking/${bookingId}`);
            console.log('response',response.data)
            setBooking(response.data);
        } catch (error) {
            console.error('Error fetching booking data:', error.message);
            notify('Error');
        }
    }
    fetchData();
  }, [bookingId]);

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "App needs camera permission to take pictures",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel", 
          buttonPositive: "OK"
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      notify('Camera Permission Denied')
      return false;
    }
  };

  const selectImage = async(type) => {

    const hasPermission = await requestCameraPermission();
      
      if (!hasPermission) {
        notify('Camera permission denied');
        return;
      }

    launchCamera({ 
      mediaType: 'photo',
      quality:0.5,
      cameraType: 'back'
    }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        console.log('Camera Error: ', response.errorMessage); 
      } else {
        setData({
          ...data,
          images: {
            ...data.images,
            [type]: response.assets[0]
          }
        });
      }
    });
  };

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      const uploadPromises = Object.entries(data.images).map(async ([type, image]) => {
        if (!image) return null;

        let urlRes = await axios.get(`${API_URL}/image/url`, {
          params: { fileName: image.fileName, fileType: image.type, folder: 'ride' }
        });

        const formData = new FormData();
        Object.entries(urlRes.data.fields).forEach(([field, value]) => {
          formData.append(field, value);
        });
        formData.append('acl', 'public-read');
        formData.append('file', {
          uri: image.uri,
          type: image.type,
          name: image.fileName,
        });

        let res = await UnauthAxios().post(urlRes.data.url, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        return {
          type,
          // Bucket URL has no trailing slash and the key is bare, so the old
          // `url + key` produced a malformed/inaccessible link (same bug
          // already fixed on web's upload helper) — use the API image proxy.
          url: `${API_URL}/image/${urlRes.data.fields.key}`
        };
      });

      const uploadedImages = (await Promise.all(uploadPromises)).filter(Boolean);

      const response = await axios.post(`${API_URL}/booking/start-ride/${booking.id}`, {
        startDateTime: new Date().toISOString(),
        startKms: data.startKms,
        startOtp: data.startOtp,
        startImages: uploadedImages
      });
      navigation.navigate('RideInfo', {bookingId:bookingId});
    } catch (error) {
      console.error('Error starting ride:', error.response ? error.response.data : error.message);
      // Surface the backend's actual reason (e.g. "Invalid Start OTP") instead
      // of a generic message that hides why the ride didn't start.
      notify(error.response?.data?.message || error.response?.data?.error || 'Could not start the ride. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = (type) => {
    setData({
      ...data,
      images: {
        ...data.images,
        [type]: null
      }
    });
  };

  const imageTypes = [
    {key: 'front', label: 'Front View'},
    {key: 'back', label: 'Rear View'},
    {key: 'driverSide', label: 'Driver Side View'},
    {key: 'passengerSide', label: 'Passenger Side View'},
    {key: 'userWithCar', label: 'User with Car'},
    {key: 'fuelOdometer', label: 'Fuel Odometer'}
  ];

  return (
    <View style={{flex:1,backgroundColor:'#000',height:'100%'}}>
        <CenterHeader title={'Start Ride'} customSecondaryText={booking.bookingId} navigation={navigation}/>

            <View style={{flex:1,justifyContent:'space-between',paddingVertical:24,paddingHorizontal:16}}>
                <GestureHandlerRootView style={{flex:1}}>
        <ScrollView style={{flex:1,}}>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,marginBottom:4,textTransform:'uppercase'}}>Start Date & Time</CustomText>
          <TouchableOpacity onPress={()=>setShowDateTimePicker(true)} style={{backgroundColor:'#1c1c1e',padding:14,borderRadius:5,textAlign:'left',marginBottom:18}}>
            <CustomText fontType='primary' weight='SemiBold' style={{color:'#a3a3a3', fontSize:12,marginBottom:4,textTransform:'uppercase'}}>{formatDate(new Date(data.startDateTime))}</CustomText>
          </TouchableOpacity>
    
         
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,marginBottom:4,textAlign:'left',textTransform:'uppercase'}}>Start Odometer Reading</CustomText>
            <TextInput
            style={{backgroundColor:'#1c1c1e',padding:10,borderRadius:5,textAlign:'left',marginBottom:18}}
            value={data.startKms}
            placeholderTextColor='#757575'
            onChangeText={(value)=>setData({...data,startKms:value})}
            />
             <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,marginBottom:4,textTransform:'uppercase',textAlign:'center'}}>Start Ride OTP</CustomText>
            <View style={{flexDirection: 'row', justifyContent: 'center', marginBottom: 18}}>
              <OtpInput
                length={6}
                value={data.startOtp}
                onChange={(value) => setData({...data, startOtp: value})}
              />
            </View>
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Car Images</CustomText>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:'100%',marginTop:12,gap:12,flexWrap:'wrap'}}>
            {imageTypes.map((type) => (
              <View key={type.key} style={{width:'48%',marginBottom:12}}>
                <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:10,marginBottom:8,textTransform:'uppercase'}}>{type.label}</CustomText>
                {!data.images[type.key] ? (
                  <TouchableOpacity onPress={() => selectImage(type.key)} style={{backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:12,paddingHorizontal:12,color:'#fff',fontSize:14,height:100,justifyContent:'center',alignItems:'center'}}>
                    <Icon name='add-circle-outline' size={24} color='#959595'/>
                    <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:10,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center',marginTop:4}}>Select Image</CustomText>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={{backgroundColor:'#1c1c1e',borderRadius:5,height:100,justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
                    <TouchableOpacity onPress={() => handleRemoveImage(type.key)} style={{position:'absolute',top:4,right:4,backgroundColor:'#1c1c1e',borderRadius:100,padding:6,zIndex:100}}>
                      <Icon name='trash-outline' size={18} color='#fff'/>
                    </TouchableOpacity>
                    <Image source={{uri:data.images[type.key].uri}} style={{width:'100%',height:'100%',borderRadius:5}}/>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
      </ScrollView>
      </GestureHandlerRootView>

        <TouchableOpacity disabled={isLoading || !data.startDateTime || !data.startKms || !data.startOtp || !data.images.front || !data.images.back || !data.images.driverSide || !data.images.passengerSide || !data.images.userWithCar || !data.images.fuelOdometer} onPress={onSubmit} style={{backgroundColor:(isLoading || !data.startDateTime || !data.startKms || !data.startOtp || !data.images.front || !data.images.back || !data.images.driverSide || !data.images.passengerSide || !data.images.userWithCar || !data.images.fuelOdometer) ? '#4C4C4E' : BRAND_COLOR,borderRadius:5,paddingVertical:12,paddingHorizontal:12,color:'#fff',fontSize:14,width:'100%',marginTop:12,justifyContent:'center',alignItems:'center'}}>
          <CustomText fontType='primary' weight='Bold' style={{color:'#000', fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>{isLoading ? 'Starting…' : 'Start Ride'}</CustomText>
        </TouchableOpacity>

      </View>

        {
            showDateTimePicker ? <DateTimePickerModal data={data} setData={(value)=>setData(prev=>({...prev,startDateTime:value}))} setShow={setShowDateTimePicker} show={showDateTimePicker}/> : null
        }
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    paddingTop:24,
    paddingHorizontal:24,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal:24,
    paddingVertical:24
  },
  modalContent: {
    height: '100%',
    flex: 1,
    paddingHorizontal:24,
    paddingVertical:24
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  cityItem: {
    flexDirection:'row',
    alignItems:'center',
    gap:12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    textAlign:'left',
    textTransform:'capitalize',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
  },
  confirmButton: {
    backgroundColor: '#EDBF31',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    color:'#fff'
  },
  confirmButtonDisabled: {
    backgroundColor: '#4C4C4E',
    color:'#a3a3a3'
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
