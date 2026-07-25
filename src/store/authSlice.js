import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  uid:null,
        isAuthenticated:false,
        fcmToken:null,
        token:false,
        userName:null,
        isPremium:false,
        contactNumber:null,
        profilePhoto:null,
        email:null,
        licenseVerified:false,
        kycVerified:false,
        walletPoints:0,
        // Which shell the app renders. A device-local preference — the person
        // chooses it with the mode switcher.
        userRole:'customer', // customer or host
        // Whether this account is actually registered as a host. Owned by the
        // server (/host/check), never chosen by the user. Kept separate from
        // userRole because they answer different questions: "may I host?" vs
        // "am I looking at the host app right now?". Conflating the two is what
        // made the old flow bounce people between shells.
        isHost:false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      console.log('action.payload', action.payload)
      console.log('login', state)
      return {...state,
                uid:action.payload.uid,
                isAuthenticated:true,
                token:action.payload.user?.token,
                userName:action.payload.user?.userName,
                fcmToken:action.payload.user?.fcmToken,
                contactNumber:action.payload.user?.contactNumber,
                isPremium:action.payload.user?.isPremium,
                email:action.payload.user?.email,
                profilePhoto:action.payload.user?.profilePhoto,
                licenseVerified:action.payload.user?.licenseVerified,
                kycVerified:action.payload.user?.kycVerified,
                walletPoints:action.payload.user?.walletPoints,
                // The OTP login payload carries no userRole, so reading it
                // straight off the payload used to overwrite the value with
                // `undefined` on every single login. Fall back to the current
                // value, then to the 'customer' default.
                userRole:action.payload.user?.userRole || state.userRole || 'customer',
                isHost:action.payload.user?.isHost ?? state.isHost ?? false,
      }
    },
    updateFcmToken: (state, action) => {
      return {...state,
                fcmToken:action.payload.fcmToken
      }
    },
    updateUserRole: (state, action) => {
      return {...state,
                userRole:action.payload.userRole
      }
    },
    // Result of GET /host/check. If the account is not a host, the host shell
    // must not be reachable, so drop back to customer mode in the same action —
    // otherwise a persisted userRole:'host' would render a shell the account
    // has no data for.
    setHostStatus: (state, action) => {
      const isHost = !!action.payload.isHost;
      return {...state,
                isHost,
                userRole: isHost ? state.userRole : 'customer'
      }
    },
    updateWalletPoints: (state, action) => {
      console.log('updateWalletPoints', action.payload);
      return {...state,
                walletPoints:action.payload.walletPoints
      }
    },
    updateProfile: (state, action) => {
      console.log('updateProfile', action.payload);
      return {...state,
                userName:action.payload.userName ? action.payload.userName : state.userName,
                email:action.payload.email ? action.payload.email : state.email,
                profilePhoto:action.payload.profilePhoto ? action.payload.profilePhoto : state.profilePhoto
      }
    },
    updateToken: (state, action) => {
      console.log('updateToken', action.payload.token);
      return {...state,
                token:action.payload.token
      }
    },
    // Reset to initialState rather than listing fields by hand: the old version
    // omitted userRole (and isHost), so signing out as a host left the flag
    // persisted and the next account to sign in on the device booted straight
    // into the host shell.
    logout: () => ({ ...initialState }),
  },
});

export const { login, logout, updateToken,updateProfile,updateWalletPoints,updateUserRole,updateFcmToken,setHostStatus } = authSlice.actions;
export default authSlice.reducer;
