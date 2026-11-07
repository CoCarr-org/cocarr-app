import { createSlice } from '@reduxjs/toolkit';

// `appearance` replaces the old `theme: 'dark'`, which no screen ever read or
// set. A new key (rather than reusing `theme`) means devices that persisted the
// old default come up following the system setting instead of being pinned to
// dark by a value the user never chose.
const initialState = {
  appearance: 'system', // 'system' | 'light' | 'dark'
  language: 'en',
  notifications: true,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setAppearance: (state, action) => {
      state.appearance = ['system', 'light', 'dark'].includes(action.payload) ? action.payload : 'system';
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    toggleNotifications: (state) => {
      state.notifications = !state.notifications;
    },
  },
});

export const { setAppearance, setLanguage, toggleNotifications } = preferencesSlice.actions;
export default preferencesSlice.reducer;
