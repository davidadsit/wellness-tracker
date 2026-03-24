import notifee, {TriggerType} from '@notifee/react-native';
import {notificationService} from '../../../../src/services/notifications/notificationService';
import {makeHabit} from '../../../helpers/factories';
import {setupTestDatabase} from '../../../helpers/database';
import {notificationOutcomeRepository} from '../../../../src/services/database/notificationOutcomeRepository';

setupTestDatabase();

beforeEach(() => {
  jest.clearAllMocks();
});

describe('notificationService', () => {
  describe('setupChannel', () => {
    it('creates a notification channel', async () => {
      await notificationService.setupChannel();
      expect(notifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'wellness-tracker-default',
          name: 'Wellness Tracker',
        }),
      );
    });
  });

  describe('scheduleCheckInReminder', () => {
    it('creates a one-shot trigger notification for a period', async () => {
      await notificationService.scheduleCheckInReminder('morning', '09:00');

      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'check-in-reminder-morning',
          title: 'Good morning! How are you feeling?',
          data: expect.objectContaining({
            type: 'check-in-reminder',
            reminderPeriod: 'morning',
            scheduledTime: '09:00',
          }),
        }),
        expect.objectContaining({
          type: TriggerType.TIMESTAMP,
        }),
      );
    });

    it('does not use a repeat frequency', async () => {
      await notificationService.scheduleCheckInReminder('midday', '13:00');

      const trigger = (notifee.createTriggerNotification as jest.Mock).mock
        .calls[0][1];
      expect(trigger.repeatFrequency).toBeUndefined();
    });

    it('includes CHECK_IN and SNOOZE_CHECK_IN actions', async () => {
      await notificationService.scheduleCheckInReminder('evening', '19:00');

      const notification = (notifee.createTriggerNotification as jest.Mock).mock
        .calls[0][0];
      const actions = notification.android.actions;
      expect(actions).toHaveLength(2);
      expect(actions[0].pressAction.id).toBe('CHECK_IN');
      expect(actions[1].pressAction.id).toBe('SNOOZE_CHECK_IN');
    });

    it('records a sent outcome with null outcome', async () => {
      await notificationService.scheduleCheckInReminder('morning', '09:00');

      const outcomes = await notificationOutcomeRepository.loadRecentByPeriod(
        'morning',
        1,
      );
      expect(outcomes).toHaveLength(1);
      expect(outcomes[0].outcome).toBeNull();
      expect(outcomes[0].scheduledTime).toBe('09:00');
    });

    it('includes the outcomeId in notification data', async () => {
      await notificationService.scheduleCheckInReminder('midday', '13:00');

      const notification = (notifee.createTriggerNotification as jest.Mock).mock
        .calls[0][0];
      expect(notification.data.outcomeId).toBeDefined();

      const outcomes = await notificationOutcomeRepository.loadRecentByPeriod(
        'midday',
        1,
      );
      expect(notification.data.outcomeId).toBe(outcomes[0].id);
    });

    it('uses period-specific copy for each period', async () => {
      await notificationService.scheduleCheckInReminder('morning', '09:00');
      await notificationService.scheduleCheckInReminder('midday', '13:00');
      await notificationService.scheduleCheckInReminder('evening', '19:00');

      const calls = (notifee.createTriggerNotification as jest.Mock).mock.calls;
      expect(calls[0][0].title).toBe('Good morning! How are you feeling?');
      expect(calls[1][0].title).toBe('How are you feeling today?');
      expect(calls[2][0].title).toBe('How was your day?');
    });
  });

  describe('cancelCheckInReminder', () => {
    it('cancels the notification by period ID', async () => {
      await notificationService.cancelCheckInReminder('morning');
      expect(notifee.cancelNotification).toHaveBeenCalledWith(
        'check-in-reminder-morning',
      );
    });
  });

  describe('rescheduleCheckInReminder', () => {
    it('cancels then reschedules', async () => {
      await notificationService.rescheduleCheckInReminder('midday', '14:00');

      expect(notifee.cancelNotification).toHaveBeenCalledWith(
        'check-in-reminder-midday',
      );
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'check-in-reminder-midday',
          data: expect.objectContaining({scheduledTime: '14:00'}),
        }),
        expect.anything(),
      );
    });
  });

  describe('scheduleHabitReminder', () => {
    it('creates a trigger notification with stable ID', async () => {
      const habit = makeHabit({id: 'h1', reminderTime: '09:00'});
      await notificationService.scheduleHabitReminder(habit);

      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'habit-reminder-h1',
          title: 'Time for: Drink Water',
          data: {type: 'habit-reminder', habitId: 'h1'},
        }),
        expect.objectContaining({
          type: TriggerType.TIMESTAMP,
        }),
      );
    });

    it('includes COMPLETE_HABIT and SNOOZE_HABIT actions', async () => {
      await notificationService.scheduleHabitReminder(
        makeHabit({id: 'h1', reminderTime: '09:00'}),
      );

      const call = (notifee.createTriggerNotification as jest.Mock).mock
        .calls[0];
      const actions = call[0].android.actions;
      expect(actions).toHaveLength(2);
      expect(actions[0].pressAction.id).toBe('COMPLETE_HABIT');
      expect(actions[1].pressAction.id).toBe('SNOOZE_HABIT');
    });

    it('does nothing if habit has no reminderTime', async () => {
      await notificationService.scheduleHabitReminder(
        makeHabit({id: 'h1', reminderTime: undefined}),
      );
      expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
    });
  });

  describe('cancelHabitReminder', () => {
    it('cancels by stable habit notification ID', async () => {
      await notificationService.cancelHabitReminder('h1');
      expect(notifee.cancelNotification).toHaveBeenCalledWith(
        'habit-reminder-h1',
      );
    });
  });

  describe('rescheduleHabitReminder', () => {
    it('cancels then reschedules', async () => {
      const habit = makeHabit({id: 'h1', reminderTime: '09:00'});
      await notificationService.rescheduleHabitReminder(habit);

      expect(notifee.cancelNotification).toHaveBeenCalledWith(
        'habit-reminder-h1',
      );
      expect(notifee.createTriggerNotification).toHaveBeenCalled();
    });
  });

  describe('snoozeNotification', () => {
    it('reschedules an existing notification with delayed timestamp', async () => {
      const originalNotification = {
        id: 'habit-reminder-h1',
        title: 'Time for: Drink Water',
      };
      (notifee.getTriggerNotifications as jest.Mock).mockResolvedValueOnce([
        {notification: originalNotification},
      ]);

      await notificationService.snoozeNotification('habit-reminder-h1', 30);

      expect(notifee.getTriggerNotifications).toHaveBeenCalled();
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        originalNotification,
        expect.objectContaining({
          type: TriggerType.TIMESTAMP,
        }),
      );
    });

    it('does nothing when notification not found', async () => {
      (notifee.getTriggerNotifications as jest.Mock).mockResolvedValueOnce([]);

      await notificationService.snoozeNotification('nonexistent');

      expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
    });
  });

  describe('cancelAll', () => {
    it('cancels all notifications', async () => {
      await notificationService.cancelAll();
      expect(notifee.cancelAllNotifications).toHaveBeenCalled();
    });
  });
});
