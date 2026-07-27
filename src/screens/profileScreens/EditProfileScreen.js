import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ToastAndroid, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../../components/CenterHeader';
import { useNavigation } from '@react-navigation/native';
import CustomText from '../../components/CustomText';
import axios from 'axios';
import { API_URL } from '../../utils/constants';
import { useDispatch } from 'react-redux';
import { updateProfile } from '../../store/authSlice';
import { UnauthAxios, photoUrl } from '../../utils/utils';
export const EditProfileScreen = () => {

  const [info,setInfo] = useState({name:'',email:'',contactNumber:'',profilePhoto:''})
  const [profileImage, setProfileImage] = useState(null);
  const [isProfileChanged, setIsProfileChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch()
  const navigation = useNavigation()

  // ToastAndroid is Android-only — show an alert on iOS instead.
  const notify = (message) => {
    if (Platform.OS === 'android') ToastAndroid.show(message, ToastAndroid.SHORT);
    else Alert.alert('', message);
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const image = response.assets[0];
        setProfileImage({
          uri: image.uri,
          fileName: image.fileName,
          type: image.type
        });
        setIsProfileChanged(true);
      }
    });
  };

  useEffect(()=>{
    async function getProfile(){
      try{
        const response = await axios.get(`${API_URL}/user/profile?populate=true`)
        setInfo(response.data)
        if (response.data.profilePhoto) {
          setProfileImage({
            uri: response.data.profilePhoto
          });
        }
    }catch(error){
        notify('Error fetching user');
      }
    }
    getProfile()
  },[])

  const handleSave = async () => {
    try {
      setSaving(true);
      let profilePhotoUrl = profileImage?.uri;
      
      if (isProfileChanged && profileImage) {
        try {
          let urlRes = await axios.get(`${API_URL}/image/url`, {
            params: { fileName: profileImage.fileName, fileType: profileImage.type, folder: 'profile' }
          });
  
          const formData = new FormData();
          Object.entries(urlRes.data.fields).forEach(([field, value]) => {
            formData.append(field, value);
          });
          formData.append('acl', 'public-read');
          formData.append('file', {
            uri: profileImage.uri,
            type: profileImage.type,
            name: profileImage.fileName,
          });
  
          let res = await UnauthAxios().post(urlRes.data.url, formData, {
            headers: { 
              'Content-Type': 'multipart/form-data'
            },
            timeout: 10000 // 10 second timeout
          });
  
          // `url` is the bucket endpoint with no trailing slash and `key` is a
          // bare UUID, so `url + key` was malformed. Build the API image-proxy
          // URL straight from the key instead.
          profilePhotoUrl = `${API_URL}/image/${urlRes.data.fields.key}`;
        } catch (uploadError) {
          console.error('Error uploading to S3:', uploadError);
          if (uploadError.code === 'ECONNABORTED') {
            notify('Upload timed out. Please try again.');
          } else {
            notify('Error uploading image. Please try again.');
          }
          setSaving(false);
          return;
        }
      }

      let res = await axios.put(`${API_URL}/user/update-profile`, { 
        name: info.name, 
        email: info.email, 
        profilePhoto: profilePhotoUrl 
      });

      setIsProfileChanged(false);
      notify('Profile updated');
      dispatch(updateProfile({
        userName: info.name,
        email: info.email,
        profilePhoto: profilePhotoUrl
      }));
      navigation.goBack();

    } catch (error) {
      console.error('Error updating profile:', error.response);
      notify(error.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title='Edit Profile' navigation={navigation} />
      <ScrollView contentContainerStyle={{flexDirection:'column',marginTop:40}}>

     
      <View style={{flexDirection:'column', alignItems:'center', gap:12, marginBottom:24, paddingHorizontal:24,}}>
          <TouchableOpacity activeOpacity={0.85} onPress={pickImage} style={styles.avatarRing}>
              {profileImage?.uri ? (
                <Image source={{uri: photoUrl(profileImage.uri)}} style={styles.profileImage} />
              ) : (
                <CustomText fontType='primary' weight='Bold' style={styles.avatarInitial}>
                  {(info.name || 'U').charAt(0).toUpperCase()}
                </CustomText>
              )}
              <View style={styles.avatarCam}>
                <Icon name="camera" size={16} color="#000" />
              </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={{marginBottom: 12}}>
            <CustomText fontType='primary' weight='Medium' style={styles.changePhotoText}>
              {profileImage?.uri ? 'Change photo' : 'Add photo'}
            </CustomText>
          </TouchableOpacity>

            <View style={{flexDirection:'column', gap:4, width:'100%'}}>
                <CustomText fontType='primary' weight='Bold' style={{color:'#959595', fontSize:11,letterSpacing:-0.05,textTransform:'uppercase'}}>Name</CustomText>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor="#808080"
                  value={info.name}
                  onChangeText={(text)=>setInfo({...info,name:text})}
                  />
            </View>

          <View style={{flexDirection:'column', gap:4, width:'100%'}}>
              <CustomText fontType='primary' weight='Bold' style={{color:'#454545', fontSize:11,letterSpacing:-0.05,textTransform:'uppercase'}}>Contact Number</CustomText>
              <TextInput
                style={{...styles.input, backgroundColor:'#101010',color:'#454545'}}
                placeholder="Contact Number"
                placeholderTextColor="#808080"
                editable={false}
                value={info.contactNumber}
                onChangeText={(text)=>setInfo({...info,contactNumber:text})}
                keyboardType="number-pad"
                />
          </View>

          <View style={{flexDirection:'column', gap:4, width:'100%'}}>
              <CustomText fontType='primary' weight='Bold' style={{color:'#959595', fontSize:11,letterSpacing:-0.05,textTransform:'uppercase'}}>Email</CustomText>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#808080"
              value={info.email}
              onChangeText={(text)=>setInfo({...info,email:text})}
              keyboardType="email-address"
              />
              </View>
          </View>

          <View style={{paddingHorizontal:24,paddingVertical:24}}>
            <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <CustomText fontType='primary' weight='Bold' style={styles.buttonText}>Save Profile</CustomText>
                )}
            </TouchableOpacity>
          </View>
          </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    // alignItems: 'center',
    // justifyContent: 'space-between',
    // padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  avatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#1c1c1e',
    borderWidth: 2,
    borderColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarInitial: {
    color: '#EDBF31',
    fontSize: 46,
  },
  avatarCam: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDBF31',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  changePhotoText: {
    color: '#EDBF31',
    fontSize: 13,
  },
  profileImage: {
    width: 136,
    height: 136,
    borderRadius: 68,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#808080',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  profileImagePlaceholderText: {
    color: '#fff',
  },
  input: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    color: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#EDBF31',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#000',
    fontSize: 12,
    textTransform:'uppercase',
    letterSpacing:0.05
  },
});
