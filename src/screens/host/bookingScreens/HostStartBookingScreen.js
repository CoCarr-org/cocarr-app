import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, FlatList, Image, TextInput, Alert, ActivityIndicator, ToastAndroid } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../../utils/constants';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';
import CustomText from '../../../components/CustomText';
import { useNavigation } from '@react-navigation/native';
import CenterHeader from '../../../components/CenterHeader';
// import { DateTimePickerModal } from '../../../components/host/DateTimePickerModal';
import { launchImageLibrary } from 'react-native-image-picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { formatDate, formatDateOnly, formatTime, UnauthAxios, notify } from '../../../utils/utils';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerModal } from '../../../components/host/DateTimePickerModal';

export function HostStartBookingScreen({route}) {
  const navigation = useNavigation();
  const {bookingId} = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [booking, setBooking] = useState({});
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [data, setData] = useState({
    startDateTime: new Date().toISOString(),
    startKms: '',
    startFuel: '',
    startImages: []
  });
  const dispatch = useDispatch();
  const actionSheetRef = useRef(null);


  useEffect(() => {

    async function fetchData() {
        try {
            const response = await axios.get(`${API_URL}/host/bookings/${bookingId}`);
            console.log('response',response.data)
            setBooking(response.data);
        } catch (error) {
            console.error('Error fetching booking data:', error.message);
            notify('Error');
        }
    }

      fetchData();
    
  }, [bookingId]);


  const submitEndBooking = async () => 
    {
        try {
          setIsLoading(true);
          const response = await axios.post(`${API_URL}/host/bookings/start/${bookingId}`, {
            startDateTime: data.startDateTime,
            startKms: data.startKms,
            startFuel: data.startFuel,
            startImages: data.startImages
          });
          navigation.navigate('HostBookingInfo', {bookingId:bookingId});
            actionSheetRef.current.hide();
        } catch (error) {
            console.error('Error submitting review:', error.message);
            notify('Error');
        }
        setIsLoading(false);
  };

  const selectImages = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 0 }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const updatedAssets = response.assets.map((asset, index) => ({
          ...asset,
          isCover: index === 0
        }));
        setData({...data,startImages:updatedAssets});
      }
    });
  };
const onSubmit = async () => {
  try {
    const uploadPromises = data.startImages.map(async (image) => {
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
        url: urlRes.data.url + urlRes.data.fields.key,
        isCover: image.isCover
      };
    });

    const uploadedImageUrls = await Promise.all(uploadPromises);

    // Pass the array of URLs with isCover to the /host/vehicles endpoint
    const response = await axios.post(`${API_URL}/host/bookings/start/${booking.id}`, {
        startDateTime: new Date().toISOString(),
        startKms: data.startKms,
        startFuel: data.startFuel,
        startImages: uploadedImageUrls
      });
      navigation.navigate('HostBookingInfo', {bookingId:bookingId});
  } catch (error) {
    console.error('Error uploading images:', error.response ? error.response.data : error.message);
    notify('Error uploading images');
  }
};

  const handleRemoveImage = (index) => {
    const newImages = [...data.startImages];
    newImages.splice(index, 1);
    setData({...data,startImages:newImages});
  };

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
    
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,marginBottom:4,textTransform:'uppercase'}}>Start Fuel Reading</CustomText>
            <TextInput
             
            style={{backgroundColor:'#1c1c1e',padding:10,borderRadius:5,textAlign:'left',marginBottom:18}}
            value={data.startFuel}
            placeholderTextColor='#757575'
            onChangeText={(value)=>setData({...data,startFuel:value})}
            />
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,marginBottom:4,textAlign:'left',textTransform:'uppercase'}}>Start Odometer Reading</CustomText>
            <TextInput
             
            style={{backgroundColor:'#1c1c1e',padding:10,borderRadius:5,textAlign:'left',marginBottom:18}}
            value={data.startKms}
            placeholderTextColor='#757575'
            onChangeText={(value)=>setData({...data,startKms:value})}
            />
        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Car Images (Max 10)</CustomText>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',width:'100%',marginTop:12,gap:12,flexWrap:'wrap'}}>
              {data.startImages.length < 10 && <TouchableOpacity onPress={selectImages} style={{backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:12,paddingHorizontal:12,color:'#fff',fontSize:14,width:'48%',height:100,justifyContent:'center',alignItems:'center'}}>
                  <Icon name='add-circle-outline' size={24} color='#959595'/>
                  <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:10,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center',marginTop:4}}>Select Images</CustomText>
              </TouchableOpacity>}
            {
                data.startImages.map((image,index) => (
                    <TouchableOpacity key={index} style={{backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:0,paddingHorizontal:0,color:'#fff',fontSize:14,width:'48%',height:100,justifyContent:'center',alignItems:'center'}}>
                  <TouchableOpacity onPress={() => handleRemoveImage(index)} style={{position:'absolute',top:4,right:4,backgroundColor:'#1c1c1e',borderRadius:100,padding:6,zIndex:100}}>
                    <Icon name='trash-outline' size={18} color='#fff'/>
                  </TouchableOpacity>
                  <Image source={{uri:image.uri}} style={{width:'100%',height:'100%',borderRadius:5}}/>
                </TouchableOpacity>
              ))
          }
          </View>
      </ScrollView>
      </GestureHandlerRootView>

        <TouchableOpacity onPress={onSubmit} style={{backgroundColor:BRAND_COLOR,borderRadius:5,paddingVertical:12,paddingHorizontal:12,color:'#fff',fontSize:14,width:'100%',marginTop:12,justifyContent:'center',alignItems:'center'}}>
          <CustomText fontType='primary' weight='Bold' style={{color:'#000', fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Start Ride</CustomText>
        </TouchableOpacity>
        
      </View>

        {
            showDateTimePicker ? <DateTimePickerModal data={data} setData={(value)=>setData(prev=>({...prev,startDateTime:value}))} setShow={setShowDateTimePicker} show={showDateTimePicker}/> : null
        }
    </View>
  );
}



// const DateTimePickerModal = ({data,setShowDateTimePicker,showDateTimePicker,setData})=>
// {
//   const actionsheetRef = useRef(null);

//   useEffect(()=>{
//     if(showDateTimePicker){
//       actionsheetRef.current.show();
//     }
//     else{
//       actionsheetRef.current.hide();
//     }
//   },[showDateTimePicker])

//   const onDateChange = (event,date)=>{
//     setData({...data,startDateTime:date.toISOString()});
//     setShowDateTimePicker(false);
//   }
//   return(
//     <ActionSheet ref={actionsheetRef} containerStyle={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'rgba(0,0,0,0.5)'}}>
//       <RNDateTimePicker value={new Date(data.startDateTime)} mode='datetime' display='spinner' onChange={(event,date)=>onDateChange(event,date)} />
//     </ActionSheet>
//   )
// }


const styles = StyleSheet.create({
  modalContainer: {
    paddingTop:24,
    paddingHorizontal:24,
    // minHeight:'45%',
    // flex:1,
    // alignItems:'space-between',
    // flex: 1,
    // paddingHorizontal:16,
    // paddingVertical:16,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    // justifyContent: 'flex-end',
  },
  contentContainer: {
    flex: 1,
    // height:'100%',
    paddingHorizontal:24,
    paddingVertical:24
  },
  modalContent: {
    // backgroundColor: '#000',
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
    // color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
});

