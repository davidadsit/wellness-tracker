import settingsReducer, {
  setNotificationsEnabled,
  setDailyCheckInTime,
  setTheme,
  SettingsState,
} from '../../src/store/settingsSlice';

const initialState: SettingsState = {
  notificationsEnabled: true,
  dailyCheckInTime: '09:00',
  theme: 'system',
};

describe('settingsSlice', () => {
  it('returns the initial state', () => {
    expect(settingsReducer(undefined, {type: 'unknown'})).toEqual(initialState);
  });

  it('setNotificationsEnabled updates the flag', () => {
    const state = settingsReducer(initialState, setNotificationsEnabled(false));
    expect(state.notificationsEnabled).toBe(false);

    const state2 = settingsReducer(state, setNotificationsEnabled(true));
    expect(state2.notificationsEnabled).toBe(true);
  });

  it('setDailyCheckInTime updates the time', () => {
    const state = settingsReducer(initialState, setDailyCheckInTime('18:00'));
    expect(state.dailyCheckInTime).toBe('18:00');
  });

  it('setTheme updates the theme', () => {
    const state = settingsReducer(initialState, setTheme('dark'));
    expect(state.theme).toBe('dark');

    const state2 = settingsReducer(state, setTheme('light'));
    expect(state2.theme).toBe('light');
  });
});
