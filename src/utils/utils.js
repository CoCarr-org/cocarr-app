import moment from "moment";
import { request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { Platform, ToastAndroid, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import Toast from "react-native-toast-message";
import axios from "axios";
import { API_URL } from "./constants";


// Uploaded images live in a private bucket, so linking straight to the bucket
// URL returns 403. Route those through the API's image proxy (GET /image/:key).
// Local picker URIs and other hosts are returned untouched.
// ToastAndroid is Android-only — calling it on iOS throws
// "ToastAndroid is not supported on this platform". Use this everywhere
// instead: a toast on Android, a lightweight alert on iOS.
export const notify = (message) => {
  if (!message) return;
  const text = String(message);
  if (Platform.OS === 'android') ToastAndroid.show(text, ToastAndroid.SHORT);
  else Alert.alert('', text);
};

// Object keys are UUIDs. Older uploads were stored as `<endpoint>/<bucket><uuid>`
// (the presigned URL has no trailing slash), so using the whole path as the key
// 404s. Prefer the trailing UUID when one is present.
// Keys are `<folder>/<uuid>` (kyc, pan, license, vehicle-rc, vehicle, profile,
// ride, misc) for anything uploaded since folders were introduced, and a bare
// `<uuid>` for everything before that — those rows were never migrated, so both
// forms must keep resolving. The folder list mirrors storageFolders.js on the
// backend; adding one there means adding it here, or the prefix gets stripped
// and the proxy 404s.
const STORAGE_FOLDERS = ['kyc', 'pan', 'license', 'vehicle-rc', 'vehicle', 'profile', 'ride', 'misc'];
const UUID_SRC = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const FOLDER_RE = new RegExp(`(?:^|/)(${STORAGE_FOLDERS.join('|')})/(${UUID_SRC})`, 'i');
const UUID_RE = new RegExp(UUID_SRC, 'gi');

const extractKey = (path) => {
  const clean = String(path || '').replace(/^\/+/, '').split('?')[0];
  const foldered = clean.match(FOLDER_RE);
  if (foldered) return `${foldered[1].toLowerCase()}/${foldered[2]}`;
  const found = clean.match(UUID_RE);
  return found ? found[found.length - 1] : clean;
};

export const photoUrl = (value) => {
  if (!value || typeof value !== 'string') return value;
  if (/^(file|content|ph|assets-library|data):/i.test(value)) return value;
  // Already proxied — but the key may still be the malformed bucket+uuid form.
  if (value.startsWith(`${API_URL}/image/`)) {
    return `${API_URL}/image/${extractKey(value.split('/image/')[1])}`;
  }
  if (/^https?:\/\//i.test(value)) {
    const match = value.match(/^https?:\/\/([^/]+)\/(.+)$/);
    // Private bucket (Tigris/storageapi.dev), OR an already-proxied
    // `/image/:key` URL built against a DIFFERENT host — web/app/admin each
    // have their own fallback API base URL and they don't all agree, and a
    // value from a server-side getter (e.g. User.profilePhoto) is proxied
    // against *the backend's* configured public URL, which may not match
    // this client's own. Rebuild against our own API_URL either way.
    if (match && (match[1].endsWith('storageapi.dev') || match[2].includes('image/'))) {
      return `${API_URL}/image/${extractKey(match[2])}`;
    }
    return value;
  }
  return `${API_URL}/image/${extractKey(value)}`;
};

export const UnauthAxios = () => {
  const instance = axios.create();
  instance.interceptors.request.use(config => {
    delete config.headers['Authorization'];
    return config;
  });
  return instance;
};


// Uploads an image-picker asset via the backend's presigned POST and returns
// the API proxy URL for it.
//
// `folder` sorts the object in the bucket — see storageFolders.js on the
// backend, which is authoritative; an unknown value silently lands in `misc`.
//
// The returned value is built from `fields.key`, NOT `url + key`: `url` is the
// bucket endpoint with no trailing slash, so concatenating produces a
// malformed link. That bug cost several screens their uploaded images before
// this was centralised — every capture screen had its own copy of this
// function, and they did not all get fixed together.
export const uploadImage = async (asset, folder) => {
  const { data } = await axios.get(`${API_URL}/image/url`, {
    params: { fileName: asset.fileName, fileType: asset.type, folder },
  });

  const formData = new FormData();
  Object.entries(data.fields).forEach(([field, value]) => formData.append(field, value));
  formData.append('acl', 'public-read');
  formData.append('file', { uri: asset.uri, type: asset.type, name: asset.fileName });

  // Straight to storage, unauthenticated — sending our Firebase token to the
  // bucket would be rejected and leaks a credential to a third party.
  await UnauthAxios().post(data.url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 20000,
  });

  return `${API_URL}/image/${data.fields.key}`;
};

export const formatDate = (dateTime, type = 'short') => {
  if (!dateTime) return '';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = new Date(dateTime);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = date.getMinutes().toString().padStart(2, '0');

  if (type === 'short') {
    const roundedMinutes = Math.round(date.getMinutes() / 30) * 30;
    const formattedRoundedMinutes = roundedMinutes === 60 ? '00' : roundedMinutes.toString().padStart(2, '0');
    const adjustedHours = (roundedMinutes === 60 ? (formattedHours % 12) + 1 : formattedHours).toString().padStart(2, '0');
    return `${day} ${month} ${adjustedHours}:${formattedRoundedMinutes} ${ampm}`;
  }
  return `${day} ${month} ${year} ${formattedHours}:${formattedMinutes} ${ampm}`;
};

export const formatDateOnly = (dateTime, type = 'short') => {
  if (!dateTime) return '';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const date = new Date(dateTime);
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  if (type === 'short') {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${year}`;
};



// When the permission is already blocked, the OS won't show the prompt again.
// Pass openSettingsIfBlocked=true (i.e. the user tapped the locate icon) to
// send them to Settings so they can enable it and try again.
export const getCurrentLocation = async (openSettingsIfBlocked = false) => {
  try {
    let permission;
    if (Platform.OS === 'ios') {
      permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
    } else if (Platform.OS === 'android') {
      permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
    }

    const result = await request(permission);

    if (result === RESULTS.BLOCKED) {
      if (openSettingsIfBlocked) {
        openSettings().catch(() => {});
      }
      throw new Error('Location permission blocked');
    }

    if (result !== RESULTS.GRANTED) {
      throw new Error('Location permission not granted');
    }



    const getCurrentPosition = () => {
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve({ latitude, longitude });
          },
          (error) => {
            reject(new Error(`Error getting location: ${error.message}`));
          }
        );
      });
    };

    const position = await getCurrentPosition();
    return position;
  } catch (error) {
    throw new Error(`Error handling location permission: ${error.message}`);
  }
};


// Camera permission, asked for explicitly.
//
// launchCamera asks for it implicitly and reports a refusal as an errorCode,
// which is fine for "did it open?" but useless for "ask again": once the OS has
// a stored refusal it never re-prompts, and the picker just fails identically
// every time. This distinguishes the two cases, so a screen that REQUIRES the
// camera — the onboarding selfie — can prompt when prompting will work and send
// the user to Settings when it won't.
//
// Returns 'granted' | 'denied' | 'blocked' | 'unavailable'. Never throws:
// a permission check that explodes would be a worse failure than the refusal
// it is reporting.
export const requestCameraPermission = async (openSettingsIfBlocked = false) => {
  try {
    const permission = Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA;

    const result = await request(permission);

    if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) return 'granted';
    if (result === RESULTS.BLOCKED) {
      // The OS will not prompt again — Settings is the only remedy left.
      if (openSettingsIfBlocked) openSettings().catch(() => {});
      return 'blocked';
    }
    if (result === RESULTS.UNAVAILABLE) return 'unavailable';
    return 'denied';
  } catch (error) {
    console.warn('[camera] permission check failed:', error?.message);
    return 'denied';
  }
};

export const showToast = (type, text1, text2) => {
  Toast.show({
    type: type,
    text1: text1,
    text2: text2,
    position: 'top',
    swipeable: true,
    visibilityTime: 3000,
    contentContainerStyle: {
      padding: 4,
    },
    text1Style: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    text2Style: {
      color: 'white',
      fontSize: 14,
    },
  });
}


export function addHoursToDate(date, hours) {
  // Ensure date is a Moment object
  const momentDate = moment(date);

  // Add hours to the date
  const newDate = momentDate.add(hours, 'hours');

  // Return the new date
  return newDate.format();
}



export const formatTime = (dateTime, type = 'short') => {
  if (!dateTime) return '';
  
  const date = new Date(dateTime);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  
  if (type === 'short') {
    return `${formattedHours}${ampm}`;
  }
  return `${formattedHours}:${minutes.toString().padStart(2, '0')}${ampm}`;
};



export function convertToUnixTimestamp(dateObject) {
  const unixTimestamp = Math.floor(dateObject.getTime() / 1000);
  return unixTimestamp;
}



export function formatExpiryDateandTime(dateTime) {
  const now = new Date();
  const expiryDate = new Date(dateTime);
  const diffInMs = expiryDate - now;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays > 1) {
    return `Expires in ${diffInDays} days`;
  } else if (diffInDays === 1) {
    return 'Expires tomorrow';
  } else if (diffInHours >= 1) {
    return `Expires in ${diffInHours} hours`;
  } else if (diffInMins >= 1) {
    return `Expires in ${diffInMins} mins`;
  } else {
    return 'Expires soon';
  }
}