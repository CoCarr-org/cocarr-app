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

export default function LocationInvalidScreen({show,setShow,onPress}) {

  const navigator = useNavigation()
  const booking = useSelector(state => state.booking)
 
  const actionSheetRef = useRef(null)

  useEffect(()=>{
    if(actionSheetRef.current) actionSheetRef.current.show()
  },[show])


  return (
    <ActionSheet defaultOverlayOpacity={0.85} ref={actionSheetRef} onClose={()=>setShow(false)} backgroundColor={C.surface} containerStyle={{backgroundColor:C.surface}} >
      <View style={{paddingHorizontal:16,paddingVertical:24,justifyContent:'flex-end',alignItems:'flex-start',flexDirection:'column',minHeight:180}}>
          <View style={{flex:1}}>
          <CustomText weight='Medium' fontType='primary' numberOfLines={2} style={{color:C.text,fontSize:14,height:80,letterSpacing:-0.05,flex:1,textAlign:'left',lineHeight:20}}>The location you selected is invalid. Please select a valid location.</CustomText>
          </View>
          <TouchableOpacity onPress={onPress} style={{backgroundColor:C.primary,padding:16,borderRadius:6,height:52,justifyContent:'center',alignItems:'center',width:'100%'}}>
              <CustomText weight='Bold' fontType='primary' style={{color:C.onPrimary,fontSize:12,letterSpacing:-0.05,flex:1,textAlign:'left',lineHeight:20,textTransform:'uppercase'}}>Okay, Continue</CustomText>
          </TouchableOpacity>
      </View>
    </ActionSheet>
  );
}


