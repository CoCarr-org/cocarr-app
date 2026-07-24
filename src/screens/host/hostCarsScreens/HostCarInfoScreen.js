import React, { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, FlatList, StyleSheet, Image, ActivityIndicator, Platform, TouchableOpacity, ScrollView, Linking, ToastAndroid, Alert, Dimensions, Switch, KeyboardAvoidingView } from 'react-native';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../../utils/constants';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { convertToUnixTimestamp, formatDate, UnauthAxios, photoUrl, notify } from '../../../utils/utils';
import ActionSheet from 'react-native-actions-sheet';
import RazorpayCheckout from 'react-native-razorpay';
import CustomText from '../../../components/CustomText';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';
import { TextInput } from 'react-native-gesture-handler';
import { launchImageLibrary } from 'react-native-image-picker';
import Select from '../../../components/Select';

export function HostCarInfoScreen({route}) {
  const insets = useSafeAreaInsets();
  const { vehicleId } = route.params;
  const navigation = useNavigation();
  const [vehicle, setVehicle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vehicleSummary, setVehicleSummary] = useState(null);
  const actionRef = useRef(null);



  useEffect(() => {
    fetchVehicle();
  }, []);




  const fetchVehicle = async () => {
    try {
      const response = await axios.get(`${API_URL}/host/vehicles/${vehicleId}`);
      setVehicle(response.data);
      setLoading(false);
    } catch (err) {
      console.log('error',err.message)
      setLoading(false);
      setError('Error fetching vehicles');
    }
  };




  const stripHtml = (html) => {
    return html.replace(/<[^>]*>?/g, '');
  }




  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {!loading ? <View style={{flex:1}}>
      <HeaderBlock vehicle={vehicle} navigation={navigation} />
    <View style={{flex:1}}>

      <TabViewInfo vehicle={vehicle}/>
      </View>
      </View> : <ActivityIndicator size="large" color="#EDBF31" /> }
    </View>
  );
}


const HeaderBlock = ({vehicle,navigation}) => {
  return (
    <View style={styles.headerBlock}>
      <View style={styles.headerBlockLeft}>
          <TouchableOpacity style={{padding:4,paddingLeft:0}} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color="#a3a3a3" />
        </TouchableOpacity>
        <View>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#a3a3a3',fontSize:9,letterSpacing:.15,textTransform:'uppercase'}}>{vehicle.brand?.name}</CustomText>
          <CustomText fontType='primary' weight='SemiBold' style={{color:'#a3a3a3',fontSize:11,letterSpacing:.15,textTransform:'uppercase'}}>{vehicle.vehicleName}</CustomText>
        </View>
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
            source={{uri: photoUrl(vehicle.images[0].url)}}
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



// Availability for this car — mirrors the web detail page's Availability
// section. Lists the car's schedule windows and links into the existing
// CreateSchedule / ScheduleInfo screens.
const Availability = ({ vehicle }) => {
  const navigation = useNavigation();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/host/schedule?vehicleId=${vehicle.id}&sort=startTime&offset=0&limit=50`);
      setSchedules(res.data?.schedules || res.data?.data || []);
    } catch (error) {
      console.log('Error fetching schedules:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reload on focus so a newly created schedule shows up on return.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    load();
    return unsubscribe;
  }, [navigation, vehicle?.id]);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {/* Scheduling only opens up once the car has been approved by admin. */}
      {vehicle.isAdminApproved ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateSchedule', { vehicleId: vehicle.id })}
          style={{ backgroundColor: '#EDBF3135', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 16 }}
        >
          <CustomText fontType='primary' weight='Bold' style={{ color: BRAND_COLOR, fontSize: 11, textTransform: 'uppercase', letterSpacing: -0.15 }}>
            + Add Schedule
          </CustomText>
        </TouchableOpacity>
      ) : (
        <View style={{ backgroundColor: '#1c1c1e', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#2c2c2e' }}>
          <CustomText fontType='primary' weight='Medium' style={{ color: '#757575', fontSize: 12, textAlign: 'center' }}>
            Scheduling unlocks once this car is approved.
          </CustomText>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size='small' color={BRAND_COLOR} />
      ) : schedules.length === 0 ? (
        <CustomText fontType='primary' weight='Regular' style={{ color: '#757575', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
          No availability windows set for this car yet.
        </CustomText>
      ) : (
        schedules.map((s) => {
          const past = new Date(s.endTime).getTime() < Date.now();
          const blocked = (s.scheduleBlocks || []).filter((b) => !b.deleted).length;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => navigation.navigate('ScheduleInfo', { scheduleId: s.id })}
              style={{ backgroundColor: '#1c1c1e', borderRadius: 10, padding: 14, marginBottom: 10, opacity: past ? 0.55 : 1, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <CustomText fontType='primary' weight='Medium' style={{ color: '#e3e3e3', fontSize: 13, marginBottom: 3 }}>
                  {formatDate(s.startTime)} → {formatDate(s.endTime)}
                </CustomText>
                <CustomText fontType='primary' weight='Regular' style={{ color: '#757575', fontSize: 11, textTransform: 'capitalize' }}>
                  {s.status}{blocked > 0 ? ` · ${blocked} blocked` : ''}{past ? ' · ended' : ''}
                </CustomText>
              </View>
              <Icon name='chevron-forward' size={16} color='#757575' />
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
};

const TabViewInfo = ({vehicle}) => {

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'info', title: 'Info' },
    { key: 'images', title: 'Images' },
    // { key: 'plan', title: 'Pricing Plan' },
    { key: 'preferences', title: 'Preferences' },
    { key: 'schedule', title: 'Availability' }
  ]);

  const renderScene = SceneMap({
    info: ()=><Info vehicle={vehicle}/>,
    images: ()=><Images vehicle={vehicle}/>,
    // plan: ()=><PricingPlan vehicle={vehicle}/>,
    preferences: ()=><Preferences vehicle={vehicle}/>,
    schedule: ()=><Availability vehicle={vehicle}/>
  });

  const renderTabBar = (props) => {
    return (
      <TabBar
      {...props}
      style={{backgroundColor:'#000',marginBottom:0,paddingVertical:16,paddingHorizontal:0}}
      indicatorStyle={{backgroundColor:BRAND_COLOR,height:0}}
      labelStyle={{color:'#fff',fontSize:8,fontWeight:'500',textTransform:'uppercase',letterSpacing:.15}}
      activeColor='#fff'
      renderTabBarItem={props => {
        const active = props.navigationState.routes[props.navigationState.index].key === props.route.key ? true : false;
          return (
            <TouchableOpacity activeOpacity={0.8} onPress={() => setIndex(routes.findIndex(r => r.key === props.route.key))} style={{paddingVertical:8,paddingHorizontal:18,backgroundColor:!active ? '#1c1c1e' : '#EDBF313A',marginRight:12,borderRadius:24,marginLeft:props.route.key === 'overview' ? 16 : 0,marginLeft:props.route.key === 'info' ? 16 : 0}}>
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                  <Text style={{color:active ? BRAND_COLOR : '#757575',fontSize:10,fontWeight:'600',textTransform:'uppercase',letterSpacing:.15}}>{props.route.title}</Text>
              </View>
            </TouchableOpacity>
          )
        }}
        inactiveColor='#757575'
      />
    )
  }
  return (
   <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      overdrag={true}
      style={{backgroundColor:'#000',flex:1}}
      renderTabBar={(props)=>renderTabBar(props)}
    />
  ) 
}




const Images = ({ vehicle }) => { 
  const [edit, setEdit] = useState(false);
  const [images, setImages] = useState(vehicle.images);

  const handleSubmit = async () => {
    try {
      const response = await axios.put(`${API_URL}/host/vehicles/${vehicle.id}`, { type: 'images', images: images });
      setEdit(false);
      notify('Images updated successfully');
    } catch (error) {
      console.error('Error submitting images:', error);
      notify('Error submitting images');
    }
  };

  const getSignedUrl = async (fileName, fileType) => {
    try {
      const response = await axios.get(`${API_URL}/image/url`, {
        params: { fileName, fileType }
      });

      const formData = new FormData();
      Object.entries(response.data.fields).forEach(([field, value]) => {
        formData.append(field, value);
      });
      formData.append('acl', 'public-read');
      formData.append('file', {
        uri: fileName,
        type: fileType,
        name: fileName,
      });

      await UnauthAxios().post(response.data.url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return response.data.url + response.data.fields.key;
    } catch (error) {
      console.error('Error getting signed URL or uploading:', error.response ? error.response.data : error.message);
      notify('Error getting signed URL or uploading');
      return null;
    }
  };


  const selectImages = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 0 }, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const newImages = await Promise.all(
          response.assets.map(async (asset, index) => {
            const uploadedUrl = await getSignedUrl(asset.uri, asset.type);
            return {
              ...asset,
              url: uploadedUrl,
              isCover: images.length === 0 || !images.some(img => img.isCover),
            };
          })
        );
        setImages((prevImages) => [
          ...prevImages,
          ...newImages.filter((img) => img.url),
        ]);
      }
    });
  };

  const removeImage = (id) => {
    setImages((prevImages) => {
      const imageToRemove = prevImages.find(i => i.id === id);
      const updatedImages = prevImages.filter(i => i.id !== id);

      if (imageToRemove.isCover && updatedImages.length > 0) {
        updatedImages[0].isCover = true;
      }

      return updatedImages;
    });
  }

  return (
    <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 }}>
      <View style={{ flex: 1, rowGap: 12, columnGap: '2%', flexWrap: 'wrap', flexDirection: 'row' }}>
        {images && images.length > 0 && images.map((image, index) => (
          <View key={index} style={{ width: '48%', height: 120, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
            {image.isCover && (
              <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: BRAND_COLOR, justifyContent: 'center', alignItems: 'center', zIndex: 1000, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 }}>
                <CustomText fontType='primary' weight='SemiBold' style={{ color: '#000', fontSize: 9, textTransform: 'uppercase', letterSpacing: .15 }}>Cover Image</CustomText>
              </View>
            )}
            {edit && (
              <TouchableOpacity onPress={() => removeImage(image.id)} style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'red', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 ,zIndex:1000}}>
                <Icon name="trash-outline" size={16} color="#fff" />
              </TouchableOpacity>
            )}
            {edit && !image.isCover && (
              <TouchableOpacity onPress={() => setImages(images.map(i => ({ ...i, isCover: i.id === image.id })))} style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#EDBF31', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, zIndex: 1000 }}>
                <CustomText fontType='primary' weight='SemiBold' style={{ color: '#000', fontSize: 9, textTransform: 'uppercase', letterSpacing: .15 }}>Set as Cover</CustomText>
              </TouchableOpacity>
            )}
            <Image source={{ uri: photoUrl(image.url) }} resizeMode='cover' style={{ width: '100%', height: '100%', borderRadius: 4 }} />
          </View>
        ))}
        {edit && (
          <TouchableOpacity onPress={selectImages} style={{ width: '48%', height: 120, borderRadius: 8, overflow: 'hidden', position: 'relative', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1c1c1e', borderWidth: 1, borderColor: '#757575', borderStyle: 'dashed' }}>
            <Icon name="add-circle-outline" size={24} color="#757575" />
            <CustomText fontType='primary' weight='Bold' style={{ color: '#757575', fontSize: 10, textTransform: 'uppercase', letterSpacing: -0.15, textAlign: 'center', marginTop: 4 }}>Add Images</CustomText>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity onPress={() => edit ? handleSubmit() : setEdit(true)} style={{backgroundColor:'#EDBF3135',borderRadius:5,paddingVertical:16,paddingHorizontal:12,color:'#fff',fontSize:14,width:'100%',justifyContent:'center',alignItems:'center',marginTop:20}}>
        <CustomText fontType='primary' weight='Bold' style={{ color: BRAND_COLOR, fontSize: 11, textTransform: 'uppercase', letterSpacing: -0.15, textAlign: 'center' }}>{edit ? 'Save Images' : 'Edit Images'}</CustomText>
      </TouchableOpacity>
    </View>
  );
};

const Preferences = ({vehicle}) => {
  const preferences = [
    { value: 'midnightBooking', name: 'Allow Midnight Booking',description:'Allow booking from 12am to 6am for this car to allow pickup at night' },
    { value: 'selfPickup', name: 'Allow Self Pickup',description:'Allow self pickup by the customer from the pickup point' },
    { value: 'deliverAvailable', name: 'Delivery Available',description:'Allow delivery of the car to the customer' },
  ];

  const [edit,setEdit] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState(vehicle.vehiclePreference);

  const handleUpdatePreferences = async () => {
    try {
      const response = await axios.put(`${API_URL}/host/vehicles/${vehicle.id}`, {type:'preference',preferences:selectedPreferences});
      setEdit(false);
      notify('Preferences updated successfully');
    } catch (error) {
      console.error('Error submitting preferences:', error);
      notify('Error submitting preferences');
    }
  }

  const togglePreference = (id) => {
    setSelectedPreferences((prev) => {
      const updatedPreferences = { ...prev };
      updatedPreferences[id] = !updatedPreferences[id];
      return updatedPreferences;
    });
  };

  useEffect(() => {
    console.log('selectedPreferences',selectedPreferences)
  }, [selectedPreferences]);

  return (
    <View style={{flex:1,paddingHorizontal:16,paddingBottom:16,justifyContent:'space-between'}}>
      <View>

           {preferences.map((preference) => (
             <View key={preference.value} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical:16 ,borderBottomWidth:1,borderBottomColor:'#1c1c1e',width:'100%'}}>
          <View style={{flexDirection:'column',justifyContent:'center',alignItems:'flex-start',flex:1}}>
            <CustomText fontType='primary' weight='Medium' style={{color:'#e3e3e3', fontSize:14,letterSpacing:.15,marginBottom:2}}>{preference.name}</CustomText>
            <CustomText fontType='primary' weight='Regular' style={{color:'#757575', fontSize:12,letterSpacing:.15}}>{preference.description}</CustomText>
          </View>
          <View style={{flexDirection:'column',justifyContent:'center',alignItems:'flex-end',paddingLeft:16}}>
            <Switch
              disabled={!edit}
              key={preference.value}
              value={selectedPreferences ? selectedPreferences[preference.value] : false}
              style={{height:40}}
              shouldRasterizeIOS={true}
              thumbColor={!edit ? '#454545' : BRAND_COLOR}
              trackColor={{ true: edit ? '#EDBF3155' : '#252525', false: edit ? '#EDBF3155' : '#252525' }}
              onValueChange={() => togglePreference(preference.value)}
              />
          </View>
        </View>
      ))}
      </View>
      <TouchableOpacity onPress={() => edit ? handleUpdatePreferences() : setEdit(!edit)} style={{backgroundColor:'#EDBF3135',borderRadius:5,paddingVertical:16,paddingHorizontal:12,color:'#fff',fontSize:14,width:'100%',justifyContent:'center',alignItems:'center',marginTop:20}}>
        <CustomText fontType='primary' weight='Bold' style={{color:BRAND_COLOR,fontSize:12,textTransform:'uppercase',letterSpacing:-0.15,textAlign:'center'}}>{edit ? 'Save Preferences' : 'Edit Preferences'}</CustomText>
      </TouchableOpacity>
    </View>
  )
}


const Info = ({vehicle}) => {
  const [show,setShow] = useState(false);
  const info = [
    // Titles double as React keys below, so every entry must be distinct —
    // Fuel Type / Seats / Year were each listed twice, which is what produced
    // the "two children with the same key" warning.
    {title:'Owner Name',value:vehicle.ownerName},
    {title:'Maker',value:vehicle.vehicleMaker},
    {title:'Model',value:vehicle.model},
    {title:'Name',value:vehicle.vehicleName},
    {title:'Year',value:vehicle.vehicleYear},
    {title:'Color',value:vehicle.vehicleColor},
    {title:'Fuel Type',value:vehicle.vehicleFuelType},
    {title:'Seats',value:vehicle.vehicleSeats},
    {title:'Transmission',value:vehicle.vehicleTransmission},
    {title:'City',value:vehicle.pickupPoint?.city?.name},
    {title:'Pickup Point',value: vehicle.pickupPoint ? `https://www.google.com/maps/search/?api=1&query=${vehicle.pickupPoint.lat},${vehicle.pickupPoint.long}` : ''},
    {title:'Status',value:vehicle.status},
  ]
  return (
    <View style={{flex:1}}>
          <View style={{paddingHorizontal:16}}>
        
            <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',rowGap:24}}>

                {info.map((item,index)=>(
                  <View key={item.title || index} style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                      <View>
                        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>{item.title}</CustomText>
                        {item.title !== 'Pickup Point' ? <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3',fontSize:14,textTransform:'capitalize'}}>{item.value}</CustomText> : <TouchableOpacity onPress={() => Linking.openURL(item.value)}><CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3',fontSize:14,textTransform:'capitalize',textDecorationLine:'underline'}}>Open Map</CustomText></TouchableOpacity>}
                      </View>
                  </View>
                ))}
            </View>
        </View>
      {/* <TouchableOpacity onPress={() => setShow(true)} style={{backgroundColor:BRAND_COLOR,borderRadius:8,paddingVertical:16,paddingHorizontal:12,color:'#000',fontSize:14,width:'100%',marginTop:20}}>
        <CustomText fontType='primary' weight='Bold' style={{color:'#000',fontSize:12,textTransform:'uppercase',letterSpacing:-0.15,textAlign:'center'}}>Edit Info</CustomText>
      </TouchableOpacity> */}
      {/* <UpdateInfo vehicle={vehicle} show={show} setShow={setShow}/> */}
    </View>
  )
}


const UpdateInfo = ({ vehicle,show,setShow }) => {
  const [info,setInfo] = useState({vehicleNumber:vehicle.vehicleNumber,cityId:vehicle.cityId,brandId:vehicle.brandId,model:vehicle.model,vehicleName:vehicle.vehicleName});
  const [selectedBrand,setSelectedBrand] = useState(vehicle.brandId);
  const [selectedCity,setSelectedCity] = useState(vehicle.cityId);
  const [brands, setBrands] = useState([]);
  const [cities, setCities] = useState([]);
  const sheetRef = useRef(null);
  const handleChange = (key,value) => {
    if(key === 'brandId'){
      setSelectedBrand(value);
    }
    else if(key === 'cityId'){
      setSelectedCity(value);
    }
    setInfo({...info, [key]:value});
  }

  useEffect(() => {
    if(show){
      sheetRef.current.show();
    }
    else{
      sheetRef.current.hide();
    }
  }, [show]);

  async function getBrands() {
      try {
          const response = await axios.get(API_URL+'/brand');
          setBrands(response.data);
          setSelectedBrand(response.data.find(brand => brand.id === vehicle.brandId));
      } catch (error) {
          console.error('Error fetching brands:', error);
          return [];
      }
  }
 
  async function getCities() {
      try {
          const response = await axios.get(API_URL+'/city');
          setCities(response.data);
          setSelectedCity(response.data.find(city => city.id === vehicle.cityId));
      } catch (error) {
          console.error('Error fetching cities:', error);
          return [];
      }
  }

  useEffect(() => {
      getBrands();
      getCities();
  }, []);

  const handleSubmit = async () => {
    try 
    {
      const response = await axios.put(`${API_URL}/host/vehicles/${vehicle.id}`, {type:'info',data:info});
      setShow(false);
      notify('Info updated successfully');
    } catch (error) {

      console.error('Error submitting car details:', error);
      notify('Error submitting car details');
    }
  }
          
return (<ActionSheet containerStyle={{backgroundColor:'#000',minHeight:'50%'}}
  isModal={true}
  ref={sheetRef}
  isVisible={show}
  onClose={() => setShow(false)}
  defaultOverlayOpacity={0.75}>
  

  <View>
    <View>
      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>City</CustomText>
      <Select options={cities} selected={selectedCity} label='name' onSelect={(option) => handleChange('cityId', option.id)} />
    </View>

    <View style={{marginTop:20}}>
      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Vehicle Brand</CustomText>
      <Select options={brands} selected={selectedBrand} label='name' onSelect={(option) => handleChange('brandId', option.id)} />
    </View>

    <View style={{flexDirection:'column',justifyContent:'space-between',width:'100%',marginTop:20}}>
      <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Vehicle Name</CustomText>
      <TextInput placeholder='Enter model' style={{backgroundColor:'#1c1c1e',borderRadius:5,paddingVertical:9,paddingHorizontal:12,color:'#fff',fontSize:14}} value={info.model} onChangeText={(text) => handleChange('model', text)} />
    </View>

  </View>

  <View style={{flexDirection:'column',justifyContent:'space-between',width:'100%',marginTop:20}}>
    <TouchableOpacity onPress={handleSubmit} style={{backgroundColor:BRAND_COLOR,borderRadius:5,paddingVertical:12,paddingHorizontal:12,color:'#fff',fontSize:14}}>
      <CustomText fontType='primary' weight='Bold' style={{color:'#000', fontSize:12,textTransform:'uppercase',letterSpacing:-.15,textAlign:'center'}}>Save Info</CustomText>
    </TouchableOpacity>
  </View>
</ActionSheet>)
}

const PricingPlan = ({vehicle}) => {
  
  const [show,setShow] = useState(false);
  return (
    <View style={{flex:1,paddingHorizontal:16,justifyContent:'space-between',paddingBottom:20}}>
          <View>
        
            {vehicle.vehiclePlan[0] ? <View style={{marginTop:28,flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',rowGap:24}}>

                  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                      <View>
                        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Km Alloted</CustomText>
                        <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3',fontSize:13,textTransform:'capitalize'}}>{vehicle.vehiclePlan[0] && vehicle.vehiclePlan[0].kmAlloted ? vehicle.vehiclePlan[0].kmAlloted : '0'} Kms/Hour</CustomText>
                      </View>
                  </View>
                  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                      <View>
                        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Extra KM Fee</CustomText>
                        <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3',fontSize:13,textTransform:'capitalize'}}>{vehicle.vehiclePlan[0] && vehicle.vehiclePlan[0].extraKmFee ? vehicle.vehiclePlan[0].extraKmFee : '0'} /Km</CustomText>
                      </View>
                  </View>
                  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                      <View>
                        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Weekday Fee</CustomText>
                        <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3',fontSize:13,textTransform:'capitalize'}}>{vehicle.vehiclePlan[0] && vehicle.vehiclePlan[0].weekdayFee ? vehicle.vehiclePlan[0].weekdayFee : '0'} /Hour</CustomText>
                      </View>
                  </View>
                  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-start',width:'50%'}}>
                      <View>
                        <CustomText fontType='primary' weight='SemiBold' style={{color:'#757575',fontSize:10,textTransform:'uppercase',letterSpacing:.15}}>Weekend Fee</CustomText>
                        <CustomText fontType='primary' weight='Regular' style={{color:'#e3e3e3',fontSize:13,textTransform:'capitalize'}}>{vehicle.vehiclePlan[0] && vehicle.vehiclePlan[0].weekendFee ? vehicle.vehiclePlan[0].weekendFee : '0'} /Hour</CustomText>
                      </View>
                  </View>
            </View> : <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
              <CustomText fontType='primary' weight='SemiBold' style={{color:'#fff', fontSize:11,textTransform:'uppercase',letterSpacing:.15,marginBottom:4}}>Pricing Plan Not Added</CustomText>
            </View>}  
        </View>
        {vehicle.vehiclePlan[0] ? <UpdatePlan vehicle={vehicle} show={show} setShow={setShow}/> : null}
    </View>
  )
}

const UpdatePlan = ({vehicle,show,setShow }) => {

  const sheetRef = useRef(null);
  const [plan,setPlan] = useState({kmAlloted:vehicle.vehiclePlan[0].kmAlloted.toString(),perHourFee:vehicle.vehiclePlan[0].perHourFee.toString(),weekdayFee:vehicle.vehiclePlan[0].weekdayFee.toString(),weekendFee:vehicle.vehiclePlan[0].weekendFee.toString()});

  const handleClose = () => {
    setShow(false);
  }

  useEffect(() => {
    if(show){
      sheetRef.current.show();
    }
    else{
      sheetRef.current.hide();
    }
  }, [show]);

  const handleSubmit = async () => {
    try {
      const response = await axios.put(`${API_URL}/host/vehicles/${vehicle.id}`, {type:'pricingPlan',vehiclePlan:plan});
      setShow(false);
      notify('Pricing updated successfully');
    } catch (error) {
      console.error('Error submitting pricing:', error.message);
      notify('Error submitting pricing');
    }
  }

  const isPlanUnchanged = () => {
    return plan.kmAlloted === vehicle.vehiclePlan[0].kmAlloted.toString() &&
           plan.extraKmFee === vehicle.vehiclePlan[0].extraKmFee.toString() &&
           plan.weekdayFee === vehicle.vehiclePlan[0].weekdayFee.toString() &&
           plan.weekendFee === vehicle.vehiclePlan[0].weekendFee.toString();
  };

  const isPlanInvalid = () => {
    return plan.kmAlloted === '' || plan.extraKmFee === '' || 
           plan.weekdayFee === '' || plan.weekendFee === '' || 
           plan.kmAlloted <= 0 || plan.extraKmFee <= 0 || 
           plan.weekdayFee <= 0 || plan.weekendFee <= 0;
  };

  return <ActionSheet containerStyle={{backgroundColor:'#000',minHeight:'50%'}}
  isModal={true}
  ref={sheetRef}

  isVisible={true}
  onClose={handleClose}
  defaultOverlayOpacity={0.75}>
    <View style={{justifyContent:'space-between',paddingHorizontal:16,zIndex:1000,paddingVertical:24}}>
    <View>
      <CustomText fontType='primary' weight='Bold' style={{ color: '#959595', fontSize: 11, letterSpacing: .15, marginBottom: 4,textTransform:'uppercase'}}>Alloted KMs</CustomText>
      <TextInput
        style={{ backgroundColor: '#1c1c1e', color: '#e3e3e3', padding: 10, borderRadius: 8, marginBottom: 16 }}
        placeholder="Enter alloted km"
        placeholderTextColor="#757575"
        keyboardType="numeric"
        value={plan.kmAlloted}
        onChangeText={(value) => {
          const numericValue = value.replace(/[^0-9]/g, '');
          setPlan({...plan,kmAlloted:numericValue});
        }}
      />
      <CustomText fontType='primary' weight='Bold' style={{ color: '#959595', fontSize: 11, letterSpacing: .15, marginBottom: 4,textTransform:'uppercase'}}>Extra KM Fee</CustomText>
      <TextInput
        style={{ backgroundColor: '#1c1c1e', color: '#e3e3e3', padding: 10, borderRadius: 8, marginBottom: 16 }}
        placeholder="Enter extra km fee"
        placeholderTextColor="#757575"
        keyboardType="numeric"
        value={plan.extraKmFee}
        onChangeText={(value) => {
          const numericValue = value.replace(/[^0-9]/g, '');
          setPlan({...plan,extraKmFee:numericValue});
        }}
      />
      <CustomText fontType='primary' weight='Bold' style={{ color: '#959595', fontSize: 11, letterSpacing: .15, marginBottom: 4,textTransform:'uppercase'}}>Weekday Fee (per hour)</CustomText>
      <TextInput
        style={{ backgroundColor: '#1c1c1e', color: '#e3e3e3', padding: 10, borderRadius: 8, marginBottom: 16 }}
        placeholder="Enter weekday pricing"
        placeholderTextColor="#757575"
        keyboardType="numeric"
        value={plan.weekdayFee}
        onChangeText={(value) => {
          const numericValue = value.replace(/[^0-9]/g, '');
          setPlan({...plan,weekdayFee:numericValue});
        }}
      />
      <CustomText fontType='primary' weight='Bold' style={{ color: '#959595', fontSize: 11, letterSpacing: .15, marginBottom: 4,textTransform:'uppercase'}}>Weekend Fee (per hour)</CustomText>
      <TextInput
        style={{ backgroundColor: '#1c1c1e', color: '#e3e3e3', padding: 10, borderRadius: 8, marginBottom: 16 }}
        placeholder="Enter weekend pricing"
        placeholderTextColor="#757575"
        keyboardType="numeric"
        value={plan.weekendFee}
        onChangeText={(value) => {
          const numericValue = value.replace(/[^0-9]/g, '');
          setPlan({...plan,weekendFee:numericValue});
        }}
      />
      </View>


      <TouchableOpacity 
        disabled={isPlanUnchanged() || isPlanInvalid()} 
        onPress={handleSubmit} 
        style={{ 
          backgroundColor: isPlanUnchanged() ? '#454545' : BRAND_COLOR, 
          borderRadius: 8, 
          paddingVertical: 16, 
          paddingHorizontal: 12, 
          color: '#fff', 
          fontSize: 14, 
          width: '100%', 
          marginTop: 20 
        }}
      >
        <CustomText 
          fontType='primary' 
          weight='Bold' 
          style={{ 
            color: '#000', 
            fontSize: 12, 
            textTransform: 'uppercase', 
            letterSpacing: -0.15, 
            textAlign: 'center' 
          }}
        >
          Update Pricing Plan
        </CustomText>
      </TouchableOpacity>
    </View>
  </ActionSheet>
};


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
    color: '#EDBF31',
    fontSize: 12,
    fontWeight: '500',
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
