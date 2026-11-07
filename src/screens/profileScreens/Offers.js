import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Animated,
  ToastAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_URL } from '../../utils/constants';
import { formatDate, formatExpiryDateandTime, notify } from '../../utils/utils';
import HeaderBlock from '../../components/CenterHeader';
import ActionSheet from 'react-native-actions-sheet';
import CustomText from '../../components/CustomText';


import { C, themedStyleSheet } from '../../theme';


export default function OffersScreen({ navigation,route }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedOfferItem, setSelectedOfferItem] = useState(null);
  const [showOfferDetailsModal, setShowOfferDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const actionRef = useRef(null);


  const onPress = (selectedOffer) => {
    navigation.navigate('CarInfo', { selectedOffer });
  };


  const getMyOffers = async () => {
    try {
      const response = await axios.get(`${API_URL}/offers?populate=true`);
      setOffers(response.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      notify(error.message);
      console.log('error', error);
    }
  };

  useEffect(() => {
    getMyOffers();
  }, []);

  useEffect(() => {
    if (showOfferDetailsModal) {
      actionRef.current.show();
    }
    else{
      actionRef.current.hide();
    }
  }, [showOfferDetailsModal]);
  

  return (
    <View style={styles.container}>
      {/* Title is the shared header now (TopBar / stack header). */}
      {loading ? <SkeletonItem/> : 
    <View style={{flexDirection:'column',justifyContent:'flex-start'}}>
    {/* <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Enter offer code"
        placeholderTextColor="#a3a3a3"
        
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        />
      <TouchableOpacity style={styles.applyButton} onPress={() => applyOfferCode()}>
        <Text style={styles.applyButtonText}>Apply</Text>
      </TouchableOpacity>
    </View> */}

    <FlatList
      data={offers}
      renderItem={(item)=>renderItem(item.item,onPress,setShowOfferDetailsModal)}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      />
      </View>}

      <ActionSheet ref={actionRef} onClose={()=>setShowOfferDetailsModal(null)} closeOnTouchBack={true} containerStyle={{backgroundColor:C.surface,minHeight:'45%'}}>
        {
          showOfferDetailsModal && <View>
              <View style={{flexDirection:'column',justifyContent:'space-between',alignItems:'left',borderTopWidth:1,borderTopColor:C.border,paddingVertical:24,paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:C.border}}>
                  <Text style={{color:C.text,fontSize:14,fontWeight:'600'}}>{showOfferDetailsModal.code}</Text>
                  <Text style={{color:C.textSecondary,fontSize:12,fontWeight:'400'}}>Valid Upto {formatDate(showOfferDetailsModal.validTo)}</Text>
              </View>

              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderTopWidth:1,borderTopColor:C.border,paddingVertical:12,paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:C.border}}>
                  <Text style={{color:C.text,fontSize:12,fontWeight:'400'}}>Offer Details</Text>
                  <Text style={{color:C.text,fontSize:12,fontWeight:'400'}}>{showOfferDetailsModal.description}</Text>

              </View>
          </View>
        }
      </ActionSheet>
    </View>
  );
}

const SkeletonItem = () => {
    const fadeAnim1 = useRef(new Animated.Value(0.3)).current;
    const fadeAnim2 = useRef(new Animated.Value(0.2)).current;
    const fadeAnim3 = useRef(new Animated.Value(0.1)).current;
    
    useEffect(() => {
        const animate = (fadeAnim) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: fadeAnim === fadeAnim1 ? 0.3 : fadeAnim === fadeAnim2 ? 0.2 : 0.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        animate(fadeAnim1).start();
        animate(fadeAnim2).start();
        animate(fadeAnim3).start();
    }, [fadeAnim1, fadeAnim2, fadeAnim3]);

    const renderSkeleton = (fadeAnim) => (
        <View style={{ borderBottomWidth:0, borderBottomColor:C.border, paddingVertical:0, marginHorizontal:16, overflow: 'hidden', backgroundColor:C.surface, marginVertical:12, borderRadius:12 }}>
            <View style={{ flexDirection: 'column' }}>
                <View style={{ flexDirection: 'column', justifyContent: 'flex-start', padding:12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor:'#EDBF3125', padding:6, borderRadius:6, marginBottom:4, alignSelf:'flex-start' }}>
                            <Animated.View style={{ backgroundColor: C.surfaceHighest, height: 16, width: 16, borderRadius: 8, opacity: fadeAnim }} />
                            <Animated.View style={{ backgroundColor: C.surfaceHighest, height: 11, width: 100, marginLeft: 4, borderRadius: 4, opacity: fadeAnim }} />
                        </View>
                        <Animated.View style={{ backgroundColor: C.surfaceHighest, height: 20, width: 20, borderRadius: 10, opacity: fadeAnim }} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginTop: 8 }}>
                        <View style={{ flexDirection: 'column', justifyContent: 'space-between', marginRight: 12 }}>
                            <Animated.View style={{ backgroundColor: C.surfaceHighest, padding: 6, borderRadius: 40, height: 68, width: 68, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', opacity: fadeAnim }} />
                        </View>
                        <View style={{ flexDirection: 'column', justifyContent: 'space-between' }}>
                            <Animated.View style={{ backgroundColor: C.surfaceHighest, height: 14, width: 100, borderRadius: 4, opacity: fadeAnim }} />
                            <Animated.View style={{ backgroundColor: C.surfaceHighest, height: 12, width: 150, marginTop: 4, borderRadius: 4, opacity: fadeAnim }} />
                            <Animated.View style={{ backgroundColor: C.surfaceHighest, height: 12, width: 200, marginTop: 4, borderRadius: 4, opacity: fadeAnim }} />
                        </View>
                    </View>
                </View>
                <View style={{ backgroundColor: '#EDBF3125', padding: 20, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', borderTop: 4, marginTop: 12, marginBottom: 0 }}>
                    <Animated.View style={{ backgroundColor: C.surfaceHighest, height: 12, width: 100, borderRadius: 4, opacity: fadeAnim }} />
                </View>
            </View>
        </View>
    );

    return (
        <>
            {renderSkeleton(fadeAnim1)}
            {renderSkeleton(fadeAnim2)}
            {renderSkeleton(fadeAnim3)}
        </>
    );
};


const renderItem = (item,onPress,setShowOfferDetailsModal ) => {
    console.log(item);
    return (
      <View>
        <TouchableOpacity style={{ borderBottomWidth:0,borderBottomColor:C.border, paddingVertical:0, overflow: 'hidden',backgroundColor:C.surface ,marginVertical:8,borderRadius:12}}>
          <View style={{ flexDirection: 'column' }}>
            <View style={{ flexDirection: 'column', justifyContent: 'flex-start',padding:12}}>
            {/* <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                    <View style={{flexDirection:'row',alignItems:'center',backgroundColor:'#EDBF3125',padding:6,borderRadius:6,marginBottom:4,alignSelf:'flex-start'}}>
                        <Ionicons name="time-outline" size={16} color={'#a3a3a3'} />
                        <Text style={{ color: '#c3c3c3', fontSize: 11, fontWeight: '500',marginLeft:4,textTransform:'capitalize' }}>{formatExpiryDateandTime(item.validTo)}</Text>
                    </View>
                    <View>
                        <TouchableOpacity onPress={()=>setShowOfferDetailsModal(item)} style={{paddingVertical:0,flexDirection:'row',alignItems:'center'}}>
                            <Icon name="info-outline" size={20} color={'#c3c3c3'} />
                        </TouchableOpacity>
                    </View>
                </View> */}
                <View style={{flexDirection:'row',justifyContent:'flex-start',alignItems:'center',marginTop:0}}> 
                    <View style={{flexDirection:'column',justifyContent:'space-between',marginRight:12}}>
                        <View style={{backgroundColor:C.primary,padding:6,borderRadius:8,height:68,width:68,justifyContent:'center',alignItems:'center',alignSelf:'center'}}>
                            <Text style={{color:C.onPrimary,fontSize:18,fontWeight:'800',textTransform:'uppercase', textAlign:'center'}}>{parseInt(item.discountValue)}%</Text>
                            <Text style={{color:C.onPrimary,fontSize:10,fontWeight:'600',textTransform:'uppercase', textAlign:'center'}}>OFF</Text>
                        </View>
                    </View>

                    <View style={{flexDirection:'column',justifyContent:'space-between'}}>
                            <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{item.code}</Text>
                            <Text style={{ color: C.primaryText, fontSize: 12, fontWeight: '300' }}>Save {`\u20B9`}{item.offerAmount} with this offer</Text>
                            <Text numberOfLines={2} style={{color:C.textSecondary,fontSize:12,fontWeight:'400'}}>{item.description}</Text>
                    </View>
                </View>
            </View>
              {/* <TouchableOpacity style={{backgroundColor:'#EDBF3125',padding:16,paddingHorizontal:12,justifyContent:'center',alignItems:'center',flexDirection:'row',borderTop:4,marginTop:12,marginBottom:0}}>
                <Text style={{color:BRAND_COLOR,fontSize:12,fontWeight:'600',textTransform:'uppercase'}}>Apply Offer</Text>
              </TouchableOpacity> */}
          </View>
        </TouchableOpacity>
      </View>
    );
  };


const styles = themedStyleSheet(C => ({
  container: {
    flex: 1,
  //   flexDirection:'column',
  //   alignContent:'flex-start',
  //   justifyContent:'flex-start',
    backgroundColor: C.background
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingTop:16,
    marginVertical:0,
    verticalAlign:'top',
  //   backgroundColor:'#151515',
    paddingVertical:0,
  //   backgroundColor:'#151515'
  },

  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  //   padding: ,
  borderRadius:5,
  paddingVertical:2,
  paddingHorizontal:12,
    marginHorizontal:16,
    backgroundColor: '#1C1C1EAA',
  },

  input: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    fontSize:12,
    color:C.text,
    textTransform:'uppercase',
    //   backgroundColor: '#2C2C2E',
  },

  applyButton: {
      padding: 12,
      paddingHorizontal:16,
      // marginRight:12,
    borderRadius: 8,
    backgroundColor: C.surface,
  },

  applyButtonText: {
    color: C.text,
    fontSize:12,
    fontWeight:'600',
    textTransform:'uppercase',
  },

  vehicleItem: {
    flexDirection: 'column',
    marginBottom: 16,
    backgroundColor: C.surface,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },

  vehicleImage: {
    borderRadius: 12,
    width: '100%',
    height: 180,
  },

  vehicleInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },

  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
    marginBottom: 4,
  },

  vehicleYear: {
    fontSize: 16,
    color: C.primaryText,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
  },

  headerText: {
    color: C.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },

  listHeader: {
    color: C.textTertiary,
    fontSize: 12,
    marginTop:12,
    textAlign:'center',
    textTransform:'uppercase',
    fontWeight: '700',
  //   marginBottom: 16,
  }
}));
  

