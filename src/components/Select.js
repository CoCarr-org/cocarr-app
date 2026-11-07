import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity,TouchableHighlight } from 'react-native';
import ActionSheet, { ScrollView } from 'react-native-actions-sheet';
import CustomText from './CustomText';
import Icons from 'react-native-vector-icons/Ionicons';

import { C } from '../theme';

const Select = ({ options, selected, onSelect ,label='name',placeholder='Select an option',containerStyle}) => {
  const [selectedOption, setSelectedOption] = useState(selected);
  const actionSheetRef = useRef(null);

  useEffect(() => {
    setSelectedOption(selected);
  }, [selected]);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onSelect(option);
    actionSheetRef.current?.hide();
  };

  return (
    <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:C.surface,borderRadius:5,shadowOpacity:0.5,shadowRadius:1,shadowColor:C.borderStrong,width:'100%',...containerStyle}}>
      <TouchableOpacity onPress={() => actionSheetRef.current?.show()} style={{flex:1,paddingVertical:12,paddingHorizontal:12,justifyContent:'space-between',flexDirection:'row',alignItems:'center'}}>
        <Text style={{color: selectedOption ? C.text : C.textTertiary, fontSize:14}}>{selectedOption ? selectedOption[label] : placeholder}</Text>
        <Icons name="chevron-down" size={13} color={C.textTertiary} style={{marginBottom:3,marginLeft:4}} />
      </TouchableOpacity>
      <ActionSheet ref={actionSheetRef} containerStyle={{backgroundColor:C.surface,height:'50%'}} height={'50%'} safeAreaInsets={{bottom:0}}>
        <ScrollView style={{paddingHorizontal:16,paddingVertical:24}}>

        {options.map((option, index) => (
          <TouchableHighlight underlayColor={C.background} style={{borderRadius:8}} key={index} onPress={() => handleSelect(option)}>
            <CustomText fontType='primary' weight='SemiBold' style={{color:C.text, fontSize:13,textTransform:'uppercase',letterSpacing:-.15,paddingVertical:12,paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:C.border}}>{option[label]}</CustomText>
          </TouchableHighlight>
        ))}
        </ScrollView>
      </ActionSheet>
    </View>
  );  
};

export default Select;
