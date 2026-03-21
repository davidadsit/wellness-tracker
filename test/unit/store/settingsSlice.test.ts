import settingsReducer, {
  setReminderEnabled,
  setReminderTime,
  setTheme,
  SettingsState,
} from '../../../src/store/settingsSlice';

const initialState: SettingsState = {
  reminders: {
    morning: {enabled: false, time: '09:00'},
    midday: {enabled: true, time: '13:00'},
    evening: {enabled: false, time: '19:00'},
  },
  theme: 'system',
};

describe('settingsSlice', () => {
  it('returns the initial state', () => {
    expect(settingsReducer(undefined, {type: 'unknown'})).toEqual(initialState);
  });

  it('setReminderEnabled enables a reminder', () => {
    const state = settingsReducer(
      initialState,
      setReminderEnabled({period: 'morning', enabled: true}),
    );
    expect(state.reminders.morning.enabled).toBe(true);
  });

  it('setReminderEnabled disables a reminder', () => {
    const state = settingsReducer(
      initialState,
      setReminderEnabled({period: 'midday', enabled: false}),
    );
    expect(state.reminders.midday.enabled).toBe(false);
  });

  it('setReminderTime updates a reminder time', () => {
    const state = settingsReducer(
      initialState,
      setReminderTime({period: 'evening', time: '20:00'}),
    );
    expect(state.reminders.evening.time).toBe('20:00');
  });

  it('setTheme updates the theme', () => {
    const state = settingsReducer(initialState, setTheme('dark'));
    expect(state.theme).toBe('dark');
  });
});
