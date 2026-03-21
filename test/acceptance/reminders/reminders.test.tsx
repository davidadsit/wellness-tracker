import React from 'react';
import {render, fireEvent, waitFor, act} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import notifee from '@notifee/react-native';
import {SettingsScreen} from '../../../src/screens/SettingsScreen';
import {setupTestDatabase} from '../../helpers/database';
import {makeStore} from '../../helpers/renderWithStore';
import {notificationOutcomeRepository} from '../../../src/services/database/notificationOutcomeRepository';
import {registerNotificationHandlers} from '../../../src/services/notifications/notificationHandlers';
import {MMKV} from 'react-native-mmkv';

setupTestDatabase();
registerNotificationHandlers();

const backgroundHandler = (notifee.onBackgroundEvent as jest.Mock).mock
  .calls[0][0] as (event: any) => Promise<void>;

beforeEach(() => {
  new MMKV().clearAll();
  jest.clearAllMocks();
});

function renderScreen(ui: React.ReactElement, store = makeStore()) {
  return {...render(<Provider store={store}>{ui}</Provider>), store};
}

describe('check-in reminders', () => {
  it('user enables morning reminder and it gets scheduled at the configured time', async () => {
    const {getByTestId} = renderScreen(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('morning-reminder-toggle')).toBeTruthy();
    });

    fireEvent(getByTestId('morning-reminder-toggle'), 'valueChange', true);

    await waitFor(() => {
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'check-in-reminder-morning',
          data: expect.objectContaining({
            reminderPeriod: 'morning',
            scheduledTime: '09:00',
          }),
        }),
        expect.objectContaining({
          type: expect.any(Number),
        }),
      );
    });
  });

  it('user changes mid-day reminder time and the notification is rescheduled', async () => {
    const {getByTestId} = renderScreen(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('midday-reminder-time')).toBeTruthy();
    });

    // Mid-day is enabled by default — trigger a time change
    fireEvent.press(getByTestId('midday-reminder-time'));

    await waitFor(() => {
      expect(getByTestId('reminder-time-picker')).toBeTruthy();
    });

    // Simulate selecting 14:00 via the time picker's onChange prop
    const picker = getByTestId('reminder-time-picker');
    const onChangeHandler = picker.props.onChange;
    await act(async () => {
      onChangeHandler({type: 'set'}, new Date(2026, 0, 1, 14, 0));
    });

    await waitFor(() => {
      expect(notifee.cancelNotification).toHaveBeenCalledWith(
        'check-in-reminder-midday',
      );
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'check-in-reminder-midday',
          data: expect.objectContaining({
            reminderPeriod: 'midday',
            scheduledTime: '14:00',
          }),
        }),
        expect.anything(),
      );
    });
  });

  it('user disables evening reminder and it gets cancelled', async () => {
    const store = makeStore({
      settings: {
        reminders: {
          morning: {enabled: false, time: '09:00'},
          midday: {enabled: true, time: '13:00'},
          evening: {enabled: true, time: '19:00'},
        },
        theme: 'system',
      },
    });
    const {getByTestId} = renderScreen(<SettingsScreen />, store);

    await waitFor(() => {
      expect(getByTestId('evening-reminder-toggle')).toBeTruthy();
    });

    fireEvent(getByTestId('evening-reminder-toggle'), 'valueChange', false);

    await waitFor(() => {
      expect(notifee.cancelNotification).toHaveBeenCalledWith(
        'check-in-reminder-evening',
      );
    });
  });

  it('notification sent to the user is recorded with a null outcome', async () => {
    const {getByTestId} = renderScreen(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('morning-reminder-toggle')).toBeTruthy();
    });

    fireEvent(getByTestId('morning-reminder-toggle'), 'valueChange', true);

    await waitFor(() => {
      expect(notifee.createTriggerNotification).toHaveBeenCalled();
    });

    const outcomes = await notificationOutcomeRepository.getRecentByPeriod(
      'morning',
      1,
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0].outcome).toBeNull();
    expect(outcomes[0].reminderPeriod).toBe('morning');
    expect(outcomes[0].scheduledTime).toBe('09:00');
    expect(outcomes[0].respondedAt).toBeNull();
  });

  it('dismissing a check-in notification records a dismissed outcome', async () => {
    // First, schedule a reminder so an outcome record exists
    const {getByTestId} = renderScreen(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('morning-reminder-toggle')).toBeTruthy();
    });

    fireEvent(getByTestId('morning-reminder-toggle'), 'valueChange', true);

    await waitFor(() => {
      expect(notifee.createTriggerNotification).toHaveBeenCalled();
    });

    const outcomes = await notificationOutcomeRepository.getRecentByPeriod(
      'morning',
      1,
    );
    const outcomeId = outcomes[0].id;

    // Simulate the OS dismissal via the background event handler
    await backgroundHandler({
      type: 0, // EventType.DISMISSED
      detail: {
        notification: {
          id: 'check-in-reminder-morning',
          data: {
            type: 'check-in-reminder',
            reminderPeriod: 'morning',
            scheduledTime: '09:00',
            outcomeId,
          },
        },
      },
    });

    const updated = await notificationOutcomeRepository.getRecentByPeriod(
      'morning',
      1,
    );
    expect(updated[0].outcome).toBe('dismissed');
    expect(updated[0].respondedAt).not.toBeNull();
  });

  it('completing a check-in from a notification records an interacted outcome', async () => {
    const {getByTestId} = renderScreen(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('morning-reminder-toggle')).toBeTruthy();
    });

    fireEvent(getByTestId('morning-reminder-toggle'), 'valueChange', true);

    await waitFor(() => {
      expect(notifee.createTriggerNotification).toHaveBeenCalled();
    });

    const outcomes = await notificationOutcomeRepository.getRecentByPeriod(
      'morning',
      1,
    );
    const outcomeId = outcomes[0].id;

    // Simulate user pressing "Check In" action
    await backgroundHandler({
      type: 2, // EventType.ACTION_PRESS
      detail: {
        notification: {
          id: 'check-in-reminder-morning',
          data: {
            type: 'check-in-reminder',
            reminderPeriod: 'morning',
            scheduledTime: '09:00',
            outcomeId,
          },
        },
        pressAction: {id: 'CHECK_IN'},
      },
    });

    const updated = await notificationOutcomeRepository.getRecentByPeriod(
      'morning',
      1,
    );
    expect(updated[0].outcome).toBe('interacted');
    expect(updated[0].respondedAt).not.toBeNull();
  });

  it('ignored notification has null outcome in the database', async () => {
    const {getByTestId} = renderScreen(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('morning-reminder-toggle')).toBeTruthy();
    });

    fireEvent(getByTestId('morning-reminder-toggle'), 'valueChange', true);

    await waitFor(() => {
      expect(notifee.createTriggerNotification).toHaveBeenCalled();
    });

    // No interaction — the outcome stays null
    const outcomes = await notificationOutcomeRepository.getRecentByPeriod(
      'morning',
      1,
    );
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0].outcome).toBeNull();
    expect(outcomes[0].respondedAt).toBeNull();
  });
});
