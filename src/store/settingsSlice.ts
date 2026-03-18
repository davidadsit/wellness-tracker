import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface SettingsState {
  notificationsEnabled: boolean;
  dailyCheckInTime: string;
  theme: 'light' | 'dark' | 'system';
}

const initialState: SettingsState = {
  notificationsEnabled: true,
  dailyCheckInTime: '09:00',
  theme: 'system',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setNotificationsEnabled(state, action: PayloadAction<boolean>) {
      state.notificationsEnabled = action.payload;
    },
    setDailyCheckInTime(state, action: PayloadAction<string>) {
      state.dailyCheckInTime = action.payload;
    },
    setTheme(state, action: PayloadAction<'light' | 'dark' | 'system'>) {
      state.theme = action.payload;
    },
  },
});

export const {setNotificationsEnabled, setDailyCheckInTime, setTheme} =
  settingsSlice.actions;
export default settingsSlice.reducer;
