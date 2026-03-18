import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
} from '@notifee/react-native';
import {Habit} from '../../types';

const CHANNEL_ID = 'wellness-tracker-default';
const DAILY_CHECK_IN_ID = 'daily-check-in-reminder';

export const notificationService = {
  async setupChannel(): Promise<void> {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Wellness Tracker',
      importance: AndroidImportance.HIGH,
    });
  },

  async scheduleDailyCheckIn(time: string): Promise<void> {
    const [hours, minutes] = time.split(':').map(Number);
    const trigger = buildDailyTrigger(hours, minutes);

    await notifee.createTriggerNotification(
      {
        id: DAILY_CHECK_IN_ID,
        title: 'How are you feeling today?',
        body: 'Take a moment to check in with yourself.',
        android: {
          channelId: CHANNEL_ID,
          pressAction: {id: 'default'},
          actions: [
            {title: 'Check In', pressAction: {id: 'CHECK_IN', launchActivity: 'default'}},
            {title: 'Dismiss', pressAction: {id: 'DISMISS'}},
          ],
        },
        data: {type: 'daily-check-in'},
      },
      trigger,
    );
  },

  async cancelDailyCheckIn(): Promise<void> {
    await notifee.cancelNotification(DAILY_CHECK_IN_ID);
  },

  async scheduleHabitReminder(habit: Habit): Promise<void> {
    if (!habit.reminderTime) {
      return;
    }

    const [hours, minutes] = habit.reminderTime.split(':').map(Number);
    const trigger = buildDailyTrigger(hours, minutes);
    const notificationId = habitNotificationId(habit.id);

    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: `Time for: ${habit.name}`,
        body: `Keep your streak going!`,
        android: {
          channelId: CHANNEL_ID,
          pressAction: {id: 'default'},
          actions: [
            {title: 'Done!', pressAction: {id: 'COMPLETE_HABIT'}},
            {title: 'Snooze 30m', pressAction: {id: 'SNOOZE_HABIT'}},
          ],
        },
        data: {type: 'habit-reminder', habitId: habit.id},
      },
      trigger,
    );
  },

  async cancelHabitReminder(habitId: string): Promise<void> {
    await notifee.cancelNotification(habitNotificationId(habitId));
  },

  async rescheduleHabitReminder(habit: Habit): Promise<void> {
    await this.cancelHabitReminder(habit.id);
    await this.scheduleHabitReminder(habit);
  },

  async snoozeNotification(
    notificationId: string,
    minutesFromNow: number = 30,
  ): Promise<void> {
    const timestamp = Date.now() + minutesFromNow * 60 * 1000;
    const existing = await notifee.getTriggerNotifications();
    const original = existing.find(
      (n: any) => n.notification?.id === notificationId,
    );

    if (original?.notification) {
      await notifee.createTriggerNotification(original.notification, {
        type: TriggerType.TIMESTAMP,
        timestamp,
      });
    }
  },

  async cancelAll(): Promise<void> {
    await notifee.cancelAllNotifications();
  },
};

function habitNotificationId(habitId: string): string {
  return `habit-reminder-${habitId}`;
}

function buildDailyTrigger(hours: number, minutes: number) {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hours, minutes, 0, 0);

  if (trigger.getTime() <= now.getTime()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  return {
    type: TriggerType.TIMESTAMP as const,
    timestamp: trigger.getTime(),
    repeatFrequency: RepeatFrequency.DAILY,
  };
}
