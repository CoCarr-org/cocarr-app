import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useSelector } from 'react-redux';
import { persistor, store } from './src/store/store';
import { MainNavigator } from './src/navigators/MainNavigator';
import { AuthNavigator } from './src/navigators/AuthNavigator';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import { login, logout, updateToken } from './src/store/authSlice';
import { PersistGate } from 'redux-persist/integration/react';
import { ActivityIndicator, Text, View } from 'react-native';
import axios from 'axios';
import BootSplash from 'react-native-bootsplash';
import Toast, { BaseToast } from 'react-native-toast-message';
import { HostNavigator } from './src/navigators/HostNavigator';
import { API_URL } from './src/utils/constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/ErrorBoundary';

function RootNavigator() {
  const [initializing, setInitializing] = useState(false);
  const { isAuthenticated, userRole } = useSelector((state) => state.auth);
  const navigationRef = useRef(null);

  async function onAuthStateChanged(user) {
    if (user) {
      console.log('User logged in:', user);

      const idToken = await user.getIdToken(true);
      store.dispatch(updateToken({ token: idToken }));
      axios.defaults.headers.common['Authorization'] = `${idToken}`;

      // Register FCM Token
      await registerFCMToken(idToken);
    } else {
      store.dispatch(updateToken({ token: null }));
      delete axios.defaults.headers.common['Authorization'];
    }

    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(async (user) => {
      await BootSplash.hide({ fade: false, duration: 100 });
      onAuthStateChanged(user);
    });
    return subscriber; // Unsubscribe on unmount
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const currentUser = auth().currentUser;
          if (currentUser) {
            let retryCount = error.config.__retryCount || 0;
            if (retryCount < 2) {
              error.config.__retryCount = retryCount + 1;
              try {
                console.log('Refreshing Firebase token...');
                const newToken = await currentUser.getIdToken(true);
                store.dispatch(updateToken({ token: newToken }));
                axios.defaults.headers.common['Authorization'] = `${newToken}`;

                // Retry request with new token
                error.config.headers['Authorization'] = `${newToken}`;
                return axios(error.config);
              } catch (refreshError) {
                console.log('Token refresh failed, logging out user');
              }
            }
            // Logout user after two failed attempts
            auth().signOut();
            store.dispatch(logout());
            delete axios.defaults.headers.common['Authorization'];
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  async function registerFCMToken(idToken) {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        let fcmToken;
        try {
          fcmToken = await messaging().getToken();
        } catch (e) {
          // iOS has no APNs token yet (simulator, or registration still in
          // flight on a cold start). Not fatal — the next launch retries.
          console.log('FCM getToken skipped:', e?.message);
          return;
        }

        if (idToken) {
          await axios.post(
            `${API_URL}/notification/`,
            { token: fcmToken },
            { headers: { Authorization: `${idToken}` } }
          );
        }
      } else {
        console.log('Notification permission not granted');
      }
    } catch (error) {
      // Messaging being unavailable must not raise a red box on launch.
      console.log('FCM token registration skipped:', error?.message);
    }
  }

  useEffect(() => {
    // Foreground notification handling
    const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      console.log("Notification received in foreground:", remoteMessage);
    });

    // Background & Quit state handling
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("Notification caused app to open from background state:", remoteMessage);
      if (remoteMessage.data?.payload?.screen) {
        navigationRef.current?.navigate(remoteMessage.data.payload.screen, { ...remoteMessage.data.payload });
      }
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log("Notification caused app to open from quit state:", remoteMessage);
          if (remoteMessage.data?.payload?.screen) {
            navigationRef.current?.navigate(remoteMessage.data.payload.screen, { ...remoteMessage.data.payload });
          }
        }
      });

    return unsubscribeOnMessage;
  }, []);

  if (initializing) return <ActivityIndicator size="large" color="#EDBF31" />;

  return (
    <NavigationContainer ref={navigationRef}
      linking={{
        prefixes: ['cocarrApp://', 'https://www.cocarr.com'],
        config: {
          screens: {
            MobileInputScreen: 'mobile-input',
          },
        },
      }}
    >
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  persistor.subscribe(() => {
    console.log('Persistor State:', persistor.getState());
  });

  return (
    <Provider store={store}>
      {/* Required by react-native-safe-area-context: useSafeAreaInsets() throws
          without a provider above it, which is what TopBar and AppTabBar use to
          size themselves around the notch and the home indicator. */}
      <SafeAreaProvider>
        <PersistGate loading={<ActivityIndicator size="large" color="#EDBF31" />} persistor={persistor}>
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
          <Toast config={toastConfig} />
        </PersistGate>
      </SafeAreaProvider>
    </Provider>
  );
}

const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftWidth: 0, backgroundColor: 'green', padding: 4, borderRadius: 10, width: '90%' }}
    >
      <Text style={{ color: 'white', fontSize: 14 }}>{props.text1}</Text>
      <Text style={{ color: 'white', fontSize: 12 }}>{props.text2}</Text>
    </BaseToast>
  ),
  error: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftWidth: 0, backgroundColor: '#ef0000', padding: 4, borderRadius: 6, width: '90%' }}
    >
      <Text style={{ color: 'white', fontSize: 14 }}>{props.text1}</Text>
      <Text style={{ color: 'white', fontSize: 12 }}>{props.text2}</Text>
    </BaseToast>
  ),
};
