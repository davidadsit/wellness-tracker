import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {ReminderConfig, ReminderPeriod} from '../types';

export interface SettingsState {
  reminders: {
    morning: ReminderConfig;
    midday: ReminderConfig;
    evening: ReminderConfig;
  };
  theme: 'light' | 'dark' | 'system';
}

const initialState: SettingsState = {
  reminders: {
    morning: {enabled: false, time: '09:00'},
    midday: {enabled: true, time: '13:00'},
    evening: {enabled: false, time: '19:00'},
  },
  theme: 'system',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setReminderEnabled(
      state,
      action: PayloadAction<{period: ReminderPeriod; enabled: boolean}>,
    ) {
      state.reminders[action.payload.period].enabled = action.payload.enabled;
    },
    setReminderTime(
      state,
      action: PayloadAction<{period: ReminderPeriod; time: string}>,
    ) {
      state.reminders[action.payload.period].time = action.payload.time;
    },
    setTheme(state, action: PayloadAction<'light' | 'dark' | 'system'>) {
      state.theme = action.payload;
    },
  },
});

export const {setReminderEnabled, setReminderTime, setTheme} =
  settingsSlice.actions;
export default settingsSlice.reducer;
