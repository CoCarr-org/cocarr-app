import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  FlatList,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../../../utils/constants';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';
import CustomText from '../../../components/CustomText';
import { useNavigation } from '@react-navigation/native';
import CenterHeader from '../../../components/CenterHeader';
import { DateTimePickerModal } from '../../../components/host/DateTimePickerModal';
import { launchImageLibrary } from 'react-native-image-picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UnauthAxios, notify } from '../../../utils/utils';

import { C, themedStyleSheet } from '../../../theme';

export function HostBankPage({route}) {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState({accountNumber:'',ifscCode:'',accountHolderName:''});
  const [showUpdateBankModal, setShowUpdateBankModal] = useState(false);
  const [data, setData] = useState({
    startDateTime: new Date().toISOString(),
    startKms: '',
    startFuel: '',
    startImages: []
  });
  const dispatch = useDispatch();
  const actionSheetRef = useRef(null);

  
      async function fetchData() {
          try {
              const response = await axios.get(`${API_URL}/host/bank`);
              console.log('response',response.data)
              setBankInfo(response.data);
          } catch (error) {
              console.error('Error fetching booking data:', error.message);
              notify('Error');
          }
      }

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(`${API_URL}/host/bank`,data);
      console.log('response',response.data)
      setShowUpdateBankModal(false);
      await fetchData();
    } catch (error) {
      console.error('Error updating bank details:', error.message);
      notify('Error');
    }
  }

  return (
    <View style={{flex:1,backgroundColor:C.background,height:'100%'}}>
      <CenterHeader title={'Bank Details'} customSecondaryText={'Earning Details'} navigation={navigation}/>

      <View style={{flex:1,justifyContent:'space-between',paddingVertical:16,paddingHorizontal:24,paddingTop:40}}>
          <GestureHandlerRootView style={{flex:1}}>
  <ScrollView style={{flex:1,}}>
    <View style={{marginBottom:16}}>
      <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary, fontSize:11,marginBottom:0,textTransform:'uppercase'}}>Bank Account Number</CustomText>
      <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
      <CustomText fontType='primary' weight='Medium' style={{color:C.text, fontSize:13}}>{bankInfo?.accountNumber ? bankInfo.accountNumber : 'Not Added'}</CustomText>
      <TouchableOpacity>
        <Icon name='checkmark-circle' size={18} color={C.success}/>
      </TouchableOpacity>
      </View>
    </View>

    <View style={{marginBottom:16}}>
      <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary, fontSize:11,marginBottom:0,textTransform:'uppercase'}}>Bank IFSC Code</CustomText>
      <CustomText fontType='primary' weight='Medium' style={{color:C.text, fontSize:13}}>{bankInfo?.ifscCode ? bankInfo.ifscCode : 'Not Added'}</CustomText>
    </View>

    <View style={{marginBottom:16}}>
    <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary, fontSize:11,marginBottom:0,textTransform:'uppercase'}}>Account Holder Name</CustomText>
      <CustomText fontType='primary' weight='Medium' style={{color:C.text, fontSize:13}}>{bankInfo?.accountHolderName ? bankInfo.accountHolderName : 'Not Added'}</CustomText>
    </View>

    <View style={{marginBottom:16}}>
    <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary, fontSize:11,marginBottom:0,textTransform:'uppercase'}}>City</CustomText>
      <CustomText fontType='primary' weight='Medium' style={{color:C.text, fontSize:13}}>{bankInfo?.city ? bankInfo.city : 'Not Added'}</CustomText>
    </View>
       
</ScrollView>
</GestureHandlerRootView>

  <TouchableOpacity onPress={()=>setShowUpdateBankModal(true)} style={{backgroundColor:C.primary,borderRadius:5,paddingVertical:12,paddingHorizontal:12,color:C.onPrimary,fontSize:14,width:'100%',marginTop:12,justifyContent:'center',alignItems:'center'}}>
    <CustomText fontType='primary' weight='Bold' style={{color:C.onPrimary, fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Update Bank Details</CustomText>
  </TouchableOpacity>
  
</View>

      {
          showUpdateBankModal ? <UpdateBankModal onSubmit={onSubmit} setShow={setShowUpdateBankModal} show={showUpdateBankModal}/> : null
      }
    </View>
  );
}


const UpdateBankModal = ({setShow,show,onSubmit}) => {
  const ref = useRef(null);
  const [bankInfo, setBankInfo] = useState({accountNumber:'',ifscCode:'',hostProvidedName:''});

  useEffect(()=>{
    if(show){
      ref.current.show();
    }
    else{
      ref.current.hide();
    }
  },[show])




  const onCancel = () => {
    setShow(false);
    setBankInfo({accountNumber:'',ifscCode:'',hostProvidedName:''});
  }

  return (
    <ActionSheet onClose={onCancel} defaultOverlayOpacity={0.75} isModal={true} ref={ref} containerStyle={{paddingHorizontal:6,paddingBottom:6,backgroundColor:C.background,minHeight:'40%'}}>
      <ScrollView contentContainerStyle={{paddingVertical:24,paddingHorizontal:20,backgroundColor:C.surfaceHigh,minHeight:'40%',borderRadius:16}}>
      <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary, fontSize:11,marginBottom:6,textTransform:'uppercase'}}>Bank Account Number</CustomText>
      <TextInput placeholder='Account Number' keyboardType='numeric' style={{backgroundColor:C.surface,color:C.text,padding:10,borderRadius:5,textAlign:'left',marginBottom:18}} value={bankInfo.accountNumber} placeholderTextColor={C.textTertiary} onChangeText={(text)=>{setBankInfo({...bankInfo,accountNumber:text})}}/>

      <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary, fontSize:11,marginBottom:6,textTransform:'uppercase'}}>Bank IFSC Code</CustomText>
      <TextInput placeholder='IFSC CODE' style={{backgroundColor:C.surface,color:C.text,padding:10,borderRadius:8,textAlign:'left',marginBottom:18}} value={bankInfo.ifscCode} placeholderTextColor={C.textTertiary} onChangeText={(text)=>{setBankInfo({...bankInfo,ifscCode:text.toUpperCase()})}} autoCapitalize='characters'/>

      <CustomText fontType='primary' weight='SemiBold' style={{color:C.textTertiary, fontSize:11,marginBottom:6,textTransform:'uppercase'}}>Bank Account Holder Name</CustomText>
      <TextInput placeholder='Account Holder Name' style={{backgroundColor:C.surface,padding:10,color:C.text,borderRadius:8,textAlign:'left',marginBottom:18}} value={bankInfo.hostProvidedName} placeholderTextColor={C.textTertiary} onChangeText={(text)=>{setBankInfo({...bankInfo,hostProvidedName:text})}}/>
      <TouchableOpacity onPress={()=>onSubmit(bankInfo)} style={{backgroundColor:C.primary,borderRadius:5,paddingVertical:12,paddingHorizontal:12,color:C.onPrimary,fontSize:14,width:'100%',marginTop:12,justifyContent:'center',alignItems:'center'}}>
          <CustomText fontType='primary' weight='Bold' style={{color:C.onPrimary, fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Verify Bank Details</CustomText>
        </TouchableOpacity>
      </ScrollView>
    </ActionSheet>
  );
}



const styles = themedStyleSheet(C => ({
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
    color: C.text,
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
    borderBottomColor: C.borderStrong,
  },

  confirmButton: {
    backgroundColor: C.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    color:C.text
  },

  confirmButtonDisabled: {
    backgroundColor: C.surfaceHighest,
    color:C.textSecondary
  },

  confirmButtonText: {
    // color: '#000',
    fontSize: 14,
    fontWeight: '500',
  }
}));

