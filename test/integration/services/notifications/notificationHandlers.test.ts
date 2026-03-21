import notifee, {EventType} from '@notifee/react-native';
import {registerNotificationHandlers} from '../../../../src/services/notifications/notificationHandlers';
import {habitRepository} from '../../../../src/services/database/habitRepository';
import {notificationService} from '../../../../src/services/notifications/notificationService';
import {notificationOutcomeRepository} from '../../../../src/services/database/notificationOutcomeRepository';
import {setupTestDatabase} from '../../../helpers/database';

jest.mock('../../../../src/services/database/habitRepository');
jest.mock('../../../../src/services/notifications/notificationService');

const mockedHabitRepo = habitRepository as jest.Mocked<typeof habitRepository>;
const mockedNotifService = notificationService as jest.Mocked<
  typeof notificationService
>;

setupTestDatabase();

describe('notificationHandlers', () => {
  let backgroundHandler: (event: any) => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();
    registerNotificationHandlers();
    backgroundHandler = (notifee.onBackgroundEvent as jest.Mock).mock
      .calls[0][0];
  });

  it('registers a background event handler', () => {
    expect(notifee.onBackgroundEvent).toHaveBeenCalledWith(
      expect.any(Function),
    );
  });

  it('ignores non-ACTION_PRESS and non-DISMISSED events', async () => {
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
      expect(notifee.cancelNotification).toHaveBeenCalledWith(
        'habit-reminder-h1',
      );
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

  describe('check-in reminder outcome tracking', () => {
    async function createOutcomeAndGetId(): Promise<string> {
      const record = await notificationOutcomeRepository.recordSent({
        reminderPeriod: 'morning',
        scheduledTime: '09:00',
      });
      return record.id;
    }

    it('records dismissed outcome on OS swipe-away', async () => {
      const outcomeId = await createOutcomeAndGetId();

      await backgroundHandler({
        type: EventType.DISMISSED,
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

      const outcomes = await notificationOutcomeRepository.getRecentByPeriod(
        'morning',
        1,
      );
      expect(outcomes[0].outcome).toBe('dismissed');
      expect(outcomes[0].respondedAt).not.toBeNull();
    });

    it('records interacted outcome on CHECK_IN press', async () => {
      const outcomeId = await createOutcomeAndGetId();

      await backgroundHandler({
        type: EventType.ACTION_PRESS,
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

      const outcomes = await notificationOutcomeRepository.getRecentByPeriod(
        'morning',
        1,
      );
      expect(outcomes[0].outcome).toBe('interacted');
    });

    it('records snoozed outcome and snoozes notification on SNOOZE_CHECK_IN', async () => {
      mockedNotifService.snoozeNotification.mockResolvedValue(undefined);
      const outcomeId = await createOutcomeAndGetId();

      await backgroundHandler({
        type: EventType.ACTION_PRESS,
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
          pressAction: {id: 'SNOOZE_CHECK_IN'},
        },
      });

      const outcomes = await notificationOutcomeRepository.getRecentByPeriod(
        'morning',
        1,
      );
      expect(outcomes[0].outcome).toBe('snoozed');
      expect(mockedNotifService.snoozeNotification).toHaveBeenCalledWith(
        'check-in-reminder-morning',
        15,
      );
    });

    it('does not record outcome for DISMISSED on non-check-in notifications', async () => {
      await backgroundHandler({
        type: EventType.DISMISSED,
        detail: {
          notification: {
            id: 'habit-reminder-h1',
            data: {type: 'habit-reminder', habitId: 'h1'},
          },
        },
      });

      const outcomes = await notificationOutcomeRepository.getRecentByPeriod(
        'morning',
        10,
      );
      expect(outcomes).toHaveLength(0);
    });
  });
});
