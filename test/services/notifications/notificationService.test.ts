import notifee, {TriggerType, RepeatFrequency} from '@notifee/react-native';
import {notificationService} from '../../../src/services/notifications/notificationService';
import {Habit} from '../../../src/types';

beforeEach(() => {
  jest.clearAllMocks();
});

const makeHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'h1',
  name: 'Drink Water',
  category: 'water',
  frequency: 'daily',
  targetCount: 8,
  color: '#3498db',
  icon: 'water',
  isActive: true,
  createdAt: 100,
  reminderTime: '09:00',
  ...overrides,
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

  describe('scheduleDailyCheckIn', () => {
    it('creates a daily trigger notification', async () => {
      await notificationService.scheduleDailyCheckIn('09:00');

      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'daily-check-in-reminder',
          title: 'How are you feeling today?',
          data: {type: 'daily-check-in'},
        }),
        expect.objectContaining({
          type: TriggerType.TIMESTAMP,
          repeatFrequency: RepeatFrequency.DAILY,
        }),
      );
    });
  });

  describe('cancelDailyCheckIn', () => {
    it('cancels the daily check-in notification', async () => {
      await notificationService.cancelDailyCheckIn();
      expect(notifee.cancelNotification).toHaveBeenCalledWith(
        'daily-check-in-reminder',
      );
    });
  });

  describe('scheduleHabitReminder', () => {
    it('creates a trigger notification with stable ID', async () => {
      const habit = makeHabit();
      await notificationService.scheduleHabitReminder(habit);

      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'habit-reminder-h1',
          title: 'Time for: Drink Water',
          data: {type: 'habit-reminder', habitId: 'h1'},
        }),
        expect.objectContaining({
          type: TriggerType.TIMESTAMP,
          repeatFrequency: RepeatFrequency.DAILY,
        }),
      );
    });

    it('includes COMPLETE_HABIT and SNOOZE_HABIT actions', async () => {
      await notificationService.scheduleHabitReminder(makeHabit());

      const call = (notifee.createTriggerNotification as jest.Mock).mock.calls[0];
      const actions = call[0].android.actions;
      expect(actions).toHaveLength(2);
      expect(actions[0].pressAction.id).toBe('COMPLETE_HABIT');
      expect(actions[1].pressAction.id).toBe('SNOOZE_HABIT');
    });

    it('does nothing if habit has no reminderTime', async () => {
      await notificationService.scheduleHabitReminder(
        makeHabit({reminderTime: undefined}),
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
      const habit = makeHabit();
      await notificationService.rescheduleHabitReminder(habit);

      expect(notifee.cancelNotification).toHaveBeenCalledWith('habit-reminder-h1');
      expect(notifee.createTriggerNotification).toHaveBeenCalled();
    });
  });

  describe('cancelAll', () => {
    it('cancels all notifications', async () => {
      await notificationService.cancelAll();
      expect(notifee.cancelAllNotifications).toHaveBeenCalled();
    });
  });
});
