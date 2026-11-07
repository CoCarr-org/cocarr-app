import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StatusBar, TouchableOpacity, Image, ScrollView, FlatList, TouchableHighlight, TextInput } from 'react-native';
import { API_URL } from '../../utils/constants';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { formatDate } from '../../utils/utils';
import CustomText from '../../components/CustomText';
import { setShowCityPicker } from '../../store/bookingSlice';
import ActionSheet from 'react-native-actions-sheet';
import Icon from 'react-native-vector-icons/Ionicons';

import { C } from '../../theme';

export default function LocationChangeNotificationScreen({show,setShow,onPress}) {

  const navigator = useNavigation()
  const booking = useSelector(state => state.booking)
  const info = show.info
 
  const actionSheetRef = useRef(null)
  console.log('change info', info)

  useEffect(()=>{
    if(actionSheetRef.current) actionSheetRef.current.show()
  },[show])


  return (
    <ActionSheet defaultOverlayOpacity={0.85} ref={actionSheetRef} onClose={()=>setShow(false)} backgroundColor={C.surface} containerStyle={{backgroundColor:C.surface}}>
      <View style={{paddingHorizontal:16,paddingVertical:24,minHeight:220}}>
          <View style={{flex:1,marginBottom:24,justifyContent:'space-between'}}>

          <CustomText weight='Bold' fontType='primary' style={{color:C.text,fontSize:14,letterSpacing:-0.05,flex:1,textAlign:'left',lineHeight:20, height: 24}}>Are you sure you want to change the city?</CustomText>
          <CustomText weight='Medium' fontType='primary' style={{color:C.text,fontSize:12,letterSpacing:-0.05,flex:1,textAlign:'left',lineHeight:20, height: 60}}>The location you selected is in {show.city?.name}. You are changing the city from {booking.selectedCity?.name} to {show.city?.name}</CustomText>
          </View>
          <TouchableHighlight onPress={()=>onPress(show.info,show.city)} style={{backgroundColor:C.primary,padding:16,borderRadius:6,height:52,justifyContent:'center',alignItems:'center',width:'100%'}}>
              <CustomText weight='Bold' style={{color:C.onPrimary,fontSize:12,letterSpacing:-0.05,flex:1,textAlign:'left',lineHeight:20, height: 40,textTransform:'uppercase'}}>Continue</CustomText>
          </TouchableHighlight>
      </View>
    </ActionSheet>
  );
}


