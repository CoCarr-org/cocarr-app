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

  const refresh = () => fetchVehicle();

  const fetchVehicle = async () => {
    try {
      const response = await axios.get(`${API_URL}/host/vehicles/${vehicleId}`);
      setVehicle(response.data);
      // Put the car's name in the nav header once it's known.
      const name = [response.data?.brand?.name, response.data?.vehicleName].filter(Boolean).join(' ');
      if (name) navigation.setOptions({ title: name });
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
    // Nav header (back + title) is provided by the stack now — no manual top
    // inset, which is what caused the content to sit under the status bar.
    <View style={styles.container}>
      {!loading ? <View style={{flex:1}}>
      <HeaderBlock vehicle={vehicle} />
    <View style={{flex:1}}>

      <TabViewInfo vehicle={vehicle} onChanged={refresh} />
      </View>
      </View> : <ActivityIndicator size="large" color="#EDBF31" /> }
    </View>
  );
}


// Swipeable image carousel with dots.
const ImageCarousel = ({ images }) => {
  const [idx, setIdx] = useState(0);
  const width = Dimensions.get('window').width - 32; // 16px margin each side
  if (!images.length) {
    return (
      <View style={{ height: 200, backgroundColor: '#1c1c1e', borderRadius: 18, marginHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="car-outline" size={40} color="#3a3a40" />
      </View>
    );
  }
  return (
    <View style={{ marginHorizontal: 16 }}>
      <ScrollView
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ borderRadius: 18 }}
      >
        {images.map((im, i) => (
          <Image key={im.id || i} source={{ uri: photoUrl(im.url) }} style={{ width, height: 200, backgroundColor: '#1c1c1e' }} resizeMode="cover" />
        ))}
      </ScrollView>
      {images.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {images.map((_, i) => (
            <View key={i} style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === idx ? BRAND_COLOR : '#3a3a40' }} />
          ))}
        </View>
      )}
    </View>
  );
};

// Fresh hero: image carousel, then name, rating, status badge, plate and specs.
const HeaderBlock = ({vehicle}) => {
  const imgs = (vehicle.images || []).filter((i) => !i.isDeleted);
  const status = vehicle.isDraft ? { label: 'Not Completed', bg: '#26262a', bd: '#3a3a40', fg: '#b9b9c2', dot: '#b9b9c2' }
    : vehicle.isAdminApproved ? { label: 'Live', bg: '#3fce8f22', bd: '#3fce8f59', fg: '#6ee6b0', dot: '#6ee6b0' }
    : { label: 'Pending Approval', bg: '#EDBF3122', bd: '#EDBF3166', fg: BRAND_COLOR, dot: BRAND_COLOR };
  const rating = Number(vehicle.rating || 0);

  const chips = [
    vehicle.vehicleFuelType && { icon: 'water-outline', text: vehicle.vehicleFuelType },
    vehicle.vehicleSeats && { icon: 'people-outline', text: `${vehicle.vehicleSeats} seats` },
    vehicle.vehicleTransmission && { icon: 'cog-outline', text: vehicle.vehicleTransmission },
    vehicle.vehicleYear && { icon: 'calendar-outline', text: String(vehicle.vehicleYear) },
  ].filter(Boolean);

  return (
    <View style={{ paddingTop: 12 }}>
      <ImageCarousel images={imgs} />

      <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: status.bg, borderWidth: 1, borderColor: status.bd, borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 }}>
            <View style={{ width: 5, height: 5, borderRadius: 5, backgroundColor: status.dot }} />
            <CustomText fontType='primary' weight='Bold' style={{ color: status.fg, fontSize: 9, letterSpacing: .15 }}>{status.label}</CustomText>
          </View>
          <CustomText fontType='primary' weight='Medium' style={{ color: '#8a8a8a', fontSize: 12 }}>{vehicle.vehicleNumber}</CustomText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <CustomText fontType='primary' weight='Bold' numberOfLines={1} style={{ color: '#f0f0f2', fontSize: 20, letterSpacing: -.4, flex: 1, marginRight: 12 }}>{vehicle.brand?.name} {vehicle.vehicleName}</CustomText>
          {/* Average rating */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#141416', borderWidth: 1, borderColor: '#232327', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 9 }}>
            <Icon name="star" size={13} color={BRAND_COLOR} />
            <CustomText fontType='primary' weight='Bold' style={{ color: '#e8e8ea', fontSize: 12 }}>{rating > 0 ? rating.toFixed(1) : 'New'}</CustomText>
            {vehicle.totalReviews > 0 && <CustomText fontType='primary' weight='Regular' style={{ color: '#8a8a8a', fontSize: 11 }}>({vehicle.totalReviews})</CustomText>}
          </View>
        </View>

        {chips.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {chips.map((c) => (
              <View key={c.text} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#141416', borderWidth: 1, borderColor: '#232327', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 }}>
                <Icon name={c.icon} size={13} color={BRAND_COLOR} />
                <CustomText fontType='primary' weight='Medium' style={{ color: '#c3c3c3', fontSize: 11, textTransform: 'capitalize' }}>{c.text}</CustomText>
              </View>
            ))}
          </View>
        )}
      </View>
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

const TabViewInfo = ({vehicle, onChanged}) => {

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'info', title: 'Info' },
    { key: 'pickup', title: 'Pickup' },
    { key: 'images', title: 'Images' },
    { key: 'preferences', title: 'Preferences' },
    { key: 'schedule', title: 'Availability' },
    { key: 'damages', title: 'Damages' },
  ]);

  // A switch (not SceneMap) so scenes can receive the onChanged refresh handler.
  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'info': return <Info vehicle={vehicle} />;
      case 'pickup': return <PickupSection vehicle={vehicle} onChanged={onChanged} />;
      case 'images': return <Images vehicle={vehicle} />;
      case 'preferences': return <Preferences vehicle={vehicle} />;
      case 'schedule': return <Availability vehicle={vehicle} />;
      case 'damages': return <Damages vehicle={vehicle} />;
      default: return null;
    }
  };

  // A plain horizontal pill row instead of TabBar's scrollEnabled mode — the
  // latter mis-measures custom items and scrolled off to a huge width and
  // re-scrolled on every selection. This is a simple controlled selector.
  const renderTabBar = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}
      style={{ backgroundColor: '#000', flexGrow: 0 }}>
      {routes.map((r, i) => {
        const active = i === index;
        return (
          <TouchableOpacity key={r.key} activeOpacity={0.8} onPress={() => setIndex(i)}
            style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 24, backgroundColor: active ? '#EDBF313A' : '#1c1c1e' }}>
            <Text style={{ color: active ? BRAND_COLOR : '#757575', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: .15 }}>{r.title}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
  return (
   <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      overdrag={true}
      style={{backgroundColor:'#000',flex:1}}
      renderTabBar={renderTabBar}
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
        params: { fileName, fileType, folder: 'vehicle' }
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
    // Scrollable so a long grid never overlaps the Edit/Save button below it.
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <View style={{ rowGap: 12, columnGap: '2%', flexWrap: 'wrap', flexDirection: 'row' }}>
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
    </ScrollView>
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
    // City + Pickup live in their own Pickup section now.
  ]
  const rows = info.filter((i) => i.value !== null && i.value !== undefined && i.value !== '');

  return (
    <ScrollView style={{flex:1}} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: '#141416', borderRadius: 14, borderWidth: 1, borderColor: '#232327', overflow: 'hidden' }}>
        {rows.map((item, index) => (
          <View key={item.title} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 14, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: '#1f1f23' }}>
            <CustomText fontType='primary' weight='Medium' style={{ color: '#8a8a8a', fontSize: 12 }}>{item.title}</CustomText>
            <CustomText fontType='primary' weight='SemiBold' numberOfLines={1} style={{ color: '#e8e8ea', fontSize: 13, textTransform: 'capitalize', maxWidth: '60%', textAlign: 'right' }}>{String(item.value)}</CustomText>
          </View>
        ))}
      </View>
      <CustomText fontType='primary' weight='Regular' style={{ color: '#5a5a62', fontSize: 11, marginTop: 10, paddingHorizontal: 4 }}>
        These details come from the vehicle RC and can't be edited.
      </CustomText>
    </ScrollView>
  )
}

// Pickup location — its own section, editable (address + map link).
const PickupSection = ({ vehicle, onChanged }) => {
  const pickup = vehicle.pickupPoint || {};
  const [edit, setEdit] = useState(false);
  const [address, setAddress] = useState(pickup.address || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!address.trim()) { notify('Enter a pickup address'); return; }
    try {
      setSaving(true);
      await axios.put(`${API_URL}/host/vehicles/${vehicle.id}`, { type: 'pickup', pickup: { address: address.trim() } });
      notify('Pickup location updated');
      setEdit(false);
      onChanged && onChanged();
    } catch (error) {
      notify(error?.response?.data?.error?.message || 'Could not update pickup location');
    } finally {
      setSaving(false);
    }
  };

  const mapUrl = pickup.lat != null && pickup.long != null
    ? `https://www.google.com/maps/search/?api=1&query=${pickup.lat},${pickup.long}` : null;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      <View style={{ backgroundColor: '#141416', borderRadius: 14, borderWidth: 1, borderColor: '#232327', padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="location-outline" size={16} color={BRAND_COLOR} />
            <CustomText fontType='primary' weight='Bold' style={{ color: '#e8e8ea', fontSize: 13 }}>Pickup location</CustomText>
          </View>
          {!edit && (
            <TouchableOpacity onPress={() => setEdit(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="create-outline" size={14} color={BRAND_COLOR} />
              <CustomText fontType='primary' weight='Bold' style={{ color: BRAND_COLOR, fontSize: 10, textTransform: 'uppercase', letterSpacing: .15 }}>Edit</CustomText>
            </TouchableOpacity>
          )}
        </View>

        <CustomText fontType='primary' weight='SemiBold' style={{ color: '#6f6f76', fontSize: 10, textTransform: 'uppercase', letterSpacing: .3, marginBottom: 4 }}>City</CustomText>
        <CustomText fontType='primary' weight='Medium' style={{ color: '#e3e3e3', fontSize: 13, marginBottom: 14 }}>{pickup.city?.name || '—'}</CustomText>

        <CustomText fontType='primary' weight='SemiBold' style={{ color: '#6f6f76', fontSize: 10, textTransform: 'uppercase', letterSpacing: .3, marginBottom: 4 }}>Address</CustomText>
        {edit ? (
          <TextInput
            value={address} onChangeText={setAddress} multiline placeholder="Pickup address" placeholderTextColor="#5a5a62"
            style={{ backgroundColor: '#1c1c1e', borderRadius: 8, color: '#e3e3e3', fontSize: 13, padding: 12, minHeight: 60, textAlignVertical: 'top' }}
          />
        ) : (
          <CustomText fontType='primary' weight='Medium' style={{ color: '#e3e3e3', fontSize: 13 }}>{pickup.address || '—'}</CustomText>
        )}

        {mapUrl && !edit && (
          <TouchableOpacity onPress={() => Linking.openURL(mapUrl)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
            <Icon name="map-outline" size={15} color={BRAND_COLOR} />
            <CustomText fontType='primary' weight='SemiBold' style={{ color: BRAND_COLOR, fontSize: 12, textDecorationLine: 'underline' }}>Open in maps</CustomText>
          </TouchableOpacity>
        )}

        {edit && (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity onPress={() => { setEdit(false); setAddress(pickup.address || ''); }} style={{ flex: 1, borderRadius: 8, borderWidth: 1, borderColor: '#2c2c2e', paddingVertical: 12, alignItems: 'center' }}>
              <CustomText fontType='primary' weight='Bold' style={{ color: '#c3c3c3', fontSize: 11, textTransform: 'uppercase', letterSpacing: .15 }}>Cancel</CustomText>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={saving} style={{ flex: 1, borderRadius: 8, backgroundColor: BRAND_COLOR, paddingVertical: 12, alignItems: 'center', opacity: saving ? 0.6 : 1 }}>
              <CustomText fontType='primary' weight='Bold' style={{ color: '#000', fontSize: 11, textTransform: 'uppercase', letterSpacing: .15 }}>{saving ? 'Saving…' : 'Save'}</CustomText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// Damages recorded against this car, collected from its bookings.
const Damages = ({ vehicle }) => {
  const [damages, setDamages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    axios.get(`${API_URL}/host/bookings?populate=true&vehicleId=${vehicle.id}&offset=0&limit=100`)
      .then((r) => {
        if (!active) return;
        const list = [];
        for (const b of (r.data?.bookings || r.data?.data || [])) {
          for (const d of (b.damages || [])) list.push({ ...d, bookingId: b.bookingId || b.id });
        }
        setDamages(list);
      })
      .catch((e) => console.log('Damages load error:', e?.response?.data || e?.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [vehicle.id]);

  if (loading) {
    return <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator color={BRAND_COLOR} /></View>;
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
      {damages.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 50 }}>
          <Icon name="shield-checkmark-outline" size={30} color="#3a3a40" style={{ marginBottom: 8 }} />
          <CustomText fontType='primary' weight='Medium' style={{ color: '#757575', fontSize: 13 }}>No damages reported for this car.</CustomText>
        </View>
      ) : (
        damages.map((d, i) => (
          <View key={d.id || i} style={{ backgroundColor: '#141416', borderRadius: 12, borderWidth: 1, borderColor: '#232327', padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="alert-circle-outline" size={16} color="#ef6b6b" />
                <CustomText fontType='primary' weight='Bold' style={{ color: '#e8e8ea', fontSize: 13 }}>{d.amount != null ? `₹${Number(d.amount).toLocaleString('en-IN')}` : 'Damage'}</CustomText>
              </View>
              {d.status ? (
                <View style={{ backgroundColor: '#26262a', borderRadius: 100, paddingVertical: 3, paddingHorizontal: 9 }}>
                  <CustomText fontType='primary' weight='Bold' style={{ color: '#b9b9c2', fontSize: 9, textTransform: 'uppercase', letterSpacing: .3 }}>{d.status}</CustomText>
                </View>
              ) : null}
            </View>
            {d.description ? <CustomText fontType='primary' weight='Regular' style={{ color: '#a3a3a3', fontSize: 12, marginBottom: 4 }}>{d.description}</CustomText> : null}
            <CustomText fontType='primary' weight='Regular' style={{ color: '#6f6f76', fontSize: 11 }}>Booking #{d.bookingId}</CustomText>
          </View>
        ))
      )}
    </ScrollView>
  );
};


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
    // No top padding: the nav header sits above this now, so the old 24px left
    // a dead gap under it.
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
