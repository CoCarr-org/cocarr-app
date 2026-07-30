import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Image, 
  Linking,
  TouchableHighlight
} from 'react-native';
import axios from 'axios';
import { API_URL, BRAND_COLOR } from '../../utils/constants';
import { useDispatch } from 'react-redux';
import { login } from '../../store/authSlice';
import CustomText from '../../components/CustomText';

export function MobileInputScreen({ navigation }) {
  const [mobileNumber, setMobileNumber] = useState('');
  const dispatch = useDispatch();
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);
  // Only offer the referral-code entry when the referral programme is actually
  // running (an active campaign exists). Public endpoint — no account yet.
  const [referralAvailable, setReferralAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    axios.get(`${API_URL}/referral/status`)
      .then((res) => { if (active) setReferralAvailable(!!res.data?.programActive); })
      .catch(() => { if (active) setReferralAvailable(false); });
    return () => { active = false; };
  }, []);

  const handleSubmit = async () => {
    if (mobileNumber.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a 10-digit mobile number.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_URL}/user/send-otp`, { mobile: `${mobileNumber}` });
      console.log('response',response.data)
      let data = {mobileNumber}
      if(referralCode){
        data.referralCode = referralCode
      }
      navigation.navigate('OTP', data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending OTP:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleChange = (text) => {
    // Remove any non-numeric characters
    const cleanedText = text.replace(/[^0-9]/g, '');
    setMobileNumber(cleanedText);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.topContainer}>
          {/* Logo */}
          <Image 
            source={require('../../images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Title */}
          <Text style={styles.title}>Login with Mobile Number</Text>
          
          {/* Subtitle */}
          <Text style={styles.subtitle}>Please enter your mobile number to proceed.</Text>
          
          {/* Mobile Number Input with +91 Prefix */}
          <View>

          <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
            <View style={styles.prefixContainer}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={[styles.input]}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              value={mobileNumber}
              onChangeText={handleChange}
              placeholder=""
              keyboardType="number-pad"
              placeholderTextColor="#808080"
              maxLength={10} // Limit input to 10 digits
              />
          </View>
        </View>
        {referralAvailable && (
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:12,paddingHorizontal:0}}>
            {
              showReferralInput ? <TextInput maxLength={6} placeholderTextColor='#454545' style={styles.referralInput} value={referralCode} onChangeText={(text) => setReferralCode(text)} placeholder='REFERRAL CODE' /> : <CustomText style={{color:'#a3a3a3',fontSize:11,fontWeight:'700',letterSpacing:-.05,textDecorationLine:'underline'}} onPress={() => setShowReferralInput(true)}>HAVE A REFERRAL CODE?</CustomText>
            }
          </View>
        )}
        <View>
              <Text style={styles.noticeText}>
                By submitting, you agree to our{' '}
                <Text style={styles.linkText} onPress={() => Linking.openURL('https://cocarr.com/terms-and-conditions')}>
                  Terms and Conditions
                </Text>
                {' '}and{' '}
                <Text style={styles.linkText} onPress={() => Linking.openURL('https://cocarr.com/privacy-policy')}>
                  Privacy Policy
                </Text>
                .
              </Text>
        </View>
        </View>
        
        {/* Send OTP Button */}
        <View style={styles.bottomContainer}>
        <TouchableHighlight underlayColor='#b38f1f' style={{...styles.button,backgroundColor:mobileNumber.length !== 10 || isLoading ? '#454545' : '#EDBF31'}} disabled={mobileNumber.length !== 10 || isLoading} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Send OTP</Text>
        </TouchableHighlight>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000', // Maintain dark background
  },
  container: {
    flex: 1,
    backgroundColor: '#000',                // Dark background for contrast
    padding: 24,
    paddingVertical: 12,
    justifyContent: 'space-between',         // Space between top container and button
  },
  logo: {
    height: 40,
    width: 80,
    marginBottom: 48,
  },
  topContainer: {
    flex: 1,
    // justifyContent: 'center',
  },
  bottomContainer:{
    // paddingBottom:24
  },
  title: {
    fontSize: 14,                           // Larger font size for prominence
    fontWeight: '500',                      // Semi-bold text
    color: '#efefef',                          // White color for readability
    marginBottom: 2,                        // Space below the title
  },
  subtitle: {
    fontSize: 12,                           // Smaller than title
    color: '#959595',                       // Light gray for subtitle
    marginBottom: 24,                       // Space below the subtitle
  },
  inputContainer: {
    flexDirection: 'row',                   // Align prefix and input horizontally
    alignItems: 'center',                   // Center vertically
    borderColor: '#252525',                 // Dark border color
    borderWidth: 1,                         // Border thickness
    borderRadius: 6,                        // Rounded corners
    backgroundColor: '#151515',             // Dark background for input
    paddingHorizontal: 14,                  // Horizontal padding inside container
  },
  inputFocused: {
    flexDirection: 'row',                   // Align prefix and input horizontally
    alignItems: 'center',                   // Center vertically
    borderColor: '#EDBF3135',                 // Dark border color
    borderWidth: 1,                         // Border thickness
    borderRadius: 8,                        // Rounded corners
    backgroundColor: '#1a1a1a',             // Dark background for input
    paddingHorizontal: 14,                  // Horizontal padding inside container
  },
  prefixContainer: {
    justifyContent: 'center',               // Center vertically
    alignItems: 'center',                   // Center horizontally
    paddingRight: 10,                       // Space between prefix and input
  },
  prefixText: {
    color: '#efefef',                       // Gold color for prefix
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    flex: 1,                                // Take up the remaining space
    height: 50,                             // Comfortable height for input
    color: '#efefef',                          // White text color
    fontSize: 14,
    letterSpacing:.5,
    paddingVertical:12,
    paddingLeft:12,
    fontWeight: '500',
    borderLeftWidth:1,
    borderLeftColor:'#252525',
  },
  referralInput: {
    flex: 1,                                // Take up the remaining space
    height: 42,                             // Comfortable height for input
    color: '#e3e3e3',                          // White text color
    fontSize: 12,
    textTransform:'uppercase',
    letterSpacing:.5,
    width:'100%',
    maxWidth:120,
    paddingVertical:12,
    paddingLeft:12,
    fontWeight: '500',
      backgroundColor:'#1c1c1c',
      borderRadius:6,
  },
  button: {
    // backgroundColor: '#EDBF31',             // Gold background
    paddingVertical: 14,                    // Vertical padding for button
    borderRadius: 7,     
    letterSpacing:-.35,                   // Rounded corners
    alignItems: 'center',                   // Center the text
  },
  buttonText: {
    color: '#000',                          // Black text for contrast
    fontSize: 13,                           // Readable font size
    fontWeight: '600',  
    textTransform:'uppercase'                    // Semi-bold text
  },
  noticeText: {
    marginTop:12,
    paddingHorizontal:2,
    lineHeight:18,
    letterSpacing:-.25,
    color: '#959595',                          // Black text for contrast
    fontSize: 12,                           // Readable font size
    fontWeight: '400',                      // Semi-bold text
},
linkText:{
    color: '#EDBF31',                          // Black text for contrast
    
  }
});
