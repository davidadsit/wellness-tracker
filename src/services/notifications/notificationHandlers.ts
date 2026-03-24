import notifee, {EventType} from '@notifee/react-native';
import {habitRepository} from '../database/habitRepository';
import {notificationOutcomeRepository} from '../database/notificationOutcomeRepository';
import {notificationService} from './notificationService';
import {NotificationOutcome} from '../../types';
import {format} from 'date-fns';
import {ulid} from '../../utils/ulid';

function isCheckInReminder(notification: any): boolean {
  return notification?.data?.type === 'check-in-reminder';
}

async function recordCheckInOutcome(
  notification: any,
  outcome: NotificationOutcome,
): Promise<void> {
  const outcomeId = notification?.data?.outcomeId as string | undefined;
  if (outcomeId) {
    await notificationOutcomeRepository.saveOutcome(outcomeId, outcome);
  }
}

export function registerNotificationHandlers(): void {
  notifee.onBackgroundEvent(async ({type, detail}) => {
    const {notification, pressAction} = detail;

    if (type === EventType.DISMISSED) {
      if (isCheckInReminder(notification)) {
        await recordCheckInOutcome(notification, 'dismissed');
      }
      return;
    }

    if (type !== EventType.ACTION_PRESS) {
      return;
    }

    const habitId = notification?.data?.habitId as string | undefined;

    switch (pressAction?.id) {
      case 'CHECK_IN':
        if (isCheckInReminder(notification)) {
          await recordCheckInOutcome(notification, 'interacted');
        }
        break;

      case 'SNOOZE_CHECK_IN':
        if (isCheckInReminder(notification) && notification?.id) {
          await recordCheckInOutcome(notification, 'snoozed');
          await notificationService.snoozeNotification(notification.id, 15);
        }
        break;

      case 'COMPLETE_HABIT':
        if (habitId && notification?.id) {
          await habitRepository.saveCompletion({
            id: ulid(),
            habitId,
            date: format(new Date(), 'yyyy-MM-dd'),
            count: 1,
            completedAt: Date.now(),
            source: 'notification',
          });
          await notifee.cancelNotification(notification.id);
        }
        break;

      case 'SNOOZE_HABIT':
        if (notification?.id) {
          await notificationService.snoozeNotification(notification.id, 30);
        }
        break;

      case 'DISMISS':
        if (notification?.id) {
          await notifee.cancelNotification(notification.id);
        }
        break;
    }
  });
}
