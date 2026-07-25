import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, FlatList, Image, TextInput, Alert, ActivityIndicator, ToastAndroid, PermissionsAndroid } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../../utils/constants';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';
import CustomText from '../../../components/CustomText';
import { useNavigation } from '@react-navigation/native';
import CenterHeader from '../../../components/CenterHeader';
import { launchImageLibrary } from 'react-native-image-picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { formatDate, formatDateOnly, formatTime, UnauthAxios, notify } from '../../../utils/utils';
import { DateTimePickerModal } from '../../../components/host/DateTimePickerModal';
import Select from '../../../components/Select';

export function HostDamageScreen({route}) {
  const navigation = useNavigation();
  const {bookingId} = route.params;
  const authInfo = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [booking, setBooking] = useState({});
  const inputRef = useRef(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [damageParts, setDamageParts] = useState([
    {label: 'Front Driver Door', value: 'front-driver-door'},
    {label: 'Passenger Door', value: 'passenger-door'},
    {label: 'Front Bumper', value: 'front-bumper'},
    {label: 'Bonnet', value: 'bonnet'},
    {label: 'Rear Bumper', value: 'rear-bumper'},
    {label: 'Right Quarter Panel', value: 'right-quarter-panel'},
    {label: 'Left Quarter Panel', value: 'left-quarter-panel'},
    {label: 'Rear Right Door', value: 'rear-right-door'},
    {label: 'Rear Left Door', value: 'rear-left-door'},
    {label: 'Driver Side Rear View Mirror', value: 'driver-side-mirror'},
    {label: 'Passenger Side Rear View Mirror', value: 'passenger-side-mirror'}
  ]);
  const [damageTypes, setDamageTypes] = useState([
    {label: 'Scratch', value: 'scratch'},
    {label: 'Multiple Scratches', value: 'multiple-scratches'},
    {label: 'Dent', value: 'dent'},
    {label: 'Minor Damage', value: 'minor-damage'},
    {label: 'Broken Part', value: 'broken-part'},
    {label: 'Major Damage', value: 'major-damage'},
    {label: 'Accident', value: 'accident'},
    {label: 'Other', value: 'other'}
  ]);
  
  const [data, setData] = useState({
    bookingId: booking.id,
    damageDescription: '',
    damagePart: '',
    damageType: '',
    damageImage: []
  });
  const dispatch = useDispatch();
  const actionSheetRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

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

  const selectImages = async () => {
    // This is the photo LIBRARY picker — it needs no camera permission. The old
    // camera-permission gate rejected on iOS (PermissionsAndroid is Android-only),
    // so images could never be added and the whole report was un-submittable.
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 10, quality: 0.5 }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        notify('Could not open the photo library');
      } else if (response.assets?.length) {
        setData((prev) => ({
          ...prev,
          damageImage: [...prev.damageImage, ...response.assets],
        }));
      }
    });
  };

  const onSubmit = async () => {
    try {
        setSubmitting(true);
      const uploadPromises = Object.entries(data.damageImage).map(async ([type, image]) => {
        if (!image) return null;

        let urlRes = await axios.get(`${API_URL}/image/url`, {
          params: { fileName: image.fileName, fileType: image.type }
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
        }).catch(error => {
          console.error('Upload error:', error.response?.data || error.message);
          throw error;
        });

        // The presigned bucket URL has no trailing slash, so `url + key`
        // produces a malformed link. The bucket is private anyway — store the
        // API image-proxy URL built from the object key (matches the web).
        return {
          type,
          url: `${API_URL}/image/${urlRes.data.fields.key}`
        };
      });

      const uploadedImages = (await Promise.all(uploadPromises)).filter(Boolean);

      const response = await axios.post(`${API_URL}/damage/create`, {
        bookingId: booking.id,
        damageType: data.damageType.value,
        damageDescription: data.damageDescription,
        damagedPart: data.damagePart.value,
        damageImage: uploadedImages
      }, {
        headers: { Authorization: `${authInfo.token}` }
      });
      navigation.navigate('HostBookingInfo', {bookingId:bookingId});
      setSubmitting(false);
    } catch (error) {
      console.log('error',error)
      console.error('Error uploading images:', error.response ? error.response.data : error.message);
      notify('Error uploading images');
      setSubmitting(false);
    }
  };

  const handleRemoveImage = (index) => {
    setData({
      ...data,
      damageImage: data.damageImage.filter((_, i) => i !== index)
    });
  };


  return (
    <View style={{flex:1,backgroundColor:'#000',height:'100%'}}>
        <CenterHeader title={'Report Damage'} customSecondaryText={booking.bookingId} navigation={navigation}/>

            <View style={{flex:1,justifyContent:'space-between',paddingVertical:24,paddingHorizontal:16}}>
                <GestureHandlerRootView style={{flex:1}}>
        <ScrollView style={{flex:1,}}>
          {/* <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,marginBottom:4,textTransform:'uppercase'}}>End Date & Time</CustomText>
          <TouchableOpacity onPress={()=>setShowDateTimePicker(true)} style={{backgroundColor:'#1c1c1e',padding:14,borderRadius:5,textAlign:'left',marginBottom:18}}>
            <CustomText fontType='primary' weight='SemiBold' style={{color:'#a3a3a3', fontSize:12,marginBottom:4,textTransform:'uppercase'}}>{formatDate(new Date(data.endDateTime))}</CustomText>
          </TouchableOpacity> */}

          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,marginBottom:4,textAlign:'left',textTransform:'uppercase'}}>Damaged Part</CustomText>
            <Select options={damageParts} label='label' value='value' onSelect={(value)=>setData({...data,damagePart:value})} setData={(value)=>setData({...data,damagePart:value})}/>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,marginBottom:4,marginTop:12,textAlign:'left',textTransform:'uppercase'}}>Damage Type</CustomText>
            <Select options={damageTypes} label='label' value='value' onSelect={(value)=>setData({...data,damageType:value})} setData={(value)=>setData({...data,damageType:value})}/>
         
          {/* <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,marginBottom:4,textAlign:'left',textTransform:'uppercase',marginTop:16}}>Damage Amount</CustomText>
            <TextInput
            numberOfLines={1}
            style={{backgroundColor:'#1c1c1e',padding:10,borderRadius:5,textAlign:'left'}}
            value={data.damageAmount}
            placeholderTextColor='#757575'
            placeholder='Enter Damage Amount'
            onChangeText={(value)=>setData({...data,damageAmount:value})}
            /> */}

          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,marginBottom:4,textAlign:'left',textTransform:'uppercase',marginTop:16}}>Damage Description</CustomText>
            <TextInput
            numberOfLines={3}
            style={{backgroundColor:'#1c1c1e',padding:10,borderRadius:5,textAlign:'left',marginBottom:18}}
            value={data.damageDescription}
            placeholderTextColor='#757575'
            onChangeText={(value)=>setData({...data,damageDescription:value})}
            />


        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Car Images</CustomText>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:'100%',marginTop:12,gap:12,flexWrap:'wrap'}}>
              {data.damageImage.length < 10 && <TouchableOpacity onPress={selectImages} style={{backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:12,paddingHorizontal:12,color:'#fff',fontSize:14,width:'48%',height:100,justifyContent:'center',alignItems:'center'}}>
                  <Icon name='add-circle-outline' size={24} color='#959595'/>
                  <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:10,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center',marginTop:4}}>Select Images</CustomText>
              </TouchableOpacity>}
            {
                    data.damageImage.map((image,index) => (
                    <TouchableOpacity key={index} style={{backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:0,paddingHorizontal:0,color:'#fff',fontSize:14,width:'48%',height:100,justifyContent:'center',alignItems:'center'}}>
                  <TouchableOpacity onPress={() => handleRemoveImage(index)} style={{position:'absolute',top:4,right:4,backgroundColor:'#1c1c1e',borderRadius:100,padding:6,zIndex:100}}>
                    <Icon name='trash-outline' size={18} color='#fff'/>
                  </TouchableOpacity>
                  <Image source={{uri:image.uri}} style={{width:'100%',height:'100%',borderRadius:5}}/>
                </TouchableOpacity>
              ))
          }
              {/* </View> */}
            {/* ))} */}
          </View>
      </ScrollView>
      </GestureHandlerRootView>

        <TouchableOpacity disabled={submitting || !data.damageType || !data.damageDescription || data.damageImage.length === 0 || !data.damagePart} onPress={onSubmit} style={{backgroundColor:(submitting || !data.damageType || !data.damageDescription || data.damageImage.length === 0 || !data.damagePart) ? '#4C4C4E' : BRAND_COLOR,borderRadius:5,paddingVertical:12,paddingHorizontal:12,color:'#fff',fontSize:14,width:'100%',marginTop:12,justifyContent:'center',alignItems:'center'}}>
          <CustomText fontType='primary' weight='Bold' style={{color:'#000', fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>{submitting ? 'Submitting…' : 'Submit Damage Report'}</CustomText>
        </TouchableOpacity>
        
      </View>

        {
            showDateTimePicker ? <DateTimePickerModal setData={(value)=>setData(prev=>({...prev,endDateTime:value}))} setShow={setShowDateTimePicker} show={showDateTimePicker}/> : null
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
