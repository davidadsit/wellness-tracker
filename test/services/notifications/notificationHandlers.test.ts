import notifee, {EventType} from '@notifee/react-native';
import {registerNotificationHandlers} from '../../../src/services/notifications/notificationHandlers';
import {habitRepository} from '../../../src/services/database/habitRepository';
import {notificationService} from '../../../src/services/notifications/notificationService';

jest.mock('../../../src/services/database/habitRepository');
jest.mock('../../../src/services/notifications/notificationService');

const mockedHabitRepo = habitRepository as jest.Mocked<typeof habitRepository>;
const mockedNotifService = notificationService as jest.Mocked<typeof notificationService>;

describe('notificationHandlers', () => {
  let backgroundHandler: (event: any) => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();
    registerNotificationHandlers();
    backgroundHandler = (notifee.onBackgroundEvent as jest.Mock).mock.calls[0][0];
  });

  it('registers a background event handler', () => {
    expect(notifee.onBackgroundEvent).toHaveBeenCalledWith(expect.any(Function));
  });

  it('ignores non-ACTION_PRESS events', async () => {
    await backgroundHandler({
      type: EventType.DELIVERED,
      detail: {notification: {id: 'n1'}, pressAction: {id: 'COMPLETE_HABIT'}},
    });
    expect(mockedHabitRepo.completeHabit).not.toHaveBeenCalled();
  });

  describe('COMPLETE_HABIT action', () => {
    it('completes habit via repository and cancels notification', async () => {
      mockedHabitRepo.completeHabit.mockReturnValue({
        id: 'c1',
        habitId: 'h1',
        date: '2024-01-15',
        count: 1,
        completedAt: 100,
        source: 'notification',
      });

      await backgroundHandler({
        type: EventType.ACTION_PRESS,
        detail: {
          notification: {id: 'habit-reminder-h1', data: {habitId: 'h1'}},
          pressAction: {id: 'COMPLETE_HABIT'},
        },
      });

      expect(mockedHabitRepo.completeHabit).toHaveBeenCalledWith('h1', {
        source: 'notification',
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      });
      expect(notifee.cancelNotification).toHaveBeenCalledWith('habit-reminder-h1');
    });

    it('does nothing if no habitId in notification data', async () => {
      await backgroundHandler({
        type: EventType.ACTION_PRESS,
        detail: {
          notification: {id: 'n1', data: {}},
          pressAction: {id: 'COMPLETE_HABIT'},
        },
      });
      expect(mockedHabitRepo.completeHabit).not.toHaveBeenCalled();
    });
  });

  describe('SNOOZE_HABIT action', () => {
    it('snoozes the notification by 30 minutes', async () => {
      mockedNotifService.snoozeNotification.mockResolvedValue(undefined);

      await backgroundHandler({
        type: EventType.ACTION_PRESS,
        detail: {
          notification: {id: 'habit-reminder-h1', data: {habitId: 'h1'}},
          pressAction: {id: 'SNOOZE_HABIT'},
        },
      });

      expect(mockedNotifService.snoozeNotification).toHaveBeenCalledWith(
        'habit-reminder-h1',
        30,
      );
    });
  });

  describe('DISMISS action', () => {
    it('cancels the notification', async () => {
      await backgroundHandler({
        type: EventType.ACTION_PRESS,
        detail: {
          notification: {id: 'daily-check-in-reminder', data: {}},
          pressAction: {id: 'DISMISS'},
        },
      });
      expect(notifee.cancelNotification).toHaveBeenCalledWith(
        'daily-check-in-reminder',
      );
    });
  });
});
