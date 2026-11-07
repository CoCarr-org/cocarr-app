import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { C } from '../../../theme';

const TermsAndConditionsScreen = () => {
  return (
    <View style={{flex: 1, backgroundColor: C.surfaceLow}}>
      <WebView
        source={{uri: 'https://cocarr.com/terms-and-conditions'}}
        style={{flex: 1}}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </View>
  );
};

export default TermsAndConditionsScreen;
