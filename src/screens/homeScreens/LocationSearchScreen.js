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

export default function LocationSearchScreen({show,setShow,onPress}) {

  const navigator = useNavigation()
  const booking = useSelector(state => state.booking)
 
  const actionSheetRef = useRef(null)
  const [search,setSearch] = useState('')
  const [locations,setLocations] = useState([])


  useEffect(()=>{
    if(show){
      actionSheetRef.current.show()
    }
  },[show])


  useEffect(()=>{
    console.log('auth',booking)
  },[])

  const onClose = () => {
      if(actionSheetRef.current) actionSheetRef.current.hide()
    setShow(false)
  }


  const onSearch = async() => {
    try {
      if(search.length > 2){
        const response = await axios.get(`${API_URL}/utility/autocomplete?search=${search}&cityId=${booking.selectedCity?.id || ''}`)
        console.log(response.data)
        setLocations(response.data)
      }
    } catch (error) {
      console.log(error)
    }
  }


  useEffect(()=>{
    onSearch()
  },[search])

  return (
    <ActionSheet defaultOverlayOpacity={0.85} ref={actionSheetRef} onClose={onClose} backgroundColor={C.surface} containerStyle={{backgroundColor:C.surface,minHeight:'90%'}}>
      <View style={{paddingHorizontal:16,paddingVertical:24}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center',marginBottom:16}}>
          <CustomText weight='Bold' style={{color:C.text,fontSize:14,textTransform:'uppercase',letterSpacing:0.15}}>Search location</CustomText>
          <TouchableOpacity onPress={onClose} hitSlop={{top:12,bottom:12,left:12,right:12}} style={{height:32,width:32,borderRadius:16,backgroundColor:C.surfaceHigh,alignItems:'center',justifyContent:'center'}}>
            <Icon name='close' size={18} color={C.text}/>
          </TouchableOpacity>
      </View>
      <TextInput onChangeText={setSearch} value={search} placeholder='Search a place or address' placeholderTextColor={C.textTertiary} autoFocus style={{backgroundColor:C.surfaceHigh, padding:12, borderRadius:8,color:C.text,marginBottom:12}}/>
      <FlatList data={locations} renderItem={({item}) => <LocationItem onPress={onPress} item={item} setShow={setShow} setSearch={setSearch}/>}/>
      </View>
    </ActionSheet>
  );
}


const LocationItem = ({item,setShow,setSearch,onPress}) => {
  return (
    <TouchableOpacity onPress={()=>onPress(item)}>
      <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-start', paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border}}>
              <Icon name='location-outline' size={14} color={C.textSecondary}/>
              <View style={{marginLeft:8,marginRight:12}}>
                  <CustomText weight='Regular' style={{color:C.text,fontSize:12,letterSpacing:-0.05,flex:1,textAlign:'left',lineHeight:20}}>{item.description}</CustomText>
              </View>
          {/* <Icon name='chevron-forward-outline' size={14} color='#a3a3a3'/> */}
      </View>
    </TouchableOpacity>
  );
}


