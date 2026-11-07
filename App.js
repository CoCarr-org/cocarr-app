import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
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
import Toast from 'react-native-toast-message';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HostNavigator } from './src/navigators/HostNavigator';
import { API_URL } from './src/utils/constants';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/ErrorBoundary';

import { C, ThemeProvider, useTheme } from './src/theme';

// Navigation state lives outside the tree so a light/dark switch (which
// remounts everything under ThemeProvider) returns the user to the same screen
// instead of the first tab.
let savedNavState;

function RootNavigator() {
  const [initializing, setInitializing] = useState(false);
  const { isAuthenticated, userRole } = useSelector((state) => state.auth);
  const navigationRef = useRef(null);

  // Single source of truth for tearing down an invalid session: drop the
  // Firebase session, clear the Redux auth state (which flips the shell back to
  // AuthNavigator) and strip the default Authorization header so no stale token
  // rides along on the next request. Safe to call more than once.
  function forceLogout() {
    auth().signOut().catch(() => {});
    store.dispatch(logout());
    delete axios.defaults.headers.common['Authorization'];
  }

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
      // Firebase reports no user, but Redux may still be marked authenticated
      // from a persisted session — e.g. the token was revoked, the account was
      // disabled, or the session expired and was cleared on another device.
      // Without this the app would keep rendering the authenticated shell with
      // no valid token, and every request would 401 forever. Log out so the
      // user lands back on the login flow.
      if (store.getState().auth.isAuthenticated) {
        forceLogout();
      }
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
            let retryCount = error.config?.__retryCount || 0;
            if (retryCount < 2) {
              error.config.__retryCount = retryCount + 1;
              try {
                console.log('Refreshing Firebase token...');
                // getIdToken(true) forces a refresh; it throws if the token /
                // account is no longer valid (revoked, disabled, deleted).
                const newToken = await currentUser.getIdToken(true);
                store.dispatch(updateToken({ token: newToken }));
                axios.defaults.headers.common['Authorization'] = `${newToken}`;

                // Retry request with the refreshed token. Callers pass the
                // token explicitly per-request (from Redux), so overwrite the
                // config header too or the retry re-sends the stale one.
                error.config.headers['Authorization'] = `${newToken}`;
                return axios(error.config);
              } catch (refreshError) {
                console.log('Token refresh failed, logging out user');
              }
            }
            // A live Firebase user still returning 401 after two refreshes:
            // the token can't be salvaged, so end the session.
            forceLogout();
          } else if (store.getState().auth.isAuthenticated) {
            // No Firebase user at all but Redux still thinks we're signed in:
            // the session is gone (revoked/expired/cleared). There's nothing to
            // refresh, so log out straight away instead of looping on 401s.
            forceLogout();
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

  const { colors, scheme } = useTheme();
  // React Navigation paints its own card/background colours; without this the
  // stack shows a white flash between screens in dark mode and a black one in light.
  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  if (initializing) return <ActivityIndicator size="large" color={C.primaryText} />;

  return (
    <NavigationContainer ref={navigationRef}
      theme={navTheme}
      initialState={savedNavState}
      onStateChange={(state) => { savedNavState = state; }}
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
        <PersistGate loading={<ActivityIndicator size="large" color={C.primaryText} />} persistor={persistor}>
          <ThemeProvider>
            <ErrorBoundary>
              <RootNavigator />
            </ErrorBoundary>
            <Toast config={toastConfig} />
          </ThemeProvider>
        </PersistGate>
      </SafeAreaProvider>
    </Provider>
  );
}

// Toasts: a surface card with a coloured accent bar and icon, so they read in
// both modes and the message text is never white-on-green (~2.4:1).
const ToastCard = ({ text1, text2, accent, icon }) => (
  <View
    accessibilityRole="alert"
    style={{
      width: '92%', flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border,
      paddingVertical: 12, paddingHorizontal: 14,
      borderLeftWidth: 4, borderLeftColor: accent,
      shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    }}
  >
    <Ionicons name={icon} size={20} color={accent} />
    <View style={{ flex: 1 }}>
      {!!text1 && <Text style={{ color: C.text, fontSize: 14, fontWeight: '600' }}>{text1}</Text>}
      {!!text2 && <Text style={{ color: C.textSecondary, fontSize: 13, marginTop: 2 }}>{text2}</Text>}
    </View>
  </View>
);

const toastConfig = {
  success: (props) => <ToastCard {...props} accent={C.success} icon="checkmark-circle" />,
  error: (props) => <ToastCard {...props} accent={C.danger} icon="alert-circle" />,
  info: (props) => <ToastCard {...props} accent={C.primaryText} icon="information-circle" />,
};
