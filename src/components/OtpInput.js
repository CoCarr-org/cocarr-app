import React, { useRef } from 'react';
import { View, TextInput } from 'react-native';

import { C, themedStyleSheet } from '../theme';

const OtpInput = ({ length = 6, value = '', onChange }) => {
  const inputRefs = useRef([]);

  const handleChange = (text, index) => {
    const newValue = value.split('');
    newValue[index] = text;
    const newOtp = newValue.join('');
    onChange(newOtp);

    // Move to next input if value entered
    if (text && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace') {
      // Clear current input and move to previous
      const newValue = value.split('');
      
      if (index > 0) {
        // If there's a previous input, clear it and move focus there
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        inputRefs.current[index - 1].focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(length)].map((_, index) => (
        <TextInput
          key={index}
          ref={ref => inputRefs.current[index] = ref}
          style={styles.input}
          value={value[index] || ''}
          onChangeText={text => handleChange(text, index)}
          onKeyPress={e => handleKeyPress(e, index)}
          keyboardType="numeric"
          maxLength={1}
          selectTextOnFocus
          placeholderTextColor={C.textTertiary}
        />
      ))}
    </View>
  );
};

const styles = themedStyleSheet(C => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18
  },

  input: {
    backgroundColor: C.surface,
    padding: 10,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginHorizontal: 4,
    width: '13%',
    textAlign: 'center',
    color: C.text, 
    fontSize: 18,
    fontWeight: 'bold'
  }
}));

export default OtpInput;
