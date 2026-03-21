import notifee, {TriggerType, AndroidImportance} from '@notifee/react-native';
import {Habit, ReminderPeriod} from '../../types';
import {notificationOutcomeRepository} from '../database/notificationOutcomeRepository';

const CHANNEL_ID = 'wellness-tracker-default';

const REMINDER_COPY: Record<ReminderPeriod, {title: string; body: string}> = {
  morning: {
    title: 'Good morning! How are you feeling?',
    body: 'Start your day with a wellness check-in.',
  },
  midday: {
    title: 'How are you feeling today?',
    body: 'Take a moment to check in with yourself.',
  },
  evening: {
    title: 'How was your day?',
    body: 'Reflect on your day with an evening check-in.',
  },
};

function checkInReminderId(period: ReminderPeriod): string {
  return `check-in-reminder-${period}`;
}

function habitNotificationId(habitId: string): string {
  return `habit-reminder-${habitId}`;
}

function randomOffset(): number {
  return Math.floor(Math.random() * 20 - 10) * 60 * 1000;
}

function buildOneShotTrigger(hours: number, minutes: number) {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hours, minutes, 0, 0);

  if (trigger.getTime() <= now.getTime()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  const timestamp = trigger.getTime() + randomOffset();

  return {
    type: TriggerType.TIMESTAMP as const,
    timestamp,
  };
}

function buildDailyTrigger(hours: number, minutes: number) {
  const trigger = buildOneShotTrigger(hours, minutes);
  return {
    ...trigger,
    repeatFrequency: 1, // RepeatFrequency.DAILY
  };
}

export const notificationService = {
  async setupChannel(): Promise<void> {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Wellness Tracker',
      importance: AndroidImportance.HIGH,
    });
  },

  async scheduleCheckInReminder(
    period: ReminderPeriod,
    time: string,
  ): Promise<void> {
    const [hours, minutes] = time.split(':').map(Number);
    const trigger = buildOneShotTrigger(hours, minutes);
    const copy = REMINDER_COPY[period];

    const outcomeRecord = await notificationOutcomeRepository.recordSent({
      reminderPeriod: period,
      scheduledTime: time,
    });

    await notifee.createTriggerNotification(
      {
        id: checkInReminderId(period),
        title: copy.title,
        body: copy.body,
        android: {
          channelId: CHANNEL_ID,
          pressAction: {id: 'default'},
          actions: [
            {
              title: 'Check In',
              pressAction: {id: 'CHECK_IN', launchActivity: 'default'},
            },
            {title: 'Snooze 15m', pressAction: {id: 'SNOOZE_CHECK_IN'}},
          ],
        },
        data: {
          type: 'check-in-reminder',
          reminderPeriod: period,
          scheduledTime: time,
          outcomeId: outcomeRecord.id,
        },
      },
      trigger,
    );
  },

  async cancelCheckInReminder(period: ReminderPeriod): Promise<void> {
    await notifee.cancelNotification(checkInReminderId(period));
  },

  async rescheduleCheckInReminder(
    period: ReminderPeriod,
    time: string,
  ): Promise<void> {
    await this.cancelCheckInReminder(period);
    await this.scheduleCheckInReminder(period, time);
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
        body: 'Keep your streak going!',
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
